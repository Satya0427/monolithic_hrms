import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { async_error_handler } from '../../../common/utils/async_error_handler';
import { apiDataResponse, apiResponse } from '../../../common/utils/api_response';
import { MESSAGES } from '../../../common/utils/messages';
import { EMPLOYEE_SALARY_ASSIGNMENT_MODEL, IEarningsSnapshot, IDeductionsSnapshot } from '../../../common/schemas/payroll-module-schema/payroll-structure/employee_salary_assignment.schema';
import { PAYROLL_SALARY_TEMPLATE_MODEL } from '../../../common/schemas/payroll-module-schema/payroll-structure/payroll_salary_template.schema';
import { PAYROLL_SALARY_COMPONENT_MODEL } from '../../../common/schemas/payroll-module-schema/payroll-structure/payroll_salary_components.schema';

interface CustomRequest extends Request {
    user?: {
        user_id: string;
        session_id: string;
        organization_id?: string;
    };
}

const normalizeEarningValueType = (valueType: string): IEarningsSnapshot['value_type'] => {
    const normalized = valueType?.toLowerCase();
    if (normalized === 'fixed' || normalized === 'percentage' || normalized === 'formula') {
        return normalized;
    }
    return 'fixed';
};

const normalizeDeductionCalculationType = (calculationType: string): IDeductionsSnapshot['calculation_type'] => {
    const normalized = calculationType?.toLowerCase();
    if (normalized === 'fixed' || normalized === 'percentage' || normalized === 'percentage_of_basic' || normalized === 'formula') {
        return normalized;
    }
    return 'fixed';
};

// ========================================
// 🔹 EMPLOYEE SALARY ASSIGNMENT REGION
// ========================================

// ASSIGN SALARY TO EMPLOYEE
const assignSalaryAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const {
        employee_uuid,
        template_id,
        annual_ctc,
        monthly_gross,
        effective_from,
        payroll_start_month,
        status,
        earnings_snapshot,
        deductions_snapshot
    } = req.body;

    //  BUSINESS LOGIC 1: Only one active salary record per employee
    const existingActive = await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.findOne({
        organization_id: new Types.ObjectId(organization_id),
        employee_uuid: new Types.ObjectId(employee_uuid),
        is_active: true,
        is_deleted: false
    });

    if (existingActive) {
        res.status(409).json(apiResponse(409, 'Employee already has an active salary assignment. Revise instead of creating new.'));
        return;
    }

    //  BUSINESS LOGIC 2: Verify template exists and is active
    const template = await PAYROLL_SALARY_TEMPLATE_MODEL.findOne({
        _id: new Types.ObjectId(template_id),
        organization_id: new Types.ObjectId(organization_id),
        status: 'ACTIVE',
        is_deleted: false
    });

    if (!template) {
        res.status(400).json(apiResponse(400, 'Template not found or is inactive'));
        return;
    }

    //  BUSINESS LOGIC 3: Validate earnings snapshot is provided
    if (!earnings_snapshot || earnings_snapshot.length === 0) {
        res.status(400).json(apiResponse(400, 'Earnings snapshot is required and cannot be empty'));
        return;
    }

    //  BUSINESS LOGIC 4: Validate deductions snapshot is provided
    if (!deductions_snapshot || deductions_snapshot.length === 0) {
        res.status(400).json(apiResponse(400, 'Deductions snapshot is required and cannot be empty'));
        return;
    }

    //  BUSINESS LOGIC 5: Validate annual CTC matches total earnings
    const totalEarningsAnnual = earnings_snapshot.reduce((sum: number, e: any) => sum + (e.annual_value || 0), 0);
    const ctcTolerance = annual_ctc * 0.02; // 2% tolerance

    if (Math.abs(totalEarningsAnnual - annual_ctc) > ctcTolerance) {
        res.status(400).json(apiResponse(400, `CTC mismatch. Earnings total: ${totalEarningsAnnual}, Expected: ${annual_ctc}`));
        return;
    }

    //  BUSINESS LOGIC 6: Transform and normalize earnings snapshot
    const normalizedEarningsSnapshot: IEarningsSnapshot[] = earnings_snapshot.map((earning: any) => ({
        component_id: new Types.ObjectId(earning.component_id),
        component_code: earning.component_code,
        component_name: earning.component_name,
        value_type: normalizeEarningValueType(earning.value_type),
        fixed_amount: earning.fixed_amount,
        percentage: earning.percentage,
        formula: earning.formula,
        monthly_value: Math.round(earning.monthly_value * 100) / 100,
        annual_value: Math.round(earning.annual_value * 100) / 100,
        override_allowed: earning.override_allowed !== undefined ? earning.override_allowed : true,
        is_mandatory: earning.is_mandatory || false,
        calculation_order: earning.calculation_order || 0
    }));

    //  BUSINESS LOGIC 7: Transform and normalize deductions snapshot
    const normalizedDeductionsSnapshot: IDeductionsSnapshot[] = deductions_snapshot.map((deduction: any) => ({
        component_id: new Types.ObjectId(deduction.component_id),
        component_code: deduction.component_code,
        component_name: deduction.component_name,
        deduction_nature: deduction.deduction_nature,
        calculation_type: normalizeDeductionCalculationType(deduction.calculation_type),
        percentage: deduction.percentage,
        fixed_amount: deduction.fixed_amount,
        formula: deduction.formula,
        employer_contribution: typeof deduction.employer_contribution === 'number' ? deduction.employer_contribution : Number(deduction.employer_contribution) || 0,
        employee_contribution: typeof deduction.employee_contribution === 'number' ? deduction.employee_contribution : Number(deduction.employee_contribution) || 0,
        max_cap: deduction.max_cap,
        monthly_value: Math.round(deduction.monthly_value * 100) / 100,
        override_allowed: deduction.override_allowed !== undefined ? deduction.override_allowed : true
    }));

    // Create assignment with snapshots
    const assignmentPayload: any = {
        organization_id: new Types.ObjectId(organization_id),
        employee_uuid: new Types.ObjectId(employee_uuid),
        template_id: new Types.ObjectId(template_id),
        annual_ctc,
        monthly_gross: Math.round(monthly_gross * 100) / 100,
        effective_from: new Date(effective_from),
        payroll_start_month: payroll_start_month ? new Date(payroll_start_month) : null,
        status: status || 'ACTIVE',
        version: 1,
        earnings_snapshot: normalizedEarningsSnapshot,
        deductions_snapshot: normalizedDeductionsSnapshot,
        is_active: true,
        is_deleted: false,
        created_by: new Types.ObjectId(user_id)
    };

    const assignment = new EMPLOYEE_SALARY_ASSIGNMENT_MODEL(assignmentPayload);
    const created = await assignment.save();

    //  UPDATE TEMPLATE: Increment employees_count
    await PAYROLL_SALARY_TEMPLATE_MODEL.updateOne(
        { _id: new Types.ObjectId(template_id) },
        { $inc: { employees_count: 1 } }
    );

    res.status(201).json(apiDataResponse(201, 'Salary assigned successfully', {
        assignment_id: created._id,
        version: 1,
        annual_ctc,
        monthly_gross: Math.round(monthly_gross * 100) / 100
    }));
});

//  GET EMPLOYEE CURRENT SALARY
const getEmployeeSalaryAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { employee_uuid } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const assignment = await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.findOne({
        organization_id: new Types.ObjectId(organization_id),
        employee_uuid: new Types.ObjectId(employee_uuid),
        is_active: true,
        is_deleted: false
    })
        .populate('template_id', 'template_name template_code status')
        .lean();

    if (!assignment) {
        res.status(404).json(apiResponse(404, 'No active salary assignment found for this employee'));
        return;
    }

    // Calculate summary
    const earningsSummary = {
        total_monthly: assignment.earnings_snapshot.reduce((sum, e) => sum + e.monthly_value, 0),
        total_annual: assignment.earnings_snapshot.reduce((sum, e) => sum + e.annual_value, 0),
        count: assignment.earnings_snapshot.length
    };

    const deductionsSummary = {
        total_monthly: assignment.deductions_snapshot.reduce((sum, d) => sum + d.monthly_value, 0),
        count: assignment.deductions_snapshot.length
    };

    const netSalary = {
        monthly: earningsSummary.total_monthly - deductionsSummary.total_monthly,
        annual: earningsSummary.total_annual - (deductionsSummary.total_monthly * 12)
    };

    const enhancedAssignment = {
        ...assignment,
        earnings_summary: earningsSummary,
        deductions_summary: deductionsSummary,
        net_salary: netSalary
    };

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, enhancedAssignment));
});

//  EVISE SALARY (Create new version, deactivate old)
const reviseSalaryAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { employee_uuid, template_id, annual_ctc, monthly_gross, effective_from, payroll_start_month, earnings_overrides, reason } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    // Get current active assignment
    const currentAssignment = await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.findOne({
        organization_id: new Types.ObjectId(organization_id),
        employee_uuid: new Types.ObjectId(employee_uuid),
        is_active: true,
        is_deleted: false
    });

    if (!currentAssignment) {
        res.status(404).json(apiResponse(404, 'No active salary assignment found to revise'));
        return;
    }

    // 🔴 BUSINESS LOGIC: Effective date cannot be before current active assignment
    const effectiveDate = new Date(effective_from);
    if (effectiveDate < currentAssignment.effective_from) {
        res.status(400).json(apiResponse(400, 'Effective date cannot be before current assignment date'));
        return;
    }

    // Prepare new assignment data
    const newTemplateId = template_id || currentAssignment.template_id;
    const newAnnualCtc = annual_ctc || currentAssignment.annual_ctc;
    const newMonthlyGross = monthly_gross || currentAssignment.monthly_gross;

    // If template changed, fetch and validate new template
    let template = currentAssignment.template_id.equals(newTemplateId)
        ? null
        : await PAYROLL_SALARY_TEMPLATE_MODEL.findOne({
            _id: new Types.ObjectId(newTemplateId),
            organization_id: new Types.ObjectId(organization_id),
            status: 'ACTIVE',
            is_deleted: false
        });

    if (template_id && !template) {
        res.status(400).json(apiResponse(400, 'New template not found or is inactive'));
        return;
    }

    // Use current template if not changing
    if (!template) {
        template = await PAYROLL_SALARY_TEMPLATE_MODEL.findById(currentAssignment.template_id).lean() as any;
    }

    // Fetch components
    const allComponentIds = [
        ...template!.earnings.map((e:any) => new Types.ObjectId(e.component_id)),
        ...template!.deductions.map((d:any) => new Types.ObjectId(d.component_id))
    ];

    const components = await PAYROLL_SALARY_COMPONENT_MODEL.find({
        _id: { $in: allComponentIds },
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    }).lean();

    // Create new earnings snapshot with overrides
    const newEarningsSnapshot: IEarningsSnapshot[] = [];
    let totalEarningsAnnual = 0;

    for (const earning of template!.earnings) {
        const component = components.find(c => c._id.equals(earning.component_id));
        if (!component) continue;

        // Check for overrides
        const override = earnings_overrides?.find((o: any) => o.component_id === earning.component_id.toString());

        let monthlyValue = override?.monthly_value || 0;
        let annualValue = override?.annual_value || 0;

        if (!override) {
            // Calculate values same as assignment
            if (earning.value_type === 'fixed') {
                monthlyValue = earning.fixed_amount || 0;
            } else if (earning.value_type === 'percentage') {
                annualValue = (newAnnualCtc * (earning.percentage || 0)) / 100;
                monthlyValue = annualValue / 12;
            } else {
                // For formula or other types
                monthlyValue = earning.fixed_amount || 0;
            }
            annualValue = monthlyValue * 12;
        }

        totalEarningsAnnual += annualValue;

        newEarningsSnapshot.push({
            component_id: new Types.ObjectId(earning.component_id),
            component_code: component.component_code,
            component_name: component.component_name,
            value_type: normalizeEarningValueType(earning.value_type),
            fixed_amount: earning.fixed_amount,
            percentage: earning.percentage,
            formula: earning.formula,
            monthly_value: Math.round(monthlyValue * 100) / 100,
            annual_value: Math.round(annualValue * 100) / 100,
            override_allowed: earning.override_allowed,
            is_mandatory: earning.is_mandatory,
            calculation_order: earning.calculation_order
        });
    }

    // Create new deductions snapshot
    const newDeductionsSnapshot: IDeductionsSnapshot[] = [];
    for (const deduction of template!.deductions) {
        const component = components.find(c => c._id.equals(deduction.component_id));
        if (!component) continue;

        let monthlyValue = 0;
        if (component.calculation_type === 'fixed') {
            monthlyValue = component.fixed_amount || 0;
        } else if (component.calculation_type === 'percentage_of_basic') {
            if (component.percentage !== undefined) {
                const basicComponent = components.find(c => c.is_basic === true);
                if (basicComponent) {
                    const basicMonthly = basicComponent.fixed_amount || 0;
                    monthlyValue = (basicMonthly * component.percentage) / 100;
                    if (component.max_cap && monthlyValue > component.max_cap) {
                        monthlyValue = component.max_cap;
                    }
                }
            }
        }

        newDeductionsSnapshot.push({
            component_id: new Types.ObjectId(deduction.component_id),
            component_code: component.component_code,
            component_name: component.component_name,
            deduction_nature: component.deduction_nature,
            calculation_type: normalizeDeductionCalculationType(component.calculation_type),
            percentage: component.percentage,
            fixed_amount: component.fixed_amount,
            formula: component.formula,
            employer_contribution: typeof component.employer_contribution === 'number' ? component.employer_contribution : Number(component.employer_contribution) || 0,
            employee_contribution: typeof component.employee_contribution === 'number' ? component.employee_contribution : Number(component.employee_contribution) || 0,
            max_cap: component.max_cap,
            monthly_value: Math.round(monthlyValue * 100) / 100,
            override_allowed: deduction.override_allowed
        });
    }

    // Deactivate old assignment
    await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.updateOne(
        { _id: currentAssignment._id },
        {
            $set: {
                is_active: false,
                status: 'REVISED',
                updated_by: new Types.ObjectId(user_id)
            }
        }
    );

    // Create new revised assignment
    const revisedAssignmentPayload: any = {
        organization_id: new Types.ObjectId(organization_id),
        employee_uuid: new Types.ObjectId(employee_uuid),
        template_id: new Types.ObjectId(newTemplateId),
        annual_ctc: newAnnualCtc,
        monthly_gross: newMonthlyGross,
        effective_from: effectiveDate,
        payroll_start_month: payroll_start_month ? new Date(payroll_start_month) : (currentAssignment.payroll_start_month || null),
        status: 'ACTIVE',
        version: (currentAssignment.version || 0) + 1,
        earnings_snapshot: newEarningsSnapshot,
        deductions_snapshot: newDeductionsSnapshot,
        is_active: true,
        is_deleted: false,
        created_by: new Types.ObjectId(user_id)
    };

    const revisedAssignment = new EMPLOYEE_SALARY_ASSIGNMENT_MODEL(revisedAssignmentPayload);
    const created = await revisedAssignment.save();

    res.status(201).json(apiDataResponse(201, 'Salary revised successfully', {
        assignment_id: created._id,
        version: created.version,
        previous_version: currentAssignment.version
    }));
});

//  GET SALARY HISTORY
const getSalaryHistoryAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { employee_uuid, page, limit } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query = {
        organization_id: new Types.ObjectId(organization_id),
        employee_uuid: new Types.ObjectId(employee_uuid),
        is_deleted: false
    };

    const totalCount = await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.countDocuments(query);

    const history = await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.find(query)
        .select('version status effective_from annual_ctc monthly_gross is_active createdAt')
        .sort({ version: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, {
        history,
        pagination: {
            current_page: pageNum,
            total_pages: totalPages,
            total_count: totalCount,
            limit: limitNum,
            has_next: pageNum < totalPages,
            has_prev: pageNum > 1
        }
    }));
});

//  GET ALL ASSIGNMENTS (Employee List)
const getAllAssignmentsAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { status, search, department_id, page, limit } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    };

    // Filter by assignment status
    if (status === 'ASSIGNED') {
        query.is_active = true;
    } else if (status === 'NOT_ASSIGNED') {
        // This would need a different query - employees without assignments
        // For now, filtering by is_active
        query.is_active = false;
    }

    const totalCount = await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.countDocuments(query);
    const pipeline: any[] = [
        {
            $match: {
                status: "ACTIVE"
            }
        },
        {
            $lookup: {
                from: "employee_details",
                localField: "employee_uuid",
                foreignField: "_id",
                as: "Employee_details"
            }
        },
        {
            $unwind: {
                path: "$Employee_details"
            }
        },
        {
            $lookup: {
                from: "payroll_salary_templates",
                localField: "template_id",
                foreignField: "_id",
                as: "template_details"
            }
        },
        {
            $unwind: {
                path: "$template_details"
            }
        },
        // {
        //     $project: {
        //         template_id: 1,
        //         template_name:
        //             "$template_details.template_name",
        //         template_code:
        //             "$template_details.template_code",
        //         deductions: "$deductions_snapshot",
        //         earnings: "$earnings_snapshot",
        //         employee: 1,
        //         employee_email:
        //             "$Employee_details.personal_details.email",
        //         employee_id:
        //             "$Employee_details.job_details.employee_id",
        //         annual_ctc: "$annual_ctc",
        //         monthly_gross: "$monthly_gross",
        //         employee_name: {
        //             $concat: [
        //                 "$Employee_details.personal_details.firstName",
        //                 " ",
        //                 "$Employee_details.personal_details.lastName"
        //             ]
        //         }
        //     }
        // }
    ]

    const assignments = await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.aggregate(pipeline);

    // Enhance with computed field: Used By (employees_count from template)
    const enhancedAssignments = assignments.map(a => ({
        ...a,
        status_display: a.is_active ? 'ACTIVE' : 'REVISED'
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, {
        assignments: enhancedAssignments,
        pagination: {
            current_page: pageNum,
            total_pages: totalPages,
            total_count: totalCount,
            limit: limitNum,
            has_next: pageNum < totalPages,
            has_prev: pageNum > 1
        }
    }));
});

//  GET ASSIGNMENT BY ID
const getAssignmentByIdAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { id, employee_id } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const query: any = {
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    };

    if (id) {
        query._id = new Types.ObjectId(id);
    } else {
        query.employee_id = new Types.ObjectId(employee_id);
        query.is_active = true;
    }

    const assignment = await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.findOne(query)
        .populate('employee_id', 'employee_name employee_id department_id designation_id email')
        .populate('template_id', 'template_name template_code status')
        .lean();

    if (!assignment) {
        res.status(404).json(apiResponse(404, 'Assignment not found'));
        return;
    }

    // Calculate summaries
    const earningsSummary = {
        total_monthly: assignment.earnings_snapshot.reduce((sum, e) => sum + e.monthly_value, 0),
        total_annual: assignment.earnings_snapshot.reduce((sum, e) => sum + e.annual_value, 0),
        components: assignment.earnings_snapshot.length
    };

    const deductionsSummary = {
        total_monthly: assignment.deductions_snapshot.reduce((sum, d) => sum + d.monthly_value, 0),
        total_annual: assignment.deductions_snapshot.reduce((sum, d) => sum + (d.monthly_value * 12), 0),
        components: assignment.deductions_snapshot.length
    };

    const netSalary = {
        monthly: earningsSummary.total_monthly - deductionsSummary.total_monthly,
        annual: earningsSummary.total_annual - deductionsSummary.total_annual
    };

    const enhancedAssignment = {
        ...assignment,
        earnings_summary: earningsSummary,
        deductions_summary: deductionsSummary,
        net_salary: netSalary
    };

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, enhancedAssignment));
});

//  DEACTIVATE SALARY
const deactivateSalaryAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { id, reason } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const assignment = await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.findOne({
        _id: new Types.ObjectId(id),
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    });

    if (!assignment) {
        res.status(404).json(apiResponse(404, 'Assignment not found'));
        return;
    }

    // Update to inactive
    await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.updateOne(
        { _id: new Types.ObjectId(id) },
        {
            $set: {
                is_active: false,
                status: 'INACTIVE',
                updated_by: new Types.ObjectId(user_id)
            }
        }
    );

    // Decrement template employees_count
    await PAYROLL_SALARY_TEMPLATE_MODEL.updateOne(
        { _id: assignment.template_id },
        { $inc: { employees_count: -1 } }
    );

    res.status(200).json(apiResponse(200, 'Salary assignment deactivated successfully'));
});



// ========================================
// 🔹 EXPORTS
// ========================================

export {
    assignSalaryAPIHandler,
    getEmployeeSalaryAPIHandler,
    reviseSalaryAPIHandler,
    getSalaryHistoryAPIHandler,
    getAllAssignmentsAPIHandler,
    getAssignmentByIdAPIHandler,
    deactivateSalaryAPIHandler
};

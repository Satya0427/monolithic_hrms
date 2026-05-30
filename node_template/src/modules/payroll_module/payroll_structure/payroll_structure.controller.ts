import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { async_error_handler } from '../../../common/utils/async_error_handler';
import { apiDataResponse, apiResponse } from '../../../common/utils/api_response';
import { MESSAGES } from '../../../common/utils/messages';
import { PAYROLL_SALARY_COMPONENT_MODEL } from '../../../common/schemas/payroll-module-schema/payroll-structure/payroll_salary_components.schema';
import { PAYROLL_SALARY_TEMPLATE_MODEL } from '../../../common/schemas/payroll-module-schema/payroll-structure/payroll_salary_template.schema';

interface CustomRequest extends Request {
    user?: {
        user_id: string;
        session_id: string;
        organization_id?: string;
    };
}

//#region PAYROLL COMPONENTS
//  CREATE COMPONENT
const createComponentAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const {
        component_type,
        component_name,
        component_code,
        component_category,
        description,
        effective_from,
        status,
        is_basic,
        deduction_nature,
        calculation_type,
        fixed_amount,
        percentage,
        formula,
        employer_contribution,
        employee_contribution,
        max_cap,
        claim_based,
        attachment_required,
        approval_required,
        max_limit_per_month,
        pay_frequency,
        linked_to_kpi,
        auto_calculate,
        manual_override,
        taxable,
        pf_applicable,
        esi_applicable,
        professional_tax_applicable,
        show_in_payslip,
        pro_rated,
        include_in_ctc
    } = req.body;

    // BUSINESS LOGIC: Check component_code uniqueness per organization
    const existingCode = await PAYROLL_SALARY_COMPONENT_MODEL.findOne({
        organization_id: new Types.ObjectId(organization_id),
        component_code: component_code.toUpperCase(),
        is_deleted: false
    });

    if (existingCode) {
        res.status(409).json(apiResponse(409, 'Component code already exists in this organization'));
        return;
    }

    // BUSINESS LOGIC: Only one is_basic=true allowed for earning
    if (is_basic && component_type === 'EARNINGS') {
        const existingBasic = await PAYROLL_SALARY_COMPONENT_MODEL.findOne({
            organization_id: new Types.ObjectId(organization_id),
            component_type: 'EARNINGS',
            is_basic: true,
            is_deleted: false
        });

        if (existingBasic) {
            res.status(409).json(apiResponse(409, 'Basic component already exists for this organization'));
            return;
        }
    }

    // BUSINESS LOGIC: Calculation type validation
    if (calculation_type === 'fixed' && !fixed_amount) {
        res.status(400).json(apiResponse(400, 'Fixed amount is required when calculation type is fixed'));
        return;
    }

    if (calculation_type === 'percentage_of_basic' && !percentage) {
        res.status(400).json(apiResponse(400, 'Percentage is required when calculation type is percentage_of_basic'));
        return;
    }

    if (calculation_type === 'formula' && !formula) {
        res.status(400).json(apiResponse(400, 'Formula is required when calculation type is formula'));
        return;
    }

    // BUSINESS LOGIC: Deduction must have deduction_nature
    if (component_type === 'DEDUCTIONS' && !deduction_nature) {
        res.status(400).json(apiResponse(400, 'Deduction nature is required for deduction components'));
        return;
    }

    // Create component
    const payload: any = {
        organization_id: new Types.ObjectId(organization_id),
        component_type,
        component_name,
        component_code: component_code.toUpperCase(),
        component_category,
        description,
        effective_from: new Date(effective_from),
        status: status || 'ACTIVE',
        is_basic,
        deduction_nature,
        calculation_type,
        fixed_amount,
        percentage,
        formula,
        employer_contribution,
        employee_contribution,
        max_cap,
        claim_based,
        attachment_required,
        approval_required,
        max_limit_per_month,
        pay_frequency,
        linked_to_kpi,
        auto_calculate,
        manual_override,
        taxable,
        pf_applicable,
        esi_applicable,
        professional_tax_applicable,
        show_in_payslip,
        pro_rated,
        include_in_ctc,
        is_deleted: false,
        created_by: new Types.ObjectId(user_id)
    };

    const component = new PAYROLL_SALARY_COMPONENT_MODEL(payload);
    const created = await component.save();

    res.status(201).json(apiDataResponse(201, 'Component created successfully', {
        component_id: created._id
    }));
});

// GET ALL COMPONENTS
const getAllComponentsAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const { type, status, search, page, limit } = req.body;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    };

    // Filter by component type
    if (type) {
        query.component_type = type;
    }

    // Filter by status
    if (status && status !== 'ALL') {
        query.status = status;
    }

    // Search by name or code
    if (search) {
        query.$or = [
            { component_name: { $regex: search, $options: 'i' } },
            { component_code: { $regex: search, $options: 'i' } }
        ];
    }

    const totalCount = await PAYROLL_SALARY_COMPONENT_MODEL.countDocuments(query);

    const components = await PAYROLL_SALARY_COMPONENT_MODEL.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, {
        components,
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

//  GET SINGLE COMPONENT
const getComponentByIdAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { id } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const component = await PAYROLL_SALARY_COMPONENT_MODEL.findOne({
        _id: new Types.ObjectId(id),
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    }).lean();

    if (!component) {
        res.status(404).json(apiResponse(404, 'Component not found'));
        return;
    }

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, component));
});

// UPDATE COMPONENT
const updateComponentAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { id } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const component = await PAYROLL_SALARY_COMPONENT_MODEL.findOne({
        _id: new Types.ObjectId(id),
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    });

    if (!component) {
        res.status(404).json(apiResponse(404, 'Component not found'));
        return;
    }

    const {
        component_name,
        component_code,
        component_category,
        description,
        effective_from,
        status,
        is_basic,
        deduction_nature,
        calculation_type,
        fixed_amount,
        percentage,
        formula,
        employer_contribution,
        employee_contribution,
        max_cap,
        claim_based,
        attachment_required,
        approval_required,
        max_limit_per_month,
        pay_frequency,
        linked_to_kpi,
        auto_calculate,
        manual_override,
        taxable,
        pf_applicable,
        esi_applicable,
        professional_tax_applicable,
        show_in_payslip,
        pro_rated,
        include_in_ctc
    } = req.body;

    // 🔴 BUSINESS LOGIC: Check component_code uniqueness (if being changed)
    if (component_code && component_code.toUpperCase() !== component.component_code) {
        const existingCode = await PAYROLL_SALARY_COMPONENT_MODEL.findOne({
            organization_id: new Types.ObjectId(organization_id),
            component_code: component_code.toUpperCase(),
            _id: { $ne: new Types.ObjectId(id) },
            is_deleted: false
        });

        if (existingCode) {
            res.status(409).json(apiResponse(409, 'Component code already exists in this organization'));
            return;
        }
    }

    // 🔴 BUSINESS LOGIC: Only one is_basic=true allowed
    if (is_basic && component.component_type === 'EARNINGS') {
        const existingBasic = await PAYROLL_SALARY_COMPONENT_MODEL.findOne({
            organization_id: new Types.ObjectId(organization_id),
            component_type: 'EARNINGS',
            is_basic: true,
            _id: { $ne: new Types.ObjectId(id) },
            is_deleted: false
        });

        if (existingBasic) {
            res.status(409).json(apiResponse(409, 'Another basic component already exists for this organization'));
            return;
        }
    }

    // 🔴 BUSINESS LOGIC: Calculation type validation
    const finalCalculationType = calculation_type || component.calculation_type;
    const finalFixedAmount = fixed_amount !== undefined ? fixed_amount : component.fixed_amount;
    const finalPercentage = percentage !== undefined ? percentage : component.percentage;
    const finalFormula = formula !== undefined ? formula : component.formula;

    if (finalCalculationType === 'fixed' && !finalFixedAmount) {
        res.status(400).json(apiResponse(400, 'Fixed amount is required when calculation type is fixed'));
        return;
    }

    if (finalCalculationType === 'percentage_of_basic' && !finalPercentage) {
        res.status(400).json(apiResponse(400, 'Percentage is required when calculation type is percentage_of_basic'));
        return;
    }

    if (finalCalculationType === 'formula' && !finalFormula) {
        res.status(400).json(apiResponse(400, 'Formula is required when calculation type is formula'));
        return;
    }

    // Update component
    const updateData: any = {
        component_name,
        component_code: component_code?.toUpperCase(),
        component_category,
        description,
        effective_from: effective_from ? new Date(effective_from) : undefined,
        status,
        is_basic,
        deduction_nature,
        calculation_type,
        fixed_amount,
        percentage,
        formula,
        employer_contribution,
        employee_contribution,
        max_cap,
        claim_based,
        attachment_required,
        approval_required,
        max_limit_per_month,
        pay_frequency,
        linked_to_kpi,
        auto_calculate,
        manual_override,
        taxable,
        pf_applicable,
        esi_applicable,
        professional_tax_applicable,
        show_in_payslip,
        pro_rated,
        include_in_ctc,
        updated_by: new Types.ObjectId(user_id)
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    await PAYROLL_SALARY_COMPONENT_MODEL.updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: updateData }
    );

    res.status(200).json(apiResponse(200, 'Component updated successfully'));
});

// TOGGLE STATUS
const toggleStatusAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { id } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const component = await PAYROLL_SALARY_COMPONENT_MODEL.findOne({
        _id: new Types.ObjectId(id),
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    });

    if (!component) {
        res.status(404).json(apiResponse(404, 'Component not found'));
        return;
    }

    const newStatus = component.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    await PAYROLL_SALARY_COMPONENT_MODEL.updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: { status: newStatus } }
    );

    res.status(200).json(apiDataResponse(200, `Component ${newStatus}`, {
        new_status: newStatus
    }));
});

// SOFT DELETE
const deleteComponentAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { id } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const component = await PAYROLL_SALARY_COMPONENT_MODEL.findOne({
        _id: new Types.ObjectId(id),
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    });

    if (!component) {
        res.status(404).json(apiResponse(404, 'Component not found'));
        return;
    }

    // 🔴 BUSINESS LOGIC: Cannot delete statutory deduction
    if (component.component_type === 'DEDUCTIONS' && component.deduction_nature === 'statutory') {
        res.status(403).json(apiResponse(403, 'Cannot delete statutory deduction components'));
        return;
    }

    // TODO: 🔴 BUSINESS LOGIC: Cannot delete if used in template
    // This check should be implemented when salary template model is ready
    // const usedInTemplate = await SALARY_TEMPLATE_MODEL.findOne({...});
    // if (usedInTemplate) { ... }

    // Soft delete
    await PAYROLL_SALARY_COMPONENT_MODEL.updateOne(
        { _id: new Types.ObjectId(id) },
        {
            $set: {
                is_deleted: true,
                updated_by: new Types.ObjectId(user_id)
            }
        }
    );

    res.status(200).json(apiResponse(200, 'Component deleted successfully'));
});
// #endregion

// #region PAYROLL TEMPLATES
// ========================================
// 🔹 PAYROLL TEMPLATES REGION
// ========================================

//  CREATE TEMPLATE
const createTemplateAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const {
        template_name,
        template_code,
        description,
        effective_from,
        status,
        earnings,
        deductions,
        ctc_preview,
        allow_manual_override,
        lock_after_assignment,
        version_control_enabled
    } = req.body;

    // BUSINESS LOGIC 1: Template code uniqueness per organization
    const existingCode = await PAYROLL_SALARY_TEMPLATE_MODEL.findOne({
        organization_id: new Types.ObjectId(organization_id),
        template_code: template_code.toUpperCase(),
        is_deleted: false
    });

    if (existingCode) {
        res.status(409).json(apiResponse(409, 'Template code already exists in this organization'));
        return;
    }

    // BUSINESS LOGIC 2: At least one earning component required
    if (!earnings || earnings.length === 0) {
        res.status(400).json(apiResponse(400, 'At least one earning component is required'));
        return;
    }

    // BUSINESS LOGIC 3: Must have ONE BASIC component
    const earningComponentIds = earnings.map((e: any) => new Types.ObjectId(e.component_id));

    const earningComponents = await PAYROLL_SALARY_COMPONENT_MODEL.find({
        _id: { $in: earningComponentIds },
        organization_id: new Types.ObjectId(organization_id),
        component_type: 'EARNINGS',
        is_deleted: false
    });

    if (earningComponents.length !== earnings.length) {
        res.status(400).json(apiResponse(400, 'One or more earning components not found or invalid'));
        return;
    }

    const hasBasic = earningComponents.some(comp => comp.is_basic === true);
    if (!hasBasic) {
        res.status(400).json(apiResponse(400, 'Template must have at least one BASIC earning component'));
        return;
    }

    // BUSINESS LOGIC 4: Only ONE basic component allowed
    const basicCount = earningComponents.filter(comp => comp.is_basic === true).length;
    if (basicCount > 1) {
        res.status(400).json(apiResponse(400, 'Template cannot have more than one BASIC earning component'));
        return;
    }

    // BUSINESS LOGIC 5: Cannot add same component twice
    const uniqueEarningIds = new Set(earnings.map((e: any) => e.component_id));
    if (uniqueEarningIds.size !== earnings.length) {
        res.status(400).json(apiResponse(400, 'Duplicate earning components not allowed'));
        return;
    }

    // BUSINESS LOGIC 6: Validate deductions
    if (deductions && deductions.length > 0) {
        const deductionComponentIds = deductions.map((d: any) => new Types.ObjectId(d.component_id));

        const deductionComponents = await PAYROLL_SALARY_COMPONENT_MODEL.find({
            _id: { $in: deductionComponentIds },
            organization_id: new Types.ObjectId(organization_id),
            component_type: 'DEDUCTIONS',
            is_deleted: false
        });

        if (deductionComponents.length !== deductions.length) {
            res.status(400).json(apiResponse(400, 'One or more deduction components not found or invalid'));
            return;
        }

        // Check for duplicate deductions
        const uniqueDeductionIds = new Set(deductions.map((d: any) => d.component_id));
        if (uniqueDeductionIds.size !== deductions.length) {
            res.status(400).json(apiResponse(400, 'Duplicate deduction components not allowed'));
            return;
        }
    }

    // BUSINESS LOGIC 7: Percentage total validation (if applicable)
    const percentageEarnings = earnings.filter((e: any) => e.value_type === 'PERCENTAGE');
    if (percentageEarnings.length > 0) {
        const totalPercentage = percentageEarnings.reduce((sum: number, e: any) => sum + (e.percentage || 0), 0);
        if (totalPercentage > 100) {
            res.status(400).json(apiResponse(400, `Total percentage of earnings cannot exceed 100%. Current: ${totalPercentage}%`));
            return;
        }
    }

    // Create Template
    const templatePayload: any = {
        organization_id: new Types.ObjectId(organization_id),
        template_name,
        template_code: template_code.toUpperCase(),
        description,
        effective_from: new Date(effective_from),
        status: status || 'ACTIVE',
        earnings: earnings.map((e: any) => ({
            component_id: new Types.ObjectId(e.component_id),
            value_type: e.value_type,
            fixed_amount: e.fixed_amount,
            percentage: e.percentage,
            formula: e.formula,
            override_allowed: e.override_allowed || false,
            calculation_order: e.calculation_order,
            is_mandatory: e.is_mandatory !== undefined ? e.is_mandatory : true
        })),
        deductions: deductions ? deductions.map((d: any) => ({
            component_id: new Types.ObjectId(d.component_id),
            override_allowed: d.override_allowed || false,
            value_type: d.value_type,
            fixed_amount: d.fixed_amount,
            percentage: d.percentage,
            formula: d.formula,
            calculation_order: d.calculation_order,
            is_mandatory: d.is_mandatory !== undefined ? d.is_mandatory : true
        })) : [],
        ctc_preview: ctc_preview || {},
        allow_manual_override: allow_manual_override || false,
        lock_after_assignment: lock_after_assignment || false,
        version_control_enabled: version_control_enabled || false,
        version: 1,
        employees_count: 0,
        is_deleted: false,
        created_by: new Types.ObjectId(user_id)
    };

    const template = new PAYROLL_SALARY_TEMPLATE_MODEL(templatePayload);
    const created = await template.save();

    res.status(201).json(apiDataResponse(201, 'Template created successfully', {
        template_id: created._id
    }));
});

//  GET ALL TEMPLATES
const getAllTemplatesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const { status, search, page, limit } = req.body;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    };

    // Filter by status
    if (status) {
        query.status = status;
    }

    // Search by name or code
    if (search) {
        query.$or = [
            { template_name: { $regex: search, $options: 'i' } },
            { template_code: { $regex: search, $options: 'i' } }
        ];
    }

    const totalCount = await PAYROLL_SALARY_TEMPLATE_MODEL.countDocuments(query);

    const templates = await PAYROLL_SALARY_TEMPLATE_MODEL.find(query)
        .select('template_name template_code status earnings deductions ctc_preview employees_count createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    // Enhance with computed fields
    const enhancedTemplates = templates.map(template => ({
        ...template,
        total_earnings_count: template.earnings?.length || 0,
        total_deductions_count: template.deductions?.length || 0,
        monthly_ctc_preview: template.ctc_preview?.monthly_gross || template.ctc_preview?.total_monthly_earnings || 0,
        used_by: template.employees_count || 0
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, {
        templates: enhancedTemplates,
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

// GET TEMPLATE BY ID
const getTemplateByIdAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { id } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const template = await PAYROLL_SALARY_TEMPLATE_MODEL.findOne({
        _id: new Types.ObjectId(id),
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    })
        .populate('earnings.component_id', 'component_name component_code component_type calculation_type is_basic')
        .populate('deductions.component_id', 'component_name component_code component_type calculation_type deduction_nature')
        .lean();

    if (!template) {
        res.status(404).json(apiResponse(404, 'Template not found'));
        return;
    }

    // Add computed fields
    const enhancedTemplate = {
        ...template,
        total_earnings_count: template.earnings?.length || 0,
        total_deductions_count: template.deductions?.length || 0,
        used_by: template.employees_count || 0
    };

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, enhancedTemplate));
});

//  UPDATE TEMPLATE
const updateTemplateAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { id } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const template = await PAYROLL_SALARY_TEMPLATE_MODEL.findOne({
        _id: new Types.ObjectId(id),
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    });

    if (!template) {
        res.status(404).json(apiResponse(404, 'Template not found'));
        return;
    }

    const {
        template_name,
        template_code,
        description,
        effective_from,
        status,
        earnings,
        deductions,
        ctc_preview,
        allow_manual_override,
        lock_after_assignment,
        version_control_enabled
    } = req.body;

    // BUSINESS LOGIC 1: Version control - create new version if assigned to employees
    if (template.employees_count > 0 && template.version_control_enabled) {
        // Create new version instead of updating
        const newVersion = template.version + 1;

        const newTemplatePayload: any = {
            organization_id: new Types.ObjectId(organization_id),
            template_name: template_name || template.template_name,
            template_code: template.template_code, // Keep same code but different version
            description: description !== undefined ? description : template.description,
            effective_from: effective_from ? new Date(effective_from) : template.effective_from,
            status: status || template.status,
            earnings: earnings || template.earnings,
            deductions: deductions || template.deductions,
            ctc_preview: ctc_preview || template.ctc_preview,
            allow_manual_override: allow_manual_override !== undefined ? allow_manual_override : template.allow_manual_override,
            lock_after_assignment: lock_after_assignment !== undefined ? lock_after_assignment : template.lock_after_assignment,
            version_control_enabled: version_control_enabled !== undefined ? version_control_enabled : template.version_control_enabled,
            version: newVersion,
            parent_template_id: template._id,
            employees_count: 0,
            is_deleted: false,
            created_by: new Types.ObjectId(user_id)
        };

        const newTemplate = new PAYROLL_SALARY_TEMPLATE_MODEL(newTemplatePayload);
        const created = await newTemplate.save();

        res.status(201).json(apiDataResponse(201, `New version (v${newVersion}) created successfully. Old assignments preserved.`, {
            template_id: created._id,
            version: newVersion,
            parent_template_id: template._id
        }));
        return;
    }

    // BUSINESS LOGIC 2: Cannot edit effective_from if assigned to employees
    if (template.employees_count > 0 && effective_from && new Date(effective_from).getTime() !== template.effective_from.getTime()) {
        res.status(403).json(apiResponse(403, 'Cannot change effective date when template is assigned to employees'));
        return;
    }

    // BUSINESS LOGIC 3: Template code uniqueness (if being changed)
    if (template_code && template_code.toUpperCase() !== template.template_code) {
        const existingCode = await PAYROLL_SALARY_TEMPLATE_MODEL.findOne({
            organization_id: new Types.ObjectId(organization_id),
            template_code: template_code.toUpperCase(),
            _id: { $ne: new Types.ObjectId(id) },
            is_deleted: false
        });

        if (existingCode) {
            res.status(409).json(apiResponse(409, 'Template code already exists in this organization'));
            return;
        }
    }

    // BUSINESS LOGIC 4: Validate earnings if provided
    if (earnings) {
        if (earnings.length === 0) {
            res.status(400).json(apiResponse(400, 'At least one earning component is required'));
            return;
        }

        const earningComponentIds = earnings.map((e: any) => new Types.ObjectId(e.component_id));

        const earningComponents = await PAYROLL_SALARY_COMPONENT_MODEL.find({
            _id: { $in: earningComponentIds },
            organization_id: new Types.ObjectId(organization_id),
            component_type: 'EARNINGS',
            is_deleted: false
        });

        if (earningComponents.length !== earnings.length) {
            res.status(400).json(apiResponse(400, 'One or more earning components not found or invalid'));
            return;
        }

        const hasBasic = earningComponents.some(comp => comp.is_basic === true);
        if (!hasBasic) {
            res.status(400).json(apiResponse(400, 'Template must have at least one BASIC earning component'));
            return;
        }

        const basicCount = earningComponents.filter(comp => comp.is_basic === true).length;
        if (basicCount > 1) {
            res.status(400).json(apiResponse(400, 'Template cannot have more than one BASIC earning component'));
            return;
        }

        // Check duplicates
        const uniqueEarningIds = new Set(earnings.map((e: any) => e.component_id));
        if (uniqueEarningIds.size !== earnings.length) {
            res.status(400).json(apiResponse(400, 'Duplicate earning components not allowed'));
            return;
        }

        // Percentage validation
        const percentageEarnings = earnings.filter((e: any) => e.value_type === 'PERCENTAGE');
        if (percentageEarnings.length > 0) {
            const totalPercentage = percentageEarnings.reduce((sum: number, e: any) => sum + (e.percentage || 0), 0);
            if (totalPercentage > 100) {
                res.status(400).json(apiResponse(400, `Total percentage of earnings cannot exceed 100%. Current: ${totalPercentage}%`));
                return;
            }
        }
    }

    // BUSINESS LOGIC 5: Validate deductions if provided
    if (deductions && deductions.length > 0) {
        const deductionComponentIds = deductions.map((d: any) => new Types.ObjectId(d.component_id));

        const deductionComponents = await PAYROLL_SALARY_COMPONENT_MODEL.find({
            _id: { $in: deductionComponentIds },
            organization_id: new Types.ObjectId(organization_id),
            component_type: 'DEDUCTIONS',
            is_deleted: false
        });

        if (deductionComponents.length !== deductions.length) {
            res.status(400).json(apiResponse(400, 'One or more deduction components not found or invalid'));
            return;
        }

        const uniqueDeductionIds = new Set(deductions.map((d: any) => d.component_id));
        if (uniqueDeductionIds.size !== deductions.length) {
            res.status(400).json(apiResponse(400, 'Duplicate deduction components not allowed'));
            return;
        }
    }

    // Update template
    const updateData: any = {
        template_name,
        template_code: template_code?.toUpperCase(),
        description,
        effective_from: effective_from ? new Date(effective_from) : undefined,
        status,
        allow_manual_override,
        lock_after_assignment,
        version_control_enabled,
        ctc_preview,
        updated_by: new Types.ObjectId(user_id)
    };

    if (earnings) {
        updateData.earnings = earnings.map((e: any) => ({
            component_id: new Types.ObjectId(e.component_id),
            value_type: e.value_type,
            fixed_amount: e.fixed_amount,
            percentage: e.percentage,
            formula: e.formula,
            override_allowed: e.override_allowed || false,
            calculation_order: e.calculation_order,
            is_mandatory: e.is_mandatory !== undefined ? e.is_mandatory : true
        }));
    }

    if (deductions !== undefined) {
        updateData.deductions = deductions.map((d: any) => ({
            component_id: new Types.ObjectId(d.component_id),
            override_allowed: d.override_allowed || false,
            value_type: d.value_type,
            fixed_amount: d.fixed_amount,
            percentage: d.percentage,
            formula: d.formula,
            calculation_order: d.calculation_order,
            is_mandatory: d.is_mandatory !== undefined ? d.is_mandatory : true
        }));
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    await PAYROLL_SALARY_TEMPLATE_MODEL.updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: updateData }
    );

    res.status(200).json(apiResponse(200, 'Template updated successfully'));
});

// DUPLICATE TEMPLATE
const duplicateTemplateAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { id, new_template_name, new_template_code } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    // Find original template
    const originalTemplate = await PAYROLL_SALARY_TEMPLATE_MODEL.findOne({
        _id: new Types.ObjectId(id),
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    }).lean();

    if (!originalTemplate) {
        res.status(404).json(apiResponse(404, 'Template not found'));
        return;
    }

    // BUSINESS LOGIC: New template code must be unique
    const existingCode = await PAYROLL_SALARY_TEMPLATE_MODEL.findOne({
        organization_id: new Types.ObjectId(organization_id),
        template_code: new_template_code.toUpperCase(),
        is_deleted: false
    });

    if (existingCode) {
        res.status(409).json(apiResponse(409, 'Template code already exists in this organization'));
        return;
    }

    // Create duplicate with new name and code
    const duplicatePayload: any = {
        organization_id: new Types.ObjectId(organization_id),
        template_name: new_template_name,
        template_code: new_template_code.toUpperCase(),
        description: originalTemplate.description,
        effective_from: new Date(), // Set current date for duplicated template
        status: 'INACTIVE', // Start as inactive
        earnings: originalTemplate.earnings,
        deductions: originalTemplate.deductions,
        ctc_preview: originalTemplate.ctc_preview,
        allow_manual_override: originalTemplate.allow_manual_override,
        lock_after_assignment: originalTemplate.lock_after_assignment,
        version_control_enabled: originalTemplate.version_control_enabled,
        version: 1, // Reset version
        employees_count: 0, // No employees assigned
        is_deleted: false,
        created_by: new Types.ObjectId(user_id)
    };

    const duplicate = new PAYROLL_SALARY_TEMPLATE_MODEL(duplicatePayload);
    const created = await duplicate.save();

    res.status(201).json(apiDataResponse(201, 'Template duplicated successfully', {
        template_id: created._id,
        template_name: new_template_name,
        template_code: new_template_code.toUpperCase()
    }));
});

// TOGGLE STATUS
const toggleTemplateStatusAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { id } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const template = await PAYROLL_SALARY_TEMPLATE_MODEL.findOne({
        _id: new Types.ObjectId(id),
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    });

    if (!template) {
        res.status(404).json(apiResponse(404, 'Template not found'));
        return;
    }

    const newStatus = template.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    await PAYROLL_SALARY_TEMPLATE_MODEL.updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: { status: newStatus } }
    );

    res.status(200).json(apiDataResponse(200, `Template ${newStatus.toLowerCase()}`, {
        new_status: newStatus
    }));
});

// SOFT DELETE
const deleteTemplateAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { id } = req.body;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const template = await PAYROLL_SALARY_TEMPLATE_MODEL.findOne({
        _id: new Types.ObjectId(id),
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    });

    if (!template) {
        res.status(404).json(apiResponse(404, 'Template not found'));
        return;
    }

    //  BUSINESS LOGIC: Cannot delete if assigned to employees
    if (template.employees_count > 0) {
        res.status(403).json(apiResponse(403, `Cannot delete template. Currently assigned to ${template.employees_count} employee(s)`));
        return;
    }

    // Soft delete
    await PAYROLL_SALARY_TEMPLATE_MODEL.updateOne(
        { _id: new Types.ObjectId(id) },
        {
            $set: {
                is_deleted: true,
                updated_by: new Types.ObjectId(user_id)
            }
        }
    );

    res.status(200).json(apiResponse(200, 'Template deleted successfully'));
});

// 8️⃣ GET TEMPLATES FOR ASSIGNMENT DROPDOWN
const getTemplatesForAssignmentAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;

    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const { search } = req.body;

    const query: any = {
        organization_id: new Types.ObjectId(organization_id),
        status: 'ACTIVE',
        is_deleted: false
    };

    // Search by name or code
    if (search) {
        query.$or = [
            { template_name: { $regex: search, $options: 'i' } },
            { template_code: { $regex: search, $options: 'i' } }
        ];
    }

    // Fetch templates with populated earnings and deductions
    const templates = await PAYROLL_SALARY_TEMPLATE_MODEL.find(query)
        .select('_id template_name template_code status earnings deductions employees_count')
        .lean();

    // Get all component IDs from all templates
    const allComponentIds = new Set<string>();
    templates.forEach(template => {
        template.earnings.forEach((e: any) => allComponentIds.add(e.component_id.toString()));
        template.deductions.forEach((d: any) => allComponentIds.add(d.component_id.toString()));
    });

    // Fetch all components in one query
    const components = await PAYROLL_SALARY_COMPONENT_MODEL.find({
        _id: { $in: Array.from(allComponentIds).map(id => new Types.ObjectId(id)) },
        organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    }).lean();

    // Create component lookup map
    const componentMap = new Map();
    components.forEach(comp => {
        componentMap.set(comp._id.toString(), comp);
    });

    // Enrich templates with full component details
    const enrichedTemplates = templates.map(template => {
        const enrichedEarnings = template.earnings.map((e: any) => {
            const component = componentMap.get(e.component_id.toString());
            return {
                _id: e.component_id,
                component_id: e.component_id,
                component_name: component?.component_name || '',
                component_code: component?.component_code || '',
                component_type: component?.component_type || 'EARNINGS',
                value_type: e.value_type,
                fixed_amount: e.fixed_amount,
                percentage: e.percentage,
                formula: e.formula,
                override_allowed: e.override_allowed,
                calculation_order: e.calculation_order,
                is_mandatory: e.is_mandatory,
                is_basic: component?.is_basic || false,
                calculation_type: component?.calculation_type || 'fixed'
            };
        });

        const enrichedDeductions = template.deductions.map((d: any) => {
            const component = componentMap.get(d.component_id.toString());
            return {
                _id: d.component_id,
                component_id: d.component_id,
                component_name: component?.component_name || '',
                component_code: component?.component_code || '',
                component_type: component?.component_type || 'DEDUCTIONS',
                deduction_nature: component?.deduction_nature,
                calculation_type: component?.calculation_type || 'fixed',
                percentage: component?.percentage,
                fixed_amount: component?.fixed_amount,
                formula: component?.formula,
                employer_contribution: component?.employer_contribution,
                employee_contribution: component?.employee_contribution,
                max_cap: component?.max_cap,
                override_allowed: d.override_allowed
            };
        });

        return {
            _id: template._id,
            template_name: template.template_name,
            template_code: template.template_code,
            status: template.status,
            employees_count: template.employees_count,
            earnings: enrichedEarnings,
            deductions: enrichedDeductions,
            total_earnings_count: enrichedEarnings.length,
            total_deductions_count: enrichedDeductions.length
        };
    });

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, enrichedTemplates));
});
// #endregion

export {
    createComponentAPIHandler,
    getAllComponentsAPIHandler,
    getComponentByIdAPIHandler,
    updateComponentAPIHandler,
    toggleStatusAPIHandler,
    deleteComponentAPIHandler,
    createTemplateAPIHandler,
    getAllTemplatesAPIHandler,
    getTemplateByIdAPIHandler,
    updateTemplateAPIHandler,
    duplicateTemplateAPIHandler,
    toggleTemplateStatusAPIHandler,
    deleteTemplateAPIHandler,
    getTemplatesForAssignmentAPIHandler
};

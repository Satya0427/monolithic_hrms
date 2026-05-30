
import { Request, Response } from 'express';
import mongoose, { Schema, Types } from 'mongoose';
import { async_error_handler } from '../../../common/utils/async_error_handler';
import { apiDataResponse, apiResponse } from '../../../common/utils/api_response';
import { MESSAGES } from '../../../common/utils/messages';
import { EMPLOYEE_PROFILE_MODEL } from '../../../common/schemas/Employees/employee_onboarding.schema';
import { EMPLOYEE_SALARY_ASSIGNMENT_MODEL } from '../../../common/schemas/payroll-module-schema/payroll-structure/employee_salary_assignment.schema';
import { ATTENDANCE_RECORD_MODEL } from '../../../common/schemas/leave-attendance/attendance/attendance_records.schema';
import { LEAVE_REQUEST_MODEL } from '../../../common/schemas/leave-attendance/leave-configs/leave-requests.schema';
import { LEAVE_TYPE_MODEL } from '../../../common/schemas/leave-attendance/leave-configs/leave-type.schema';
import PAYROLL_RUN_MODEL from '../../../common/schemas/payroll-module-schema/run-payroll/payroll-run.schema';
import PAYROLL_EMPLOYEE_MODEL from '../../../common/schemas/payroll-module-schema/run-payroll/payroll-employee.schema';

interface CustomRequest extends Request {
    user?: {
        user_id: string;
        session_id: string;
        organization_id?: string;
    };
}

// ==== PROCESS PAYROLL API HANDLER ====
const processPayrollAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { payroll_month, payroll_year } = req.body;
    if (!organization_id || !user_id) return void res.status(400).json(apiResponse(400, 'Organization Id and User Id are required'));

    const orgId = new Types.ObjectId(organization_id);
    const userId = new Types.ObjectId(user_id);

    const exists = await PAYROLL_RUN_MODEL.findOne({ organization_id: orgId, payroll_month, payroll_year, is_deleted: false });
    if (exists) return void res.status(409).json(apiResponse(409, 'Payroll for this month already exists. Use recalculate API before lock.'));

    const prev = previousMonth(payroll_month, payroll_year);
    const prevRun = await PAYROLL_RUN_MODEL.findOne({ organization_id: orgId, payroll_month: prev.m, payroll_year: prev.y, is_deleted: false }).lean();
    if (prevRun && prevRun.status !== 'LOCKED') return void res.status(400).json(apiResponse(400, 'Previous month payroll is not locked.'));

    const computation = await computePayroll(orgId, payroll_month, payroll_year);
    if (computation.errors.length) return void res.status(400).json(apiDataResponse(400, 'Payroll processing blocked', { errors: computation.errors, warnings: computation.warnings }));

    const run: any = await PAYROLL_RUN_MODEL.create({
        organization_id: orgId,
        payroll_month,
        payroll_year,
        status: 'DRAFT',
        processed_at: new Date(),
        processed_by: userId,
        warnings: computation.warnings,
        ...computation.summary,
        is_deleted: false,
        created_by: userId
    });

    if (computation.payrollEmployees.length) {
        await PAYROLL_EMPLOYEE_MODEL.insertMany(computation.payrollEmployees.map((e: any) => ({ ...e, organization_id: orgId, payroll_run_id: run._id, is_deleted: false })));
    }

    res.status(201).json(apiDataResponse(201, 'Payroll processed and saved as draft', { payroll_run_id: run._id, status: run.status, summary: computation.summary, warnings: computation.warnings }));
});


const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const monthRange = (m: number, y: number) => ({
    start: new Date(y, m - 1, 1, 0, 0, 0, 0),
    end: new Date(y, m, 0, 23, 59, 59, 999),
    days: new Date(y, m, 0).getDate()
});
const previousMonth = (m: number, y: number) => (m === 1 ? { m: 12, y: y - 1 } : { m: m - 1, y });

const computePayroll = async (organizationId: Types.ObjectId, payroll_month: number, payroll_year: number) => {
    const { start, end, days } = monthRange(payroll_month, payroll_year);
    const warnings: string[] = [];
    const errors: string[] = [];

    const employees = await EMPLOYEE_PROFILE_MODEL.find({
        organization_id: organizationId,
        is_active: true,
        is_deleted: false,
        'job_details.joiningDate': { $lte: end }
    })
        .select('_id job_details.employee_id job_details.department_id personal_details.firstName personal_details.lastName')
        .lean();

    const employeeIds = employees.map((e: any) => new Types.ObjectId(e._id));
    const assignments = await EMPLOYEE_SALARY_ASSIGNMENT_MODEL.find({
        organization_id: organizationId,
        employee_uuid: { $in: employeeIds },
        is_active: true,
        is_deleted: false,
        status: 'ACTIVE',
        effective_from: { $lte: end }
    }).lean();

    const assignmentMap = new Map(assignments.map((a: any) => [a.employee_uuid.toString(), a]));
    const missingAssignments = employees.filter((e: any) => !assignmentMap.has(e._id.toString()));
    if (missingAssignments.length) errors.push(`Salary structure missing for ${missingAssignments.length} employee(s).`);

    const attendanceRows = await ATTENDANCE_RECORD_MODEL.find({
        organization_id: organizationId,
        employee_uuid: { $in: employeeIds },
        attendance_date: { $gte: start, $lte: end }
    })
        .select('employee_uuid status payroll_impact')
        .lean();

    const attendanceMap = new Map<string, any[]>();
    attendanceRows.forEach((r: any) => {
        const key = r.employee_uuid.toString();
        if (!attendanceMap.has(key)) attendanceMap.set(key, []);
        attendanceMap.get(key)!.push(r);
    });

    const unpaidTypeIds = (await LEAVE_TYPE_MODEL.find({ organization_id: organizationId, category: 'UNPAID', is_active: true }).select('_id').lean())
        .map((t: any) => t._id);

    const unpaidLeaves = unpaidTypeIds.length ? await LEAVE_REQUEST_MODEL.find({
        organization_id: organizationId,
        employee_uuid: { $in: employeeIds },
        leave_type_id: { $in: unpaidTypeIds },
        status: 'APPROVED',
        from_date: { $lte: end },
        to_date: { $gte: start }
    }).select('employee_uuid from_date to_date half_day').lean() : [];

    const unpaidMap = new Map<string, number>();
    unpaidLeaves.forEach((l: any) => {
        const key = l.employee_uuid.toString();
        const s = l.from_date > start ? l.from_date : start;
        const e = l.to_date < end ? l.to_date : end;
        const overlap = Math.max(0, Math.floor((new Date(e).getTime() - new Date(s).getTime()) / (1000 * 60 * 60 * 24)) + 1);
        unpaidMap.set(key, (unpaidMap.get(key) || 0) + (l.half_day ? 0.5 : overlap));
    });

    const payrollEmployees: any[] = [];

    for (const emp of employees) {
        const assignment = assignmentMap.get(emp._id.toString());
        if (!assignment) continue;

        const att = attendanceMap.get(emp._id.toString()) || [];
        if (!att.length) warnings.push(`Attendance not synced for employee ${emp.job_details?.employee_id || emp._id}.`);

        let lop = unpaidMap.get(emp._id.toString()) || 0;
        att.forEach((r: any) => {
            const impact = Number(r?.payroll_impact?.deduction_days || 0);
            if (impact > 0) lop += impact;
            else if (r.status === 'ABSENT') lop += 1;
            else if (r.status === 'HALF_DAY') lop += 0.5;
        });

        const gross = round2(assignment.monthly_gross || (assignment.earnings_snapshot || []).reduce((s: number, i: any) => s + Number(i.monthly_value || 0), 0));
        const lopDeduction = round2((gross / days) * lop);
        const reimbursements = 0;
        const totalEarnings = round2(Math.max(gross - lopDeduction, 0) + reimbursements);

        const deductions = (assignment.deductions_snapshot || []).map((d: any) => ({
            component_code: d.component_code,
            component_name: d.component_name,
            amount: round2(d.monthly_value || 0),
            deduction_nature: d.deduction_nature
        }));

        const statutory = round2(deductions.filter((d: any) => {
            const c = String(d.component_code || '').toUpperCase();
            const n = String(d.component_name || '').toUpperCase();
            return d.deduction_nature === 'statutory' || c.includes('PF') || c.includes('ESI') || c.includes('PT') || n.includes('PROVIDENT') || n.includes('PROFESSIONAL TAX');
        }).reduce((s: number, d: any) => s + Number(d.amount || 0), 0));

        const loan = round2(deductions.filter((d: any) => {
            const c = String(d.component_code || '').toUpperCase();
            const n = String(d.component_name || '').toUpperCase();
            return c.includes('LOAN') || c.includes('EMI') || n.includes('LOAN') || n.includes('EMI');
        }).reduce((s: number, d: any) => s + Number(d.amount || 0), 0));

        if (loan > totalEarnings) errors.push(`Loan EMI exceeds earnings for employee ${emp.job_details?.employee_id || emp._id}.`);

        const dedTotal = round2(deductions.reduce((s: number, d: any) => s + Number(d.amount || 0), 0));
        const other = round2(Math.max(dedTotal - statutory - loan, 0));
        const totalDeductions = round2(statutory + loan + other);

        payrollEmployees.push({
            employee_uuid: new Types.ObjectId(emp._id),
            employee_code: emp.job_details?.employee_id || '-',
            employee_name: `${emp.personal_details?.firstName || ''} ${emp.personal_details?.lastName || ''}`.trim(),
            department_id: emp.job_details?.department_id,
            template_id: new Types.ObjectId(assignment.template_id),
            earnings: (assignment.earnings_snapshot || []).map((e: any) => ({ component_code: e.component_code, component_name: e.component_name, amount: round2(e.monthly_value || 0) })),
            deductions,
            working_days: days,
            lop_days: round2(lop),
            gross,
            lop_deduction: lopDeduction,
            reimbursements,
            total_earnings: totalEarnings,
            statutory_deductions: statutory,
            loan_deductions: loan,
            other_deductions: other,
            total_deductions: totalDeductions,
            net_pay: round2(totalEarnings - totalDeductions),
            status: 'DRAFT'
        });
    }

    const summary = payrollEmployees.reduce((a, e) => {
        a.total_employees += 1;
        a.total_gross += e.gross;
        a.total_earnings += e.total_earnings;
        a.total_deductions += e.total_deductions;
        a.total_payout_amount += e.net_pay;
        return a;
    }, { total_employees: 0, total_gross: 0, total_earnings: 0, total_deductions: 0, total_payout_amount: 0 });

    summary.total_gross = round2(summary.total_gross);
    summary.total_earnings = round2(summary.total_earnings);
    summary.total_deductions = round2(summary.total_deductions);
    summary.total_payout_amount = round2(summary.total_payout_amount);

    return { payrollEmployees, warnings, errors, summary };
};


const validatePayrollMonthAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { payroll_month, payroll_year } = req.body;
    if (!organization_id) return void res.status(400).json(apiResponse(400, 'Organization Id is required'));

    const orgId = new Types.ObjectId(organization_id);
    const prev = previousMonth(payroll_month, payroll_year);

    const previousRun = await PAYROLL_RUN_MODEL.findOne({ organization_id: orgId, payroll_month: prev.m, payroll_year: prev.y, is_deleted: false }).lean();
    const currentRun = await PAYROLL_RUN_MODEL.findOne({ organization_id: orgId, payroll_month, payroll_year, is_deleted: false }).lean();

    const computation = await computePayroll(orgId, payroll_month, payroll_year);

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, {
        payroll_month,
        payroll_year,
        validation: {
            previous_month_locked: previousRun ? previousRun.status === 'LOCKED' : true,
            month_already_exists: Boolean(currentRun),
            existing_run_status: currentRun?.status || null
        },
        checks: {
            salary_structure_assigned: !computation.errors.some(e => e.toLowerCase().includes('salary structure')),
            attendance_synced: !computation.warnings.some(w => w.toLowerCase().includes('attendance')),
            reimbursements_pending_approval: 'Not integrated yet',
            loan_emi_within_salary: !computation.errors.some(e => e.toLowerCase().includes('loan emi'))
        },
        eligible_employees: computation.summary.total_employees,
        warnings: computation.warnings,
        errors: computation.errors
    }));
});





const recalculatePayrollAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { payroll_run_id } = req.body;
    if (!organization_id || !user_id) return void res.status(400).json(apiResponse(400, 'Organization Id and User Id are required'));

    const orgId = new Types.ObjectId(organization_id);
    const run = await PAYROLL_RUN_MODEL.findOne({ _id: new Types.ObjectId(payroll_run_id), organization_id: orgId, is_deleted: false });
    if (!run) return void res.status(404).json(apiResponse(404, 'Payroll run not found'));
    if (run.status === 'LOCKED') return void res.status(403).json(apiResponse(403, 'Payroll is locked and cannot be recalculated'));

    const computation = await computePayroll(orgId, run.payroll_month, run.payroll_year);
    if (computation.errors.length) return void res.status(400).json(apiDataResponse(400, 'Payroll recalculation blocked', { errors: computation.errors, warnings: computation.warnings }));

    await PAYROLL_EMPLOYEE_MODEL.deleteMany({ payroll_run_id: run._id });
    if (computation.payrollEmployees.length) {
        await PAYROLL_EMPLOYEE_MODEL.insertMany(computation.payrollEmployees.map((e: any) => ({ ...e, organization_id: orgId, payroll_run_id: run._id, is_deleted: false })));
    }

    run.status = 'DRAFT';
    run.warnings = computation.warnings;
    run.recalculation_count = (run.recalculation_count || 0) + 1;
    run.total_employees = computation.summary.total_employees;
    run.total_gross = computation.summary.total_gross;
    run.total_earnings = computation.summary.total_earnings;
    run.total_deductions = computation.summary.total_deductions;
    run.total_payout_amount = computation.summary.total_payout_amount;
    run.updated_by = new Types.ObjectId(user_id);
    await run.save();

    res.status(200).json(apiDataResponse(200, 'Payroll recalculated successfully', { payroll_run_id: run._id, status: run.status, summary: computation.summary, warnings: computation.warnings }));
});

const markPayrollProcessedAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { payroll_run_id } = req.body;
    if (!organization_id || !user_id) return void res.status(400).json(apiResponse(400, 'Organization Id and User Id are required'));

    const run = await PAYROLL_RUN_MODEL.findOne({ _id: new Types.ObjectId(payroll_run_id), organization_id: new Types.ObjectId(organization_id), is_deleted: false });
    if (!run) return void res.status(404).json(apiResponse(404, 'Payroll run not found'));
    if (run.status === 'LOCKED') return void res.status(403).json(apiResponse(403, 'Locked payroll cannot be changed'));

    run.status = 'PROCESSED';
    run.updated_by = new Types.ObjectId(user_id);
    await run.save();
    await PAYROLL_EMPLOYEE_MODEL.updateMany({ payroll_run_id: run._id, is_deleted: false }, { $set: { status: 'PROCESSED' } });

    res.status(200).json(apiResponse(200, 'Payroll moved to PROCESSED status'));
});

const lockPayrollAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const user_id = req.user?.user_id;
    const { payroll_run_id, confirm_lock } = req.body;
    if (!organization_id || !user_id) return void res.status(400).json(apiResponse(400, 'Organization Id and User Id are required'));
    if (!confirm_lock) return void res.status(400).json(apiResponse(400, 'Lock confirmation is required'));

    const run = await PAYROLL_RUN_MODEL.findOne({ _id: new Types.ObjectId(payroll_run_id), organization_id: new Types.ObjectId(organization_id), is_deleted: false });
    if (!run) return void res.status(404).json(apiResponse(404, 'Payroll run not found'));
    if (run.status === 'LOCKED') return void res.status(409).json(apiResponse(409, 'Payroll is already locked'));
    if (run.status !== 'PROCESSED') return void res.status(400).json(apiResponse(400, 'Payroll must be in PROCESSED status before lock'));

    const employees = await PAYROLL_EMPLOYEE_MODEL.find({ payroll_run_id: run._id, is_deleted: false }).select('employee_uuid').lean();
    const ids = employees.map((e: any) => e.employee_uuid);
    const { start, end } = monthRange(run.payroll_month, run.payroll_year);

    if (ids.length) {
        await ATTENDANCE_RECORD_MODEL.updateMany({ organization_id: new Types.ObjectId(organization_id), employee_uuid: { $in: ids }, attendance_date: { $gte: start, $lte: end } }, { $set: { is_locked_for_payroll: true } });
    }

    await PAYROLL_EMPLOYEE_MODEL.updateMany({ payroll_run_id: run._id, is_deleted: false }, { $set: { status: 'LOCKED' } });
    run.status = 'LOCKED';
    run.locked_at = new Date();
    run.locked_by = new Types.ObjectId(user_id);
    run.updated_by = new Types.ObjectId(user_id);
    await run.save();

    res.status(200).json(apiDataResponse(200, 'Payroll locked successfully', { payroll_run_id: run._id, status: run.status, locked_at: run.locked_at }));
});

const getPayrollRunsAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { status, payroll_month, payroll_year, page, limit } = req.body;
    if (!organization_id) return void res.status(400).json(apiResponse(400, 'Organization Id is required'));

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const query: any = { organization_id: new Types.ObjectId(organization_id), is_deleted: false };
    if (status && status !== 'ALL') query.status = status;
    if (payroll_month) query.payroll_month = payroll_month;
    if (payroll_year) query.payroll_year = payroll_year;

    const totalCount = await PAYROLL_RUN_MODEL.countDocuments(query);
    const runs = await PAYROLL_RUN_MODEL.find(query).sort({ payroll_year: -1, payroll_month: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean();
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, {
        runs,
        pagination: { current_page: pageNum, total_pages: totalPages, total_count: totalCount, limit: limitNum, has_next: pageNum < totalPages, has_prev: pageNum > 1 }
    }));
});

const getPayrollRunByIdAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { payroll_run_id } = req.body;
    if (!organization_id) return void res.status(400).json(apiResponse(400, 'Organization Id is required'));

    const run = await PAYROLL_RUN_MODEL.findOne({ _id: new Types.ObjectId(payroll_run_id), organization_id: new Types.ObjectId(organization_id), is_deleted: false }).lean();
    if (!run) return void res.status(404).json(apiResponse(404, 'Payroll run not found'));

    const department_breakup = await PAYROLL_EMPLOYEE_MODEL.aggregate([
        { $match: { payroll_run_id: new Types.ObjectId(payroll_run_id), is_deleted: false } },
        { $group: { _id: '$department_id', total_employees: { $sum: 1 }, total_gross: { $sum: '$gross' }, total_deductions: { $sum: '$total_deductions' }, total_net_pay: { $sum: '$net_pay' } } },
        { $project: { _id: 0, department_id: '$_id', total_employees: 1, total_gross: 1, total_deductions: 1, total_net_pay: 1 } }
    ]);

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, {
        run,
        summary: { total_gross: run.total_gross, total_earnings: run.total_earnings, total_deductions: run.total_deductions, total_net_pay: run.total_payout_amount },
        department_breakup
    }));
});

const getPayrollRunEmployeesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    const { payroll_run_id, status, search, page, limit } = req.body;
    if (!organization_id) return void res.status(400).json(apiResponse(400, 'Organization Id is required'));

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const query: any = { payroll_run_id: new Types.ObjectId(payroll_run_id), is_deleted: false };
    if (status && status !== 'ALL') query.status = status;
    if (search) query.$or = [{ employee_name: { $regex: search, $options: 'i' } }, { employee_code: { $regex: search, $options: 'i' } }];

    const totalCount = await PAYROLL_EMPLOYEE_MODEL.countDocuments(query);
    const employees = await PAYROLL_EMPLOYEE_MODEL.find(query).sort({ employee_name: 1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean();
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, {
        employees,
        pagination: { current_page: pageNum, total_pages: totalPages, total_count: totalCount, limit: limitNum, has_next: pageNum < totalPages, has_prev: pageNum > 1 }
    }));
});

export {
    validatePayrollMonthAPIHandler,
    processPayrollAPIHandler,
    recalculatePayrollAPIHandler,
    markPayrollProcessedAPIHandler,
    lockPayrollAPIHandler,
    getPayrollRunsAPIHandler,
    getPayrollRunByIdAPIHandler,
    getPayrollRunEmployeesAPIHandler
};


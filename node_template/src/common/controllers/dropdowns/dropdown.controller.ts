import { Request, Response } from 'express';
import { async_error_handler } from '../../utils/async_error_handler';
import { apiDataResponse, apiResponse } from '../../utils/api_response';
import { MESSAGES } from '../../utils/messages';
import { ORGANIZATION_MODEL } from '../../schemas/Organizations/organization.schema';
import { safeValidate } from '../../utils/validation_middleware';
import { leaveTypesDropdownSchema, organizationsDropdownSchema, rolesDropdownSchema } from './dropdown.validator';
import { DEPARTMENT_MODEL } from '../../../common/schemas/departments_designations/departments.schema';
import { DESIGNATION_MODEL } from '../../../common/schemas/departments_designations/designation.schema';
import { EMPLOYEE_USER_MODEL } from '../../../common/schemas/Employees/user.schema';
import { LEAVE_TYPE_MODEL } from '../../../common/schemas/leave-attendance/leave-configs/leave-type.schema';
import { ROLES_MODEL } from '../../../common/schemas/rcab/roles.schema';
import { Types } from 'mongoose';
import { getGridFSBucket } from '../../../config/db_connections/gridfs';
import { EMPLOYEE_PROFILE_MODEL } from '../../../common/schemas/Employees/employee_onboarding.schema';
import { ATTENDANCE_SHIFT_MODEL } from '../../schemas/leave-attendance/attendance/attendance_shifts.schema';

interface CustomRequest extends Request {
    user?: {
        user_id: string;
        session_id: string;
        organization_id: string;
    };
}

//  GET ORGANIZATIONS FOR DROPDOWN (Without Pagination)
const getOrganizationsDropdownAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const validation = safeValidate(organizationsDropdownSchema, req.body);
    if (!validation.success) {
        res.status(400).json(apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message));
        return;
    }
    const { search_key } = validation.data || {};
    const query: any = { is_deleted: false, is_active: true };
    if (search_key) {
        query.$or = [
            { 'organization.organization_name': { $regex: search_key, $options: "i" } }
        ];
    }

    // Get only organization_name and _id fields
    const organizations = await ORGANIZATION_MODEL.find(query)
        .select('organization._id organization.organization_name _id')
        .sort({ 'organization.organization_name': 1 })
        .lean();
    const dropdownData = organizations.map(org => ({
        org_id: org._id,
        org_name: org.organization.organization_name
    }));

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, dropdownData));
});

// ======= GET DEPARTMENTS BY ORGANIZATION API HANDLER =======
const getDepartmentsByOrganizationAPIHandler = async_error_handler(
    async (req: CustomRequest, res: Response) => {

        const organization_id = req.user?.organization_id;

        if (!organization_id) {
            res.status(400).json(apiResponse(400, "Organization Id is Required"));
            return;
        }

        /* ================= QUERY ================= */
        const departments = await DEPARTMENT_MODEL.find({
            organization_id: organization_id,
            is_deleted: false,
            is_active: true
        })
            .select("_id department_code department_name")
            .sort({ department_name: 1 });

        /* ================= RESPONSE ================= */
        res.status(200).json(apiDataResponse(200, "Departments fetched successfully", departments));
    }
);

// ======= GET DESIGNATIONS BY DEPARTMENT API HANDLER =======
const getDesignationsByDepartmentAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {

    const { departmentId } = req.body;
    const organizationId = req.user?.organization_id

    if (!departmentId || !organizationId) {
        res.status(400).json(apiResponse(400, "DepartmentId and organizationId is required"));
        return;
    }


    /* ================= QUERY ================= */
    const designations = await DESIGNATION_MODEL.find({
        organization_id: organizationId,
        department_id: departmentId,
        is_deleted: false,
        is_active: true
    })
        .select("_id designation_code designation_name level")
        .sort({ level: 1 });

    /* ================= RESPONSE ================= */
    res.status(200).json(apiDataResponse(200, "Designations fetched successfully", designations));
}
);

// ====== GET EMPLOYEES BY ORGANIZATION API HANDLER =======
const getEmployeeByOrganizationAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    if (!organization_id) {
        res.status(400).json(apiResponse(400, "Organization Id is required"));
        return
    }
    const employees = await EMPLOYEE_PROFILE_MODEL.aggregate([
        {
            $match: {
                organization_id: new Types.ObjectId(organization_id),
                is_deleted: false
            }
        },
        {
            $project: {
                _id: 1,
                employee_id: '$job_details.employee_id',
                firstName: '$personal_details.firstName',
                lastName: '$personal_details.lastName',
                emp_name: {
                    $trim: {
                        input: {
                            $concat: [
                                { $ifNull: ['$personal_details.firstName', ''] },
                                ' ',
                                { $ifNull: ['$personal_details.lastName', ''] }
                            ]
                        }
                    }
                }
            }
        },
        {
            $sort: { emp_name: 1 }
        }
    ]);

    const dropdownData = employees.map(emp => ({
        id: emp._id,
        employee_id: emp.employee_id,
        name: emp.emp_name
    }));

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, dropdownData));
});

// ====== GET LEAVE TYPES FOR DROPDOWN (Without Pagination) ======
const getLeaveTypesDropdownAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    // const validation = safeValidate(leaveTypesDropdownSchema, req.body);
    // if (!validation.success) {
    //     res.status(400).json(apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message));
    //     return;
    // }

    const organization_id = req.user?.organization_id;
    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const { search_key, is_active } = { search_key: "", is_active: true };
    const query: Record<string, any> = {
        organization_id: new Types.ObjectId(organization_id)
    };

    if (search_key) {
        query.$or = [
            { name: { $regex: search_key, $options: 'i' } },
            { code: { $regex: search_key, $options: 'i' } }
        ];
    }

    if (typeof is_active === 'boolean') {
        query.is_active = is_active;
    }

    const leaveTypes = await LEAVE_TYPE_MODEL.find(query)
        .select('_id name code')
        .sort({ name: 1 })
        .lean();

    const dropdownData = leaveTypes.map(item => ({
        id: item._id,
        name: item.name,
        code: item.code
    }));

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, dropdownData));
});

// ====== GET ROLES FOR DROPDOWN (Without Pagination) ======
const getRolesDropdownAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    // const validation = safeValidate(rolesDropdownSchema, req.body);
    // if (!validation.success) {
    //     res.status(400).json(apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message));
    //     return;
    // }

    const organization_id = req.user?.organization_id;
    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    const { search_key, is_active } = { search_key: "", is_active: true };
    const query: Record<string, any> = {
        // organization_id: new Types.ObjectId(organization_id),
        is_deleted: false
    };

    if (search_key) {
        query.$or = [
            { role_name: { $regex: search_key, $options: 'i' } },
            { role_code: { $regex: search_key, $options: 'i' } }
        ];
    }

    if (typeof is_active === 'boolean') {
        query.is_active = is_active;
    }

    const roles = await ROLES_MODEL.find(query)
        .select('_id role_name role_code')
        .sort({ role_name: 1 })
        .lean();

    const dropdownData = roles.map(role => ({
        id: role._id,
        name: role.role_name,
        code: role.role_code
    }));

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, dropdownData));
});


// ======= GET SHIFTS BY ORGANIZATION API HANDLER =======
const getShiftsDropdownAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const organization_id = req.user?.organization_id;
    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }
    const shifts = await ATTENDANCE_SHIFT_MODEL.find({
        organization_id: new Types.ObjectId(organization_id),
        is_active: true
    })
        .select('_id shift_name start_time end_time grace_minutes working_hours')
        .sort({ shift_name: 1 })
        .lean();
    const dropdownData = shifts.map(s => ({
        id: s._id,
        name: s.shift_name,
        start_time: s.start_time,
        end_time: s.end_time,
        grace_minutes: s.grace_minutes ?? 0,
        working_hours: s.working_hours ?? null
    }));

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, dropdownData));
});



// ===== GET EMPLOYEE PROFILE IMAGE API HANDLER ======
const getEmployeeProfileImage = async_error_handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
        res.status(400).json(apiResponse(400, "Invalid file id"));
        return;
    }
    const bucket = getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(
        new Types.ObjectId(id)
    );
    downloadStream.on("error", () => {
        res.status(404).json(apiResponse(404, "Image not found"));
    });
    res.setHeader("Content-Type", "image/jpeg"); // or detect dynamically
    downloadStream.pipe(res);
});

// ===== GET DOCUMENTS API HANDLER ======
const getDocumentsAPIHandler = async_error_handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
        res.status(400).json(apiResponse(400, "Invalid file id"));
        return;
    }
    const bucket = getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(
        new Types.ObjectId(id)
    );
    downloadStream.on("error", () => {
        res.status(404).json(apiResponse(404, "Image not found"));
    });
    res.setHeader("Content-Type", "image/jpeg"); // or detect dynamically
    downloadStream.pipe(res);
});

// ===== ROLES API HANDLER =====


export {
    getOrganizationsDropdownAPIHandler,
    getDesignationsByDepartmentAPIHandler,
    getDepartmentsByOrganizationAPIHandler,
    getEmployeeByOrganizationAPIHandler,
    getEmployeeProfileImage,
    getLeaveTypesDropdownAPIHandler,
    getRolesDropdownAPIHandler,
    getShiftsDropdownAPIHandler
};

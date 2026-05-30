import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { async_error_handler } from '../../utils/async_error_handler';
import { apiDataResponse, apiResponse } from '../../utils/api_response';
import { MESSAGES } from '../../utils/messages';
import { EMPLOYEE_PROFILE_MODEL } from '../../schemas/Employees/employee_onboarding.schema';
import { getManagerAndRoleByEmployeeUuid } from '../../../common/utils/common';

interface CustomRequest extends Request {
    user?: {
        user_id: string;
        session_id: string;
        organization_id?: string;
    };
}

const getEmployeesByManagerIdAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const manager_id = req.user?.user_id;
    const organization_id = req.user?.organization_id;
    
    if (!manager_id) {
        res.status(400).json(apiResponse(400, 'Manager Id is required'));
        return;
    }
    if (!organization_id) {
        res.status(400).json(apiResponse(400, 'Organization Id is required'));
        return;
    }

    // Get pagination params from body
    const page = parseInt((req.body.page as string) || '1', 10);
    const limit = parseInt((req.body.limit as string) || '10', 10);
    const search = (req.body.search as string) || '';
    const skip = (page - 1) * limit;

    const manager_details = await getManagerAndRoleByEmployeeUuid(manager_id, organization_id);
    let matchQuery: any = {};
    
    if (manager_details.role_id == '697db37137000ecf846a5ea6') {
        matchQuery = {
            organization_id: new Types.ObjectId(organization_id),
            is_deleted: false,
        };
    } else {
        matchQuery = {
            organization_id: new Types.ObjectId(organization_id),
            is_deleted: false,
            'job_details.reported_to': new Types.ObjectId(manager_id)
        };
    }

    // Add search filter if provided
    if (search) {
        matchQuery.$or = [
            { 'personal_details.firstName': { $regex: search, $options: 'i' } },
            { 'personal_details.lastName': { $regex: search, $options: 'i' } },
            { 'job_details.employee_id': { $regex: search, $options: 'i' } }
        ];
    }

    // Get total count
    const totalCount = await EMPLOYEE_PROFILE_MODEL.countDocuments(matchQuery);

    // Get paginated employees
    const employees = await EMPLOYEE_PROFILE_MODEL.aggregate([
        { $match: matchQuery },
        {
            $lookup: {
                from: 'roles',
                localField: 'job_details.role_id',
                foreignField: '_id',
                as: 'role_info'
            }
        },
        {
            $project: {
                _id: 1,
                uuid: '$_id',
                employee_id: '$job_details.employee_id',
                firstName: '$personal_details.firstName',
                lastName: '$personal_details.lastName',
                avatar: '$personal_details.profileImage',
                joiningDate: '$job_details.joiningDate',
                role: { $arrayElemAt: ['$role_info.role_name', 0] },
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
        { $sort: { emp_name: 1 } },
        { $skip: skip },
        { $limit: limit }
    ]);

    const data = employees.map((emp) => ({
        _id: emp._id,
        uuid: emp.uuid,
        employee_id: emp.employee_id,
        name: emp.emp_name,
        emp_id: emp.employee_id,
        avatar: emp.avatar || null,
        role: emp.role || 'N/A',
        joiningDate: emp.joiningDate || null
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, {
        employees: data,
        pagination: {
            current_page: page,
            total_pages: totalPages,
            total_count: totalCount,
            limit: limit,
            has_next: page < totalPages,
            has_prev: page > 1
        }
    }));
});

export { getEmployeesByManagerIdAPIHandler };

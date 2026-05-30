import { async_error_handler } from '../../common/utils/async_error_handler';
import { Request, Response } from 'express';
import { apiResponse, apiDataResponse } from '../../common/utils/api_response';
import { MESSAGES } from '../../common/utils/messages';
import { USERS_MODEL } from '../../common/schemas/Users/user.schema';
import { safeValidate } from '../../common/utils/validation_middleware';
import {
    createorgAdminSchema,
    getorgAdminByIdSchema,
    listorgAdminsSchema,
    updateorgAdminSchema,
    CreateorgAdminInput,
    UpdateorgAdminInput
} from './org_admin.validator';
import { encryptPassword } from '../../common/utils/common';
import { PipelineStage } from 'mongoose';
import { ORGANIZATION_MODEL } from '../../common/schemas/Organizations/organization.schema';

interface CustomRequest extends Request {
    user?: any;
    validatedBody?: any;
}

// Update / Create Admin
const createorgAdminAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {

    const validation = safeValidate(createorgAdminSchema, { body: req.body });
    if (!validation.success) {
        res.status(400).json(apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message));
    }
    const {
        adminId,
        name,
        email,
        password,
        phone_number,
        address,
        organization_id,
    } = validation.data.body;
    // DUPLICATE EMAIL CHECK
    const emailQuery: any = {
        email,
        is_deleted: false
    };
    if (adminId) {
        emailQuery._id = { $ne: adminId };
    }
    const existingUser = await USERS_MODEL.findOne(emailQuery);
    if (existingUser) {
        res.status(400).json(apiDataResponse(400, 'Email already exists', null));
    }
    // COMMON PAYLOAD
    const payload: any = {
        name,
        email,
        phone_number,
        address,
        organization_id,
        user_type: 'ORG_ADMIN',
        role: 'GLOBAL_ADMIN',
        status: 'ACTIVE',
        is_active: true,
        is_deleted: false,
        updated_by: req.user?.user_id
    };
    //  PASSWORD (ONLY IF PRESENT)
    if (password) {
        payload.password = await encryptPassword(password);
    }

    let result;
    let statusCode;
    let message;

    // UPDATE ORG ADMIN
    if (adminId) {
        const adminExists = await USERS_MODEL.findById(adminId);
        if (!adminExists) {
            res.status(404).json(apiDataResponse(404, 'Org admin not found', null));
        }
        result = await USERS_MODEL.findByIdAndUpdate(
            adminId,
            { $set: payload },
            { new: true, runValidators: true }
        );

        statusCode = 200;
        message = 'Org admin updated successfully';
    }
    // CREATE ORG ADMIN
    else {
        payload.created_by = req.user?.user_id;
        result = await USERS_MODEL.create(payload);
        statusCode = 201;
        message = 'Org admin created successfully';
    }
    res.status(statusCode).json(apiDataResponse(statusCode, message, result));
}
);

// Assuming you have imported your models
// import { USERS_MODEL, ORGANIZATION_MODEL } from '...';

const newCreateorgAdminAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {

    const validation = safeValidate(createorgAdminSchema, { body: req.body });
    if (!validation.success) {
        res.status(400).json(apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message));
    }

    const {
        adminId,
        name,
        email,
        password,
        phone_number,
        address,
        organization_id,
    } = validation.data.body;

    // 1. VALIDATE ORGANIZATION & GET CODE
    // We need the org details to get the prefix (e.g., 'TECHM')
    const organization = await ORGANIZATION_MODEL.findById(organization_id);
    if (!organization) {
        res.status(404).json(apiDataResponse(404, 'Organization not found', null));
    }
    const orgCode = organization?.organization?.organization_code || 'EMP'; // Fallback if org_code is missing

    // 2. DUPLICATE EMAIL CHECK
    const emailQuery: any = {
        email,
        is_deleted: false
    };
    if (adminId) {
        emailQuery._id = { $ne: adminId };
    }
    const existingUser = await USERS_MODEL.findOne(emailQuery);
    if (existingUser) {
        res.status(400).json(apiDataResponse(400, 'Email already exists', null));
    }

    // 3. COMMON PAYLOAD
    const payload: any = {
        name,
        email,
        phone_number,
        address,
        organization_id,
        user_type: 'ORGANIZATION',
        status: 'ACTIVE',
        is_active: true,
        is_deleted: false,
        updated_by: req.user?.user_id
    };

    // PASSWORD (ONLY IF PRESENT)
    if (password) {
        payload.password = await encryptPassword(password);
    }

    let result;
    let statusCode;
    let message;

    // 4. UPDATE ORG ADMIN
    if (adminId) {
        const adminExists = await USERS_MODEL.findById(adminId);
        if (!adminExists) {
            res.status(404).json(apiDataResponse(404, 'Org admin not found', null));
        }
        result = await USERS_MODEL.findByIdAndUpdate(
            adminId,
            { $set: payload },
            { new: true, runValidators: true }
        );
        statusCode = 200;
        message = 'Org admin updated successfully';
    }
    // 5. CREATE ORG ADMIN (Generate Employee ID here)
    else {
        const lastEmployee = await USERS_MODEL.findOne({
            organization_id: organization_id,
            employee_id: { $exists: true, $ne: null }
        }).sort({ _id: -1 }).limit(1);
        let nextSequence = 1;
        if (lastEmployee && lastEmployee.employee_id) {
            const parts = lastEmployee.employee_id.split('-');
            if (parts.length > 1) {
                const lastNumberStr = parts[parts.length - 1];
                const lastNumber = parseInt(lastNumberStr, 10);
                if (!isNaN(lastNumber)) {
                    nextSequence = lastNumber + 1;
                }
            }
        }
        const paddedSequence = String(nextSequence).padStart(4, '0');
        payload.employee_id = `${orgCode}-${paddedSequence}`;
        payload.created_by = req.user?.user_id;
        result = await USERS_MODEL.create(payload);
        statusCode = 200;
        message = 'Org admin created successfully';
    }

    res.status(statusCode).json(apiDataResponse(statusCode, message, result));
});


//  GET org ADMIN DETAILS BY ID
const getorgAdminDetailsByIdHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const { adminId } = req.body
    const validation: any = safeValidate(getorgAdminByIdSchema, { body: { adminId } });
    if (!validation.success) {
        res.status(400).json(
            apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message)
        );
        return;
    }
    const orgAdmin = await USERS_MODEL.findOne({
        _id: adminId,
        user_type: 'ORGANIZATION',
        is_deleted: false
    }).select('-password');
    if (!orgAdmin) {
        res.status(404).json(apiResponse(404, "org admin not found"));
        return;
    }
    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, orgAdmin));
});

//   GET org ADMIN LIST
const getOrgAdminListAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {

    let { page = 1, limit = 10, search_key } = req.body;

    const validation = safeValidate(listorgAdminsSchema, {
        body: { page, limit, search_key }
    });
    if (!validation.success) {
        res.status(400).json(apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message));
    }
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;
    //  MATCH STAGE (User level)
    const matchStage: any = {
        user_type: 'ORGANIZATION',
        is_deleted: false
    };
    if (search_key) {
        matchStage.$or = [
            { name: { $regex: search_key, $options: 'i' } },
            { email: { $regex: search_key, $options: 'i' } }
        ];
    }
    //  AGGREGATION PIPELINE
    const pipeline: PipelineStage[] = [
        { $match: matchStage },
        {
            $lookup: {
                from: 'organizations',
                localField: 'organization_id',
                foreignField: '_id',
                as: 'organization'
            }
        },
        {
            $unwind: {
                path: '$organization',
                preserveNullAndEmptyArrays: true
            }
        },
        { $sort: { createdAt: -1 as 1 | -1 } },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            id: '$_id',

                            // ---- User ----
                            name: 1,
                            email: 1,
                            phone_number: 1,
                            status: 1,
                            is_active: 1,

                            // ---- Organization ----
                            organization_id: '$organization._id',
                            organization_name: '$organization.organization.organization_name',
                            domain: '$organization.organization.domain',
                            industry: '$organization.organization.industry',
                            country: '$organization.organization.country',
                            company_size: '$organization.organization.company_size',

                            // ---- Meta ----
                            createdAt: 1
                        }
                    }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ];

    const result = await USERS_MODEL.aggregate(pipeline);
    const admin_data = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, {
        admin_data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    })
    );
}
);

/**
 * org Admin View Details
 */
const getorgAdminViewDetailsAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    // Get current user details (must be a org admin)
    const currentAdmin = await USERS_MODEL.findOne({
        _id: req.user?.user_id,
        user_type: 'PLATFORM_ADMIN',
        is_deleted: false
    }).select('-password');

    if (!currentAdmin) {
        res.status(404).json(apiResponse(404, "Current user is not a org admin"));
        return;
    }

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, currentAdmin));
});

// Update org Admin (Optional - for future use)
const updateorgAdminAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    // Validate params and body
    const validation = safeValidate(updateorgAdminSchema, {
        adminId: req.params.adminId,
        ...req.body
    });

    if (!validation.success) {
        res.status(400).json(
            apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message)
        );
        return;
    }

    const { adminId, ...updateData } = validation.data || { adminId: '' };
    const validatedData = updateData as UpdateorgAdminInput;

    const updatedAdmin = await USERS_MODEL.findOneAndUpdate(
        {
            _id: adminId,
            user_type: 'PLATFORM_ADMIN',
            is_deleted: false
        },
        { ...validatedData, updated_by: req.user?.user_id },
        { new: true }
    ).select('-password');

    if (!updatedAdmin) {
        res.status(404).json(apiResponse(404, "org admin not found"));
        return;
    }

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, updatedAdmin));
});

export {
    createorgAdminAPIHandler,
    getorgAdminDetailsByIdHandler,
    getOrgAdminListAPIHandler,
    getorgAdminViewDetailsAPIHandler,
    updateorgAdminAPIHandler,
    newCreateorgAdminAPIHandler
};
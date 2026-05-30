import { Request, Response } from 'express';
import { async_error_handler } from '../../common/utils/async_error_handler';
import { apiResponse, apiDataResponse } from '../../common/utils/api_response';
import { MESSAGES } from '../../common/utils/messages';
import { ORGANIZATION_MODEL } from '../../common/schemas/Organizations/organization.schema';
import { safeValidate } from '../../common/utils/validation_middleware';
import {
    getOrganizationByIdSchema,
    listOrganizationsSchema,
    // updateOrganizationSchema,
    updateOrganizationStatusSchema,
    // UpdateOrganizationInput,
    createOrganizationOnboardingSchema
} from './organization.validator';
import { PipelineStage, Types } from 'mongoose';

interface CustomRequest extends Request {
    user?: {
        user_id: string;
        session_id: string;
    };
}

//  CREATE ORGANIZATION
const createOrganizationOnboardingAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const {
        organization,
        subscription,
        global_admin,
        organizationId
    } = req.body;

    // Zod Validation
    const validation = safeValidate(createOrganizationOnboardingSchema, {
        body: {
            organization,
            subscription,
            global_admin,
            organizationId
        }
    });

    if (!validation.success) {
        res.status(400).json(apiDataResponse(400, "Validation failed", validation.errors?.[0]?.message));
    }

    // Trial calculation (SERVER SIDE ONLY)
    const trialStart = new Date();
    const trialEnd = subscription.trial_days ? new Date(trialStart.getTime() + subscription.trial_days * 86400000) : undefined;

    // Payload mapping (EMBEDDED)
    const payload = {
        organization: {
            ...organization,
            status: "TRIAL"
        },

        subscription: {
            subscription_plan_id: subscription.subscription_plan_id,
            employee_limit: subscription.employee_limit,
            trial_days: subscription.trial_days,
            trial_start_date: trialStart,
            trial_end_date: trialEnd
        },

        global_admin,
        is_active: true,
        is_deleted: false,
        created_by: req.user?.user_id,
        updated_by: req.user?.user_id,
    };

    let result;
    let statusCode;
    let message;

    // UPDATE (future-safe)
    if (organizationId) {
        const existingOrg = await ORGANIZATION_MODEL.findById(organizationId);
        if (!existingOrg) {
            res.status(404).json(apiResponse(404, "Organization not found"));
        }

        result = await ORGANIZATION_MODEL.findByIdAndUpdate(
            organizationId,
            { $set: payload },
            { new: true, runValidators: true }
        );

        statusCode = 200;
        message = "Organization updated successfully";
    }

    // CREATE
    else {
        result = await ORGANIZATION_MODEL.create(payload);
        statusCode = 200;
        message = "Organization created successfully";
    }

    res.status(statusCode).json(apiDataResponse(statusCode, message, result?._id));
});

//  GET ORGANIZATION BY ID
const getOrganizationByIdAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    // Validate params
    const { organizationId } = req.body
    const validation = safeValidate(getOrganizationByIdSchema, { body: { organizationId } });
    if (!validation.success) {
        res.status(400).json(
            apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message)
        );
        return;
    }
    const organization = await ORGANIZATION_MODEL.findOne({
        _id: organizationId,
        is_deleted: false
    });
    if (!organization) {
        res.status(404).json(apiResponse(404, "Organization not found"));
        return;
    }

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, organization));
});

/**
 * LIST ORGANIZATIONS (Pagination + Filters)
 */
const listOrganizationsAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    let { page, limit, search_key } = req.body;
    const validation = safeValidate(listOrganizationsSchema, { body: { page, limit, search_key } });
    if (!validation.success) {
        res.status(400).json(apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message));
        return;
    }
    page = JSON.parse(page)
    limit = JSON.parse(limit)

    const skip = (page - 1) * limit;
    const matchStage: any = {};

    if (search_key) {
        matchStage.$or = [
            { plan_name: { $regex: search_key, $options: 'i' } },
            { plan_code: { $regex: search_key, $options: 'i' } }
        ];
    }

    // ✅ Aggregation pipeline
    const pipeline: PipelineStage[] = [
        { $match: matchStage },
        {
            $lookup: {
                from: 'subscription_plans',               // collection name
                localField: 'subscription.subscription_plan_id',       // org field
                foreignField: '_id',                       // subscription_plan _id
                as: 'subscription_plan'
            }
        },
        {
            $unwind: {
                path: '$subscription_plan',
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

                            // ---- Organization ----
                            organization_name: '$organization.organization_name',
                            domain: '$organization.domain',
                            industry: '$organization.industry',
                            country: '$organization.country',
                            company_size: '$organization.company_size',

                            // ---- Subscription (ORG) ----
                            trial_days: '$subscription.trial_days',
                            trial_start_date: '$subscription.trial_start_date',
                            trial_end_date: '$subscription.trial_end_date',

                            // ---- Subscription Plan (JOINED) ----
                            plan_name: '$subscription_plan.plan_name',
                            plan_code: '$subscription_plan.plan_code',
                            monthly_price: '$subscription_plan.pricing.monthly_price',
                            yearly_price: '$subscription_plan.pricing.yearly_price',

                            // ---- Global Admin ----
                            admin_name: '$global_admin.name',
                            admin_email: '$global_admin.contact_email',

                            // ---- Platform ----
                            is_active: 1,
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

    const result = await ORGANIZATION_MODEL.aggregate(pipeline);
    const org_data = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    res.status(200).json(
        apiDataResponse(200, MESSAGES.SUCCESS, {
            org_data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    );
});

export const getOrganizationDetailsAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const { organizationId } = req.body;
    if (!organizationId) {
        res.status(400).json(apiResponse(400, "Organization id is required"));
    }

    const pipeline = [
        {
            $match: {
                _id: new Types.ObjectId(organizationId),
                is_deleted: false
            }
        },
        {
            $lookup: {
                from: "subscription_plans",
                localField: "subscription.subscription_plan_id",
                foreignField: "_id",
                as: "subscription_plan"
            }
        },

        { $unwind: "$subscription_plan" },
        {
            $addFields: {
                enabled_modules: {
                    $filter: {
                        input: {
                            $objectToArray: "$subscription_plan.modules"
                        },
                        as: "module",
                        cond: { $eq: ["$$module.v", true] }
                    }
                }
            }
        },
        {
            $project: {
                id: "$_id",

                // ===== ORGANIZATION =====
                "organization.name": "$organization.organization_name",
                "organization.domain": "$organization.domain",
                "organization.industry": "$organization.industry",
                "organization.country": "$organization.country",
                "organization.company_size": "$organization.company_size",

                // ===== SUBSCRIPTION =====
                "subscription.plan_name": "$subscription_plan.plan_name",
                "subscription.currency": "$subscription_plan.pricing.currency",
                "subscription.employee_limit": "$subscription_plan.limits.employee_limit",
                "subscription.trial_days": "$subscription.trial_days",
                "subscription.trial_start_date": "$subscription.trial_start_date",
                "subscription.trial_end_date": "$subscription.trial_end_date",

                // enabled modules as array of names
                "subscription.enabled_modules": {
                    $map: {
                        input: "$enabled_modules",
                        as: "m",
                        in: { $toUpper: "$$m.k" }
                    }
                },

                // ===== GLOBAL ADMIN =====
                "global_admin.name": "$global_admin.name",
                "global_admin.email": "$global_admin.contact_email",

                // ===== LIFECYCLE =====
                "lifecycle.created_on": "$createdAt",
                "lifecycle.trial_started_on": "$subscription.trial_start_date",
                "lifecycle.status": {
                    $cond: [
                        { $eq: ["$is_active", true] },
                        "Active",
                        "Inactive"
                    ]
                }
            }
        }
    ];

    const result = await ORGANIZATION_MODEL.aggregate(pipeline);
    if (!result || result.length === 0) {
        res.status(404).json(apiResponse(404, "Organization not found"));
    }

    res.status(200).json(apiDataResponse(200, "Success", result[0]));
});

/**
 * ACTIVATE / SUSPEND ORGANIZATION
 */
const updateOrganizationStatusAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    // Validate params and body
    const validation = safeValidate(updateOrganizationStatusSchema, {
        organizationId: req.params.organizationId,
        ...req.body
    });

    if (!validation.success) {
        res.status(400).json(
            apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message)
        );
        return;
    }

    const { organizationId, status } = validation.data || { organizationId: '', status: 'ACTIVE' };

    const updatedOrg = await ORGANIZATION_MODEL.findOneAndUpdate(
        { _id: organizationId, is_deleted: false },
        { status, updated_by: req.user?.user_id },
        { new: true }
    );

    if (!updatedOrg) {
        res.status(404).json(apiResponse(404, "Organization not found"));
        return;
    }

    res.status(200).json(apiDataResponse(200, "Organization status updated", updatedOrg));
});

export {
    createOrganizationOnboardingAPIHandler,
    getOrganizationByIdAPIHandler,
    listOrganizationsAPIHandler,
    // updateOrganizationAPIHandler,
    updateOrganizationStatusAPIHandler
};

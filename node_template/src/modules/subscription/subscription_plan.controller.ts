import { Request, Response } from 'express';
import { async_error_handler } from '../../common/utils/async_error_handler';
import { apiResponse, apiDataResponse } from '../../common/utils/api_response';
import { MESSAGES } from '../../common/utils/messages';
import { SUBSCRIPTION_PLAN_MODEL } from '../../common/schemas/Subscription/subscription_plan.schema';
import { safeValidate } from '../../common/utils/validation_middleware';
import {
    createSubscriptionPlanSchema,
    getSubscriptionPlanByIdSchema,
    listSubscriptionPlansSchema,
    updateSubscriptionPlanSchema,
    CreateSubscriptionPlanInput,
    UpdateSubscriptionPlanInput,
} from './subscription_plan.validator';

interface CustomRequest extends Request {
    user?: any;
    validatedBody?: any;
}

// Create Subscription Plan Api Call
const createSubscriptionPlanAPIHandler = async_error_handler(async (req: Request, res: Response) => {
    const {
        plan_id,
        plan_name,
        plan_code,
        monthlyPrice,
        yearlyPrice,
        employeeLimit,
        storageLimit,
        modules
    } = req.body;

    const validation = safeValidate(createSubscriptionPlanSchema, {
        body: {
            plan_name,
            plan_code,
            monthlyPrice,
            yearlyPrice,
            employeeLimit,
            storageLimit,
            modules,
            plan_id
        }
    });

    if (!validation.success) {
        res.status(400).json(apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message));
    }

    // ✅ Payload mapping
    const payload = {
        plan_name,
        plan_code,
        pricing: {
            monthly_price: monthlyPrice,
            yearly_price: yearlyPrice
        },
        limits: {
            employee_limit: employeeLimit,
            storage_limit_gb: storageLimit
        },
        modules
    };

    let result;
    let statusCode;
    let message;

    //  UPDATE EXISTING PLAN
    if (plan_id) {
        const existingPlan = await SUBSCRIPTION_PLAN_MODEL.findById(plan_id);
        if (!existingPlan) {
            res.status(404).json(apiResponse(404, 'Subscription plan not found'));
        }
        result = await SUBSCRIPTION_PLAN_MODEL.findByIdAndUpdate(
            plan_id,
            { $set: payload },
            { new: true, runValidators: true }
        );
        statusCode = 200;
        message = 'Subscription plan updated successfully';
    }

    //  CREATE NEW PLAN
    else {
        result = await SUBSCRIPTION_PLAN_MODEL.create(payload);
        statusCode = 200;
        message = 'Subscription plan created successfully';
    }
    res.status(statusCode).json(apiDataResponse(statusCode, message, result?._id));
}
);


// Get Subscription plan details by id
const getSubscriptionPlanByIdAPIHandler = async_error_handler(async (req: Request, res: Response) => {
    // Validate params
    const { plan_id } = req.body
    const validation = safeValidate(getSubscriptionPlanByIdSchema, { body: { plan_id } });
    if (!validation.success) {
        res.status(400).json(
            apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message)
        );
        return;
    }

    const plan = await SUBSCRIPTION_PLAN_MODEL.findOne({
        _id: plan_id,
        is_deleted: false
    }, {
        createdAt: 0, updatedAt: 0, __v: 0
    });

    if (!plan) {
        res.status(404).json(apiResponse(404, "Subscription plan not found"));
        return;
    }

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, plan));
});

// Subscription Plan List Get
const listSubscriptionPlansAPIHandler = async_error_handler(async (req: Request, res: Response) => {
    let { page, limit, search_key } = req.body;
    const validation = safeValidate(listSubscriptionPlansSchema, { body: { page, limit, search_key } });
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
    const pipeline: any = [
        { $match: matchStage },

        { $sort: { createdAt: -1 } },

        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            plan_name: 1,
                            plan_code: 1,
                            pricing: 1,
                            limits: 1,
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

    const result = await SUBSCRIPTION_PLAN_MODEL.aggregate(pipeline);
    const plan_data = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    res.status(200).json(
        apiDataResponse(200, MESSAGES.SUCCESS, {
            plan_data,
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


// Update Subscription Plan
const updateSubscriptionPlanAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    // Validate request params and body
    const validation = safeValidate<{ params: { planId: string }; body: UpdateSubscriptionPlanInput }>(updateSubscriptionPlanSchema, {
        params: req.params,
        body: req.body
    });

    if (!validation.success) {
        res.status(400).json(
            apiDataResponse(400, 'Validation failed', validation.errors?.[0]?.message)
        );
        return;
    }

    const { planId } = validation.data?.params || { planId: '' };
    const validatedData = validation.data?.body as UpdateSubscriptionPlanInput;

    const updatedPlan = await SUBSCRIPTION_PLAN_MODEL.findOneAndUpdate(
        { _id: planId, is_deleted: false },
        { ...validatedData, updated_by: req.user?.user_id || undefined },
        { new: true }
    );

    if (!updatedPlan) {
        res.status(404).json(apiResponse(404, "Subscription plan not found"));
        return;
    }

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, updatedPlan));
});

export {
    createSubscriptionPlanAPIHandler,
    getSubscriptionPlanByIdAPIHandler,
    listSubscriptionPlansAPIHandler,
    updateSubscriptionPlanAPIHandler
};

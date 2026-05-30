import { Request, Response } from 'express';
import { async_error_handler } from '../../common/utils/async_error_handler';
import { apiResponse, apiDataResponse } from '../../common/utils/api_response';
import { MESSAGES } from '../../common/utils/messages';
import { ORGANIZATION_SUBSCRIPTION_MODEL } from '../../common/schemas/OrganizationSubscription/organization_subscription.schema';

interface CustomRequest extends Request {
    user?: any;
}

const createOrganizationSubscriptionAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const subscription = await ORGANIZATION_SUBSCRIPTION_MODEL.create({
        ...req.body,
        created_by: req.user?.user_id
    });
    res.status(201).json(apiDataResponse(201, MESSAGES.SUCCESS, subscription));
});

const getOrganizationSubscriptionByIdAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const { subscriptionId } = req.params;
    const subscription = await ORGANIZATION_SUBSCRIPTION_MODEL.findOne({ _id: subscriptionId, is_deleted: false });
    if (!subscription) {
        res.status(404).json(apiResponse(404, "Subscription not found"));
        return;
    }
    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, subscription));
});

const listOrganizationSubscriptionsAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const organization_id = req.query.organization_id as string | undefined;

    const query: any = { is_deleted: false };
    if (organization_id) query.organization_id = organization_id;

    const subscriptions = await ORGANIZATION_SUBSCRIPTION_MODEL.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await ORGANIZATION_SUBSCRIPTION_MODEL.countDocuments(query);
    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, { data: subscriptions, total, page, limit }));
});

const updateOrganizationSubscriptionAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const { subscriptionId } = req.params;
    const updated = await ORGANIZATION_SUBSCRIPTION_MODEL.findOneAndUpdate(
        { _id: subscriptionId, is_deleted: false },
        { ...req.body, updated_by: req.user?.user_id },
        { new: true }
    );
    if (!updated) {
        res.status(404).json(apiResponse(404, "Subscription not found"));
        return;
    }
    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, updated));
});

export {
    createOrganizationSubscriptionAPIHandler,
    getOrganizationSubscriptionByIdAPIHandler,
    listOrganizationSubscriptionsAPIHandler,
    updateOrganizationSubscriptionAPIHandler
};

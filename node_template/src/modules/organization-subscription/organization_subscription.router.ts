import express, { Router } from 'express';
import {
    createOrganizationSubscriptionAPIHandler,
    getOrganizationSubscriptionByIdAPIHandler,
    listOrganizationSubscriptionsAPIHandler,
    updateOrganizationSubscriptionAPIHandler
} from './organization_subscription.controller';
import { accessTokenValidatorMiddleware } from '../../common/middleware/error.middleware';

const organization_subscription_router: Router = express.Router();

organization_subscription_router.post("/create", accessTokenValidatorMiddleware, createOrganizationSubscriptionAPIHandler);
organization_subscription_router.get("/:subscriptionId", accessTokenValidatorMiddleware, getOrganizationSubscriptionByIdAPIHandler);
organization_subscription_router.get("/", accessTokenValidatorMiddleware, listOrganizationSubscriptionsAPIHandler);
organization_subscription_router.put("/:subscriptionId", accessTokenValidatorMiddleware, updateOrganizationSubscriptionAPIHandler);

export default organization_subscription_router;

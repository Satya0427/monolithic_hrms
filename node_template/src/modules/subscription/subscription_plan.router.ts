import express, { Router } from 'express';

import {
    createSubscriptionPlanAPIHandler,
    getSubscriptionPlanByIdAPIHandler,
    listSubscriptionPlansAPIHandler,
    updateSubscriptionPlanAPIHandler
} from './subscription_plan.controller';

import { accessTokenValidatorMiddleware } from '../../common/middleware/error.middleware';
import { validateRequest } from '../../common/utils/validation_middleware';
import {
    createSubscriptionPlanSchema,
    getSubscriptionPlanByIdSchema,
    listSubscriptionPlansSchema,
    updateSubscriptionPlanSchema,
} from './subscription_plan.validator';

const subscription_router: Router = express.Router();

// Create subscription plan
subscription_router.post(
    "/create",
    accessTokenValidatorMiddleware,
    validateRequest(createSubscriptionPlanSchema, 'body'),
    createSubscriptionPlanAPIHandler
);

// Get subscription plan by ID
subscription_router.post(
    "/edit_plan",
    accessTokenValidatorMiddleware,
    validateRequest(getSubscriptionPlanByIdSchema, 'body'),
    getSubscriptionPlanByIdAPIHandler
);

// List subscription plans
subscription_router.post(
    "/get_list",
    accessTokenValidatorMiddleware,
    validateRequest(listSubscriptionPlansSchema, 'body'),
    listSubscriptionPlansAPIHandler
);

// Update subscription plan
subscription_router.put(
    "/:planId",
    accessTokenValidatorMiddleware,
    validateRequest(updateSubscriptionPlanSchema, 'all'),
    updateSubscriptionPlanAPIHandler
);

export default subscription_router;

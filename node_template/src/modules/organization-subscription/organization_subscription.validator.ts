const validateOrganizationSubscriptionCreate = (data: any): string[] => {
    const errors: string[] = [];
    if (!data.organization_id) errors.push("Organization ID is required");
    if (!data.subscription_plan_id) errors.push("Subscription plan ID is required");
    return errors;
};

export { validateOrganizationSubscriptionCreate };

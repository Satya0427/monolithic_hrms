interface ValidationData {
    permission_name?: string;
    permission_code?: string;
    scope?: string;
    action?: string;
}

const validatePermissionCreate = (data: ValidationData): string[] => {
    const errors: string[] = [];

    if (!data.permission_name) errors.push("Permission name is required");
    if (!data.permission_code) errors.push("Permission code is required");
    if (!data.scope) errors.push("Permission scope is required");
    if (!data.action) errors.push("Permission action is required");

    if (data.permission_name && typeof data.permission_name !== "string")
        errors.push("Permission name must be a string");

    if (data.scope && !["PLATFORM", "ORGANIZATION"].includes(data.scope))
        errors.push("Invalid permission scope");

    if (data.action && !["CREATE", "READ", "UPDATE", "DELETE", "APPROVE", "EXPORT"].includes(data.action))
        errors.push("Invalid action type");

    return errors;
};

export { validatePermissionCreate };

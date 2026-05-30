interface ValidationData {
    role_name?: string;
    role_code?: string;
    scope?: string;
    organization_id?: string;
}

const validateRoleCreate = (data: ValidationData): string[] => {
    const errors: string[] = [];

    if (!data.role_name) errors.push("Role name is required");
    if (!data.role_code) errors.push("Role code is required");
    if (!data.scope) errors.push("Role scope is required");

    if (data.role_name && typeof data.role_name !== "string")
        errors.push("Role name must be a string");

    if (data.role_code && typeof data.role_code !== "string")
        errors.push("Role code must be a string");

    if (data.scope && !["PLATFORM", "ORGANIZATION"].includes(data.scope))
        errors.push("Invalid role scope");

    if (data.scope === "ORGANIZATION" && !data.organization_id)
        errors.push("Organization ID is required for organization role");

    return errors;
};

export { validateRoleCreate };

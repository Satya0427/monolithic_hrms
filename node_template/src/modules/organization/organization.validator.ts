import { z } from 'zod';


//  ================= ORGANIZATION =================
const OrganizationZodSchema = z.object({
    organization_name: z
        .string()
        .min(3, "Organization name must be at least 3 characters")
        .max(100, "Organization name cannot exceed 100 characters")
        .trim(),

    organization_code: z
        .string()
        .min(3, "Organization name must be at least 3 characters")
        .max(100, "Organization name cannot exceed 100 characters")
        .trim(),
        
    domain: z
        .string()
        .max(100, "Domain cannot exceed 100 characters")
        .regex(
            /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
            "Invalid domain format"
        )
        .toLowerCase()
        .trim(),

    industry: z
        .string()
        .max(100, "Industry cannot exceed 100 characters")
        .optional(),

    country: z
        .string()
        .max(50, "Country cannot exceed 50 characters")
        .optional(),

    company_size: z
        .number()
        .min(1, "Company size must be at least 1")
        .optional(),

    address: z
        .string()
        .max(250, "Address cannot exceed 250 characters")
        .optional()
});

/**
 * ================= SUBSCRIPTION =================
 */
const SubscriptionZodSchema = z.object({
    subscription_plan_id: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid subscription plan id"),

    trial_days: z
        .number()
        .min(1, "Trial days must be at least 1")
        .optional(),

    trial_start_date: z.coerce.date().optional(),
    trial_end_date: z.coerce.date().optional()
});

/**
 * ================= GLOBAL ADMIN =================
 */
const GlobalAdminZodSchema = z.object({
    name: z
        .string()
        .min(1, "Admin name is required")
        .max(100, "Admin name cannot exceed 100 characters")
        .trim(),

    contact_email: z
        .string()
        .email("Invalid email address")
        .max(254, "Email cannot exceed 254 characters")
        .toLowerCase()
        .trim(),

    contact_phone: z
        .string()
        .max(15, "Phone number cannot exceed 15 characters")
        .optional()
});

/**
 * ================= MAIN PAYLOAD =================
 */
export const createOrganizationOnboardingSchema = z.object({
    body: z.object({
        organization: OrganizationZodSchema,
        subscription: SubscriptionZodSchema,
        // global_admin: GlobalAdminZodSchema,
        organizationId: z.string().optional()
    })
});
// Get Organization By ID Schema
export const getOrganizationByIdSchema = z.object({
    body: z.object({
        organizationId: z.string().min(1, 'Organization ID is required')
    })
});

// List Organizations Schema (Pagination + Filters)
export const listOrganizationsSchema = z.object({
    body: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().default(10),
        // status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
        search_key: z.string().optional()
    })
});

// // Update Organization Schema
// export const updateOrganizationSchema = z.object({
//     organizationId: z.string().min(1, 'Organization ID is required'),
//     organization_name: z.string().optional(),
//     organization_code: z.string().optional(),
//     domain: z.string().email('Invalid domain format').optional(),
//     industry: z.string().optional(),
//     company_size: z.string().optional(),
//     contact_email: z.string().email('Invalid contact email format').optional(),
//     contact_phone: z.string().optional(),
//     address: z.string().optional(),
//     country: z.string().optional(),
//     timezone: z.string().optional()
// }).strict();

// Update Organization Status Schema
export const updateOrganizationStatusSchema = z.object({
    organizationId: z.string().min(1, 'Organization ID is required'),
    status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE'], {
        errorMap: () => ({ message: 'Status must be one of: TRIAL, ACTIVE, SUSPENDED, INACTIVE' })
    })
});

/**
 * TypeScript Types Exported from Zod Schemas
 */
export type CreateOrganizationInput = z.infer<typeof createOrganizationOnboardingSchema>;
export type GetOrganizationByIdInput = z.infer<typeof getOrganizationByIdSchema>;
export type ListOrganizationsInput = z.infer<typeof listOrganizationsSchema>;
// export type UpdateOrganizationInput = Omit<z.infer<typeof updateOrganizationSchema>, 'organizationId'>;
export type UpdateOrganizationStatusInput = Omit<z.infer<typeof updateOrganizationStatusSchema>, 'organizationId'>;

/**
 * LEGACY VALIDATION FUNCTION (Kept for backward compatibility)
 */
interface ValidationData {
    organization_name?: string;
    organization_code?: string;
    domain?: string;
    contact_email?: string;
}

const validateOrganizationCreate = (data: ValidationData): string[] => {
    const errors: string[] = [];

    if (!data.organization_name) errors.push("Organization name is required");
    if (!data.organization_code) errors.push("Organization code is required");
    if (!data.domain) errors.push("Domain is required");
    if (!data.contact_email) errors.push("Contact email is required");

    if (data.organization_name && typeof data.organization_name !== "string")
        errors.push("Organization name must be a string");

    if (data.domain && typeof data.domain !== "string")
        errors.push("Domain must be a string");

    if (data.contact_email && typeof data.contact_email !== "string")
        errors.push("Contact email must be a string");

    return errors;
};

export { validateOrganizationCreate };

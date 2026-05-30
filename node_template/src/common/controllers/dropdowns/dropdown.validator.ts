import { z } from 'zod';

/**
 * LOOKUP VALIDATION SCHEMAS (Zod)
 */

// Organizations Dropdown Schema (No pagination)
export const organizationsDropdownSchema = z.object({
    search_key: z.string().optional()
});

// Lookups Dropdown Schema (No pagination)
export const lookupsDropdownSchema = z.object({
    category: z.string().optional()
});

// Bulk Lookups Dropdown Schema (No pagination)
export const bulkLookupsDropdownSchema = z.object({
    categories: z.array(z.string()).optional()
});

// Leave Types Dropdown Schema (No pagination)
export const leaveTypesDropdownSchema = z.object({
    search_key: z.string().optional(),
    is_active: z.boolean().optional()
});

// Roles Dropdown Schema (No pagination)
export const rolesDropdownSchema = z.object({
    search_key: z.string().optional(),
    is_active: z.boolean().optional()
});

/**
 * TypeScript Types Exported from Zod Schemas
 */
export type OrganizationsDropdownInput = z.infer<typeof organizationsDropdownSchema>;
export type LookupsDropdownInput = z.infer<typeof lookupsDropdownSchema>;
export type LeaveTypesDropdownInput = z.infer<typeof leaveTypesDropdownSchema>;
export type RolesDropdownInput = z.infer<typeof rolesDropdownSchema>;

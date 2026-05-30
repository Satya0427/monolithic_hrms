import { Types } from 'mongoose';
import { z } from 'zod';

/**
 * ================= EMPLOYMENT PROFILE VALIDATION =================
 */
const objectId = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId"
  });

/* ================= PERSONAL DETAILS ================= */

export const employeePersonalSchema = z.object({
  profileImage: z.string().optional().nullable(),
  firstName: z.string().min(1).max(50).nullable(),
  lastName: z.string().min(1).max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10).max(15).nullable(),
  dob: z.coerce.date().optional().nullable(),
  gender: z.string().nullable(),
  address: z.string().max(250).optional().nullable(),
  maritalStatus: z.string().max(30).optional().nullable(),
  nationality: z.string().max(50).optional().nullable(),
  password: z.string().min(6).max(100).optional().nullable()
});

/* ================= JOB DETAILS ================= */

export const employeeJobSchema = z.object({
  designation_id: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  joiningDate: z.coerce.date(),
  workEmail: z.string().email(),
  reported_to: z.string().optional().nullable(),
  work_location: z.string().max(100).optional().nullable(),
  workMode: z.string().max(50).optional().nullable(),
  role_id: z.string().optional().nullable(),
  probationStartDate: z.coerce.date().optional().nullable(),
  probationEndDate: z.coerce.date().optional().nullable(),
  probationStatus: z.string().max(30).optional().nullable(),
  probationNotes: z.string().max(500).optional().nullable(),
  employee_id: z.string().min(3).max(30),
  employmentType: z.string().max(50).optional().nullable(),
  shift_id: z.string().optional().nullable()
});

/* ================= EMERGENCY CONTACT ================= */

export const employeeEmergencySchema = z.object({
  contactName: z.string().min(2).max(100),
  relation: z.string().max(50),
  phone: z.string().min(10).max(15).nullable()
});

/* ================= MAIN CREATE SCHEMA ================= */

export const createEmployeeProfileSchema = z.object({
  body: z.object({
    personal_details: employeePersonalSchema,
    job_details: employeeJobSchema,
    emergency_contact: employeeEmergencySchema.optional()
  })
});



// List/Fetch Schema with pagination and filters
export const listEmploymentProfilesSchema = z.object({
  body: z.object({

    page: z
      .number()
      .min(1, "Page must be at least 1")
      .default(1)
      .optional(),

    limit: z
      .number()
      .min(1, "Limit must be at least 1")
      .max(100, "Limit cannot exceed 100")
      .default(10)
      .optional(),

    status: z
      .enum(["ACTIVE", "ON_NOTICE", "RESIGNED", "TERMINATED"])
      .optional(),

    employment_type: z
      .enum(["PERMANENT", "CONTRACT", "INTERN"])
      .optional(),

    search_key: z
      .string()
      .max(100, "Search string cannot exceed 100 characters")
      .trim()
      .optional()
  })
});

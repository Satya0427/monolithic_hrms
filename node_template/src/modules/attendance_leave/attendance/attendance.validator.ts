import { z } from 'zod';

const objectId = z.string().min(12);

export const checkInSchema = z.object({
	body: z.object({
		punch_time: z.string().datetime().optional(),
		source: z.enum(['WEB', 'MOBILE', 'BIOMETRIC', 'API']).default('WEB'),
		device_info: z.string().optional(),
		geo_location: z
			.object({
				lat: z.number(),
				lng: z.number()
			})
			.optional(),
		is_manual_entry: z.boolean().optional()
	})
});

export const checkOutSchema = z.object({
	body: z.object({
		punch_time: z.string().datetime().optional(),
		source: z.enum(['WEB', 'MOBILE', 'BIOMETRIC', 'API']).default('WEB'),
		device_info: z.string().optional(),
		geo_location: z
			.object({
				lat: z.number(),
				lng: z.number()
			})
			.optional(),
		is_manual_entry: z.boolean().optional()
	})
});

export const calculateAttendanceSchema = z.object({
	body: z.object({
		organization_id: objectId,
		employee_uuid: objectId,
		date: z.string().datetime().optional()
	})
});

export const getDayHistoryQuerySchema = z.object({
	query: z.object({
		date: z.string().datetime().optional()
	})
});

export const getMonthSummaryQuerySchema = z.object({
	query: z.object({
		date: z.string().datetime().optional()
	})
});

export const riseWFHRequestSchema = z.object({
	body: z.object({
		request_date: z.string().datetime(),
		request_type: z.enum(['FULL_DAY', 'HALF_DAY']),
		half_day_session: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
		reason: z.string().optional()
	}).refine((data) => {
		if (data.request_type === 'HALF_DAY') {
			return !!data.half_day_session;
		}
		return true;
	}, {
		message: 'half_day_session is required when request_type is HALF_DAY',
		path: ['half_day_session']
	})
});

export const getWFHRequestsQuerySchema = z.object({
	body: z.object({
		status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional()
	})
});

export const updateWFHRequestStatusSchema = z.object({
    body: z.object({
        request_id: z.string().min(12),
        action: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
        manager_comment: z.string().optional()
    })
});

export const wfhCheckInSchema = z.object({
	body: z.object({
		punch_time: z.string().datetime().optional(),
		source: z.enum(['WEB', 'MOBILE', 'BIOMETRIC', 'API']).default('WEB'),
		device_info: z.string().optional(),
		geo_location: z
			.object({
				lat: z.number(),
				lng: z.number()
			})
			.optional()
	})
});

export const wfhCheckOutSchema = z.object({
	body: z.object({
		punch_time: z.string().datetime().optional(),
		source: z.enum(['WEB', 'MOBILE', 'BIOMETRIC', 'API']).default('WEB'),
		device_info: z.string().optional(),
		geo_location: z
			.object({
				lat: z.number(),
				lng: z.number()
			})
			.optional()
	})
});

export const createAttendanceRegularizationSchema = z.object({
	body: z.object({
		attendance_date: z.string().datetime(),
		requested_clock_in: z.string().datetime(),
		requested_clock_out: z.string().datetime(),
		request_type: z.enum([
			'MISSED_PUNCH',
			'WRONG_PUNCH',
			'HALF_DAY',
			'WFH',
			'LATE_COMING',
			'EARLY_GOING',
			'OTHER'
		]),
		reason: z.string(),
		supporting_documents: z.array(
			z.object({
				file_name: z.string().optional(),
				file_url: z.string().optional(),
				uploaded_at: z.string().datetime().optional()
			})
		).optional(),
		current_approver_id: objectId
	})
});

export const getMyAttendanceRegularizationsSchema = z.object({
	body: z.object({
		status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
		from_date: z.string().datetime().optional(),
		to_date: z.string().datetime().optional()
	})
});

export const getApproverAttendanceRegularizationsSchema = z.object({
	body: z.object({
		status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
		from_date: z.string().datetime().optional(),
		to_date: z.string().datetime().optional()
	})
});

export const updateAttendanceRegularizationStatusSchema = z.object({
	body: z.object({
		request_id: objectId,
		action: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
		remarks: z.string().optional()
	})
});

export const applyAttendanceRegularizationSchema = z.object({
	body: z.object({
		request_id: objectId
	})
});

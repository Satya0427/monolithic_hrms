import { z } from 'zod';

const objectId = z.string().min(12);

export const getEmployeesByManagerParamsSchema = z.object({
	params: z.object({
		manager_id: objectId
	})
});

export const getEmployeesByManagerBodySchema = z.object({
	body: z.object({
		page: z.number().optional().default(1),
		limit: z.number().optional().default(10),
		search: z.string().optional()
	})
});

import { Request, Response } from 'express';
import { async_error_handler } from '../../../common/utils/async_error_handler';
import { apiResponse, apiDataResponse } from '../../../common/utils/api_response';
import { MESSAGES } from '../../../common/utils/messages';
import { ROLES_MODEL } from '../../../common/schemas/rcab/roles.schema';
import { validateRoleCreate } from './role.validator';

interface CustomRequest extends Request {
    user?: {
        user_id: string;
        session_id: string;
    };
}

interface CreateRoleBody {
    role_name: string;
    role_code: string;
    description?: string;
    scope: 'PLATFORM' | 'ORGANIZATION';
    organization_id?: string;
    is_default?: boolean;
}

interface UpdateRoleStatusBody {
    is_active: boolean;
}

/**
 * CREATE ROLE
 */
const createRoleAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    let {
        role_name,
        role_code,
        description,
        scope,
        organization_id,
        is_default
    } = req.body as CreateRoleBody;

    const validationErrors = validateRoleCreate(req.body);
    if (validationErrors.length > 0) {
        res.status(400).json(apiResponse(400, validationErrors.join(", ")));
        return;
    }

    role_name = role_name.trim();
    role_code = role_code.trim().toUpperCase();

    const existingRole = await ROLES_MODEL.findOne({
        role_code,
        is_deleted: false
    });

    if (existingRole) {
        res.status(400).json(apiResponse(400, "Role already exists"));
        return;
    }

    const role = await ROLES_MODEL.create({
        role_name,
        role_code,
        description,
        scope,
        organization_id: scope === "ORGANIZATION" ? organization_id : undefined,
        is_default,
        created_by: req.user?.user_id || undefined
    } as any);

    res.status(201).json(apiDataResponse(201, MESSAGES.SUCCESS, role));
});

/**
 * GET ROLE BY ID
 */
const getRoleByIdAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const { roleId } = req.params;

    const role = await ROLES_MODEL.findOne({
        _id: roleId,
        is_deleted: false
    });

    if (!role) {
        res.status(404).json(apiResponse(404, "Role not found"));
        return;
    }

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, role));
});

/**
 * LIST ROLES
 */
const listRolesAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const scope = req.query.scope as string | undefined;
    const organization_id = req.query.organization_id as string | undefined;

    const query: any = { is_deleted: false };

    if (scope) query.scope = scope;
    if (organization_id) query.organization_id = organization_id;

    const roles = await ROLES_MODEL.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await ROLES_MODEL.countDocuments(query);

    res.status(200).json(
        apiDataResponse(200, MESSAGES.SUCCESS, {
            data: roles,
            total,
            page,
            limit
        })
    );
});

/**
 * UPDATE ROLE
 */
const updateRoleAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const { roleId } = req.params;

    const updatedRole = await ROLES_MODEL.findOneAndUpdate(
        { _id: roleId, is_deleted: false },
        { ...req.body, updated_by: req.user?.user_id },
        { new: true }
    );

    if (!updatedRole) {
        res.status(404).json(apiResponse(404, "Role not found"));
        return;
    }

    res.status(200).json(apiDataResponse(200, MESSAGES.SUCCESS, updatedRole));
});

/**
 * UPDATE ROLE STATUS
 */
const updateRoleStatusAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const { roleId } = req.params;
    const { is_active } = req.body as UpdateRoleStatusBody;

    if (is_active === undefined) {
        res.status(400).json(apiResponse(400, "Status is required"));
        return;
    }

    const updatedRole = await ROLES_MODEL.findOneAndUpdate(
        { _id: roleId, is_deleted: false },
        { is_active, updated_by: req.user?.user_id },
        { new: true }
    );

    if (!updatedRole) {
        res.status(404).json(apiResponse(404, "Role not found"));
        return;
    }

    res.status(200).json(apiDataResponse(200, "Role status updated", updatedRole));
});

export {
    createRoleAPIHandler,
    getRoleByIdAPIHandler,
    listRolesAPIHandler,
    updateRoleAPIHandler,
    updateRoleStatusAPIHandler
};

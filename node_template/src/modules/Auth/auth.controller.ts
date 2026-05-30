import { Request, Response, NextFunction } from 'express';
import { async_error_handler } from '../../common/utils/async_error_handler';
import { apiResponse, apiDataResponse } from '../../common/utils/api_response';
import { MESSAGES } from '../../common/utils/messages';
import { USERS_MODEL } from '../../common/schemas/Users/user.schema';
import { verifyPassword } from '../../common/utils/common';
import {
    storeTokens,
    deleteRefreshToken,
    revokeAllUserRefreshTokens,
    isRefreshTokenInRedis,
    UserDetails
} from '../../config/db_connections/redisDb';
import { EMPLOYEE_PROFILE_MODEL } from '../../common/schemas/Employees/employee_onboarding.schema';

interface CustomRequest extends Request {
    user?: {
        user_id: string;
        session_id: string;
        email?: string;
        phone_number?: string;
        address?: string;
        user_type?: string;
    };
}

interface LoginRequestBody {
    email: string;
    password: string;
}

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    credentials: true
};
const cookieName = 'refreshToken'

// Login API call
const loginAPIHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    let { email, password } = req.body as LoginRequestBody;

    // Required Checking
    if (!email) {
        res.status(400).json(apiResponse(400, MESSAGES.EMAIL.REQUIRED));
        return;
    }
    if (!password) {
        res.status(400).json(apiResponse(400, MESSAGES.PASSWORD.REQUIRED));
        return;
    }

    // Type Checking
    if (typeof email != 'string') {
        res.status(400).json(apiResponse(400, MESSAGES.EMAIL.TYPE));
        return;
    }
    if (typeof password != 'string') {
        res.status(400).json(apiResponse(400, MESSAGES.PASSWORD.TYPE));
        return;
    }

    // Trimming all the keys values
    email = email.trim();
    password = password.trim();

    const userDetails: any = await EMPLOYEE_PROFILE_MODEL.findOne({ "personal_details.email": email });
    if (!userDetails) {
        res.status(400).json(apiResponse(400, 'Please check UserID and Password'));
        return;
    }

    const isPasswordMatch = await verifyPassword(password, userDetails?.personal_details.password);
    if (!isPasswordMatch) {
        res.status(500).json(apiResponse(400, `Wrong Password`));
        return;
    }

    const payload: any = {
        user_id: userDetails._id.toString(),
        email: userDetails.personal_details.email,
        phone_number: userDetails.personal_details.phone,
        address: userDetails.personal_details.address,
        user_type: userDetails.user_type,
        scope: userDetails.scope,
        organization_id: userDetails?.organization_id
    }
    const user_details = {
        email: userDetails.personal_details.email,
        phone_number: userDetails.personal_details.phone,
        user_type: userDetails.user_type,
        scope: userDetails.scope,
        organization_id: userDetails?.organization_id,
        name: `${userDetails?.personal_details?.firstName || ''} ${userDetails?.personal_details?.lastName || ''}`.trim(),
        profile_image: userDetails?.personal_details?.profileImage || '',
    }
    
    const { accessToken, refreshToken } = await storeTokens(payload);
    res.cookie(cookieName, refreshToken, cookieOptions);
    res.status(200).json({ sts: 200, msg: MESSAGES.SUCCESS, data: { user_details, token: { accessToken } } });
});

// Refresh Token API Call
const refreshTokenApiHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const userDetails = req.user;

    if (!userDetails?.user_id || !userDetails?.session_id) {
        res.status(401).json(apiResponse(401, MESSAGES.REFRESH_TOKEN_INVALID));
        return;
    }

    await deleteRefreshToken(userDetails.user_id, userDetails.session_id);
    res.clearCookie(cookieName, cookieOptions);

    const userPayload: UserDetails = {
        user_id: userDetails.user_id,
        email: userDetails.email || '',
        phone_number: userDetails.phone_number || '',
        address: userDetails.address || '',
        user_type: userDetails.user_type || ''
    };

    const { accessToken, refreshToken } = await storeTokens(userPayload);
    res.cookie(cookieName, refreshToken, cookieOptions);
    res.status(200).json({ sts: 200, msg: MESSAGES.SUCCESS, token: { accessToken } });
});

// Logout API
const logoutApiHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    const refreshToken = req.cookies?.[cookieName] || req.body?.refreshToken;
    const userDetails = req.user;

    if (!userDetails?.user_id || !userDetails?.session_id) {
        res.clearCookie(cookieName, cookieOptions);
        res.status(200).json({ message: 'Logged out' });
        return;
    }

    if (!refreshToken) {
        res.clearCookie(cookieName, cookieOptions);
        res.status(200).json({ message: 'Logged out' });
        return;
    }

    try {
        const isAvailableInRedis = await isRefreshTokenInRedis(
            userDetails.user_id,
            userDetails.session_id,
            refreshToken
        );

        if (isAvailableInRedis) {
            await deleteRefreshToken(userDetails.user_id, userDetails.session_id);
        }
    } catch (err) {
        res.clearCookie(cookieName, cookieOptions);
        res.status(200).json({ message: 'Logged out' });
        return;
    }

    res.clearCookie(cookieName, cookieOptions);
    res.status(200).json({ message: 'Logged out' });
});

// Logout All API 
const logoutAllApiHandler = async_error_handler(async (req: CustomRequest, res: Response) => {
    // Implementation for logout all
});

export { loginAPIHandler, refreshTokenApiHandler, logoutApiHandler, logoutAllApiHandler };

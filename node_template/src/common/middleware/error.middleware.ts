import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import logger from '../../config/logger';
import { apiDataResponse, apiResponse } from '../utils/api_response';
import { MESSAGES } from '../utils/messages';
import JWT from 'jsonwebtoken';
import { verifyRefreshToken } from '../utils/token_methods';
import { isRefreshTokenInRedis } from '../../config/db_connections/redisDb';

interface CustomRequest extends Request {
    user?: {
        user_id: string;
        session_id: string;
        [key: string]: any;
    };
}

interface CustomError extends Error {
    type?: string;
    cause?: { code: number, keyValue: string };
    errors?: { [key: string]: { message: string } };
    code?: number,
    keyValue?: string
}

const wrongRouteErrorCatch = (req: Request, res: Response): void => {
    const sts = 404;
    const msg = `Can't find ${req.method}: ${req.originalUrl} on the server`;
    res.status(sts).json(apiResponse(sts, msg))
}

const globalErrorCatch = (error: CustomError, req: Request, res: Response, _: NextFunction): void => {
    console.log('In Global error handler', error);

    let sts = 500;
    let msg = 'Internal Server error';
    let data: any = undefined;

    // Invalid JSON payload
    if (error?.type === 'entity.parse.failed') {
        sts = 400;
        msg = 'Request payload error';
    }

    // DUPLICATE KEY ERROR (MongoDB)
    else if (error?.code === 11000 || error?.cause?.code === 11000) {
        sts = 409;
        // Mongo gives key info here
        const keyValue: any = error.keyValue || error?.cause?.keyValue || {};
        const field = Object.keys(keyValue)[0];
        const value = keyValue[field];
        msg = `Duplicate value for ${field}`;
        data = {
            field,
            value
        };
    }

    //  Mongoose validation error
    else if (error.name === 'ValidationError') {
        const firstError = Object.values(error.errors || {})[0] as any;
        sts = 400;
        msg = firstError?.message || error.message;
        data = {
            field: firstError?.path
        };
    }

    res.status(sts).json(apiDataResponse(sts, msg, data));
    logger.error({ sts, msg, data, error });
};

// Access token validate
function accessTokenValidatorMiddleware(req: CustomRequest, res: Response, next: NextFunction): void {
    try {
        let authorization = req.headers['authorization'];

        if (!authorization) {
            res.status(400).json(apiResponse(401, MESSAGES.AUTHORIZATION_HEADER_MISSING));
            return;
        }

        let access_token = authorization.split(' ')[1];

        if (!access_token) {
            res.status(400).json(apiResponse(401, MESSAGES.ACCESS_TOKEN_MISSING));
            return;
        }

        /* Check if Access-Token is Valid */
        JWT.verify(access_token, env.ACCESS_TOKEN_SECRET, (err: any, payload: any) => {
            if (err) {
                logger.error('Error verifying access-token JWT', { error: err });
                res.status(401).json(apiResponse(401, MESSAGES.ACCESS_TOKEN_INVALID));
                return;
            }
            req.user = payload;
            next();
        });
    } catch (error) {
        logger.error('Error in Catch of accessTokenValidatorMiddleware', { error });
        next(new Error(MESSAGES.INTERNAL_SERVER_ERROR));
    }
}

/* Refresh-Token Authorization Middleware */
function refreshTokenValidatorMiddleware(req: CustomRequest, res: Response, next: NextFunction): void {
    try {
        const refresh_token = req.cookies?.['refreshToken'] || req.body?.refreshToken;

        if (!refresh_token) {
            res.status(401).json(apiResponse(400, MESSAGES.REFRESH_TOKEN_REQUIRED));
            return;
        }

        /* Check if Refresh-Token is Valid */
        JWT.verify(refresh_token, env.REFRESH_TOKEN_SECRET, async (err: any, payload: any) => {
            if (err) {
                logger.error('Error verifying refresh-token JWT', { error: err });
                res.status(401).json(apiResponse(401, MESSAGES.REFRESH_TOKEN_INVALID));
                return;
            }
            req.user = payload;

            /* Check Session in Redis */
            try {
                const is_valid = await isRefreshTokenInRedis(payload.user_id, payload.session_id, refresh_token);
                if (!is_valid) {
                    logger.error('Session not found in Redis', { user_id: req.user?.user_id });
                    res.status(401).json(apiResponse(401, MESSAGES.REFRESH_TOKEN_INVALID));
                    return;
                }

                next();
            } catch (redisError) {
                logger.error('Error checking Redis', { error: redisError });
                res.status(401).json(apiResponse(401, MESSAGES.REFRESH_TOKEN_INVALID));
            }
        });
    } catch (error) {
        logger.error('Error in Catch of refreshTokenValidatorMiddleware', { error });
        next(new Error(MESSAGES.INTERNAL_SERVER_ERROR));
    }
}

export { wrongRouteErrorCatch, globalErrorCatch, accessTokenValidatorMiddleware, refreshTokenValidatorMiddleware };

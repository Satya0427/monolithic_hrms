import express, { Router } from 'express';
import { loginAPIHandler, refreshTokenApiHandler, logoutApiHandler } from './auth.controller'
import { refreshTokenValidatorMiddleware, accessTokenValidatorMiddleware } from '../../common/middleware/error.middleware'

const auth_router: Router = express.Router();

auth_router.post('/login', loginAPIHandler);
auth_router.get('/logout', accessTokenValidatorMiddleware, logoutApiHandler);
auth_router.get('/token_refresh', refreshTokenValidatorMiddleware, refreshTokenApiHandler);

export default auth_router;

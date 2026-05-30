import JWT, { JwtPayload } from 'jsonwebtoken';
import { env } from '../../config/env';

interface TokenPayload extends JwtPayload {
    user_id: string;
    session_id: string;
}

// #region AccessToken

// Access Token Generation
async function generateAccessToken(userDetails: any, session_id: string): Promise<string> {
    const accessToken = JWT.sign(
        {
            user_id: userDetails.user_id || '',
            email: userDetails.email || '',
            user_type: userDetails.user_type || '',
            organization_id: userDetails.organization_id || '',
            session_id
        },
        env.ACCESS_TOKEN_SECRET,
        { expiresIn: env.ACCESS_TOKEN_EXPIRES } as any
    );
    return accessToken;
}

// Verify the Access Token
const verifyAccessToken = (token: string): TokenPayload | Error => {
    try {
        return JWT.verify(token, env.ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch (err) {
        return err instanceof Error ? err : new Error(String(err));
    }
}

// #endregion Access Token

// #region Refresh Token

const generateRefreshToken = async (user_id: string, session_id: string): Promise<string> => {
    const refreshToken = JWT.sign(
        {
            user_id,
            session_id
        },
        env.REFRESH_TOKEN_SECRET,
        { expiresIn: "30d" } as any
    );
    return refreshToken;
}

const verifyRefreshToken = async (token: string): Promise<TokenPayload | Error> => {
    try {
        return JWT.verify(token, env.REFRESH_TOKEN_SECRET) as TokenPayload;
    } catch (err) {
        return err instanceof Error ? err : new Error(String(err));
    }
}

// #endregion Refresh Token

export {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    TokenPayload
};

import { createClient, RedisClientType } from 'redis';
import { env } from '../env';
import logger from '../logger';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import {
    generateAccessToken,
    generateRefreshToken
} from '../../common/utils/token_methods';
import { Types } from 'mongoose';

interface UserDetails {
    user_id: string;
    email: string;
    phone_number?: string;
    address?: string;
    user_type?: string;
    scope?: string;
    organization_id?: Types.ObjectId
}

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

interface StoredTokenData {
    userDetails: UserDetails;
    refreshToken: string;
}

let redisClient: RedisClientType | null = null;

async function redis_connection(): Promise<RedisClientType> {
    try {
        const redis_config = {
            username: env.REDIS_USERNAME || undefined,
            password: env.REDIS_PASSWORD || undefined,
            socket: {
                host: env.REDIS_URL,
                port: Number(env.REDIS_PORT) || 6379,
            },
        };

        redisClient = createClient(redis_config) as RedisClientType;

        redisClient.on("error", (err) => {
            console.error("Redis Client Error:", err);
            logger.error("Redis Client Error: " + (err && err.message));
        });

        redisClient.on("connect", () => {
            console.info("Redis connecting...");
            logger.info("Redis connecting...");
        });

        redisClient.on("ready", () => {
            console.info("Redis ready");
            logger.info("Redis ready");
        });

        redisClient.on("reconnecting", () => {
            console.info("Redis reconnecting");
            logger.info("Redis reconnecting");
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error connecting to Redis:", error);
        logger.error("Error connecting to Redis: " + errorMessage);
        throw error;
    }
}

// hash a token (use SHA256) before storing
const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
}

const storeTokens = async (userDetails: UserDetails): Promise<TokenPair> => {
    if (!redisClient || !redisClient.isOpen) {
        throw new Error("Redis client is not connected. Call redis_connection() first.");
    }

    const session_id = uuidv4();

    const accessToken = await generateAccessToken(userDetails, session_id);
    const refreshToken = await generateRefreshToken(userDetails.user_id, session_id);

    const key = `REFRESHTOKEN_DATA:${userDetails.user_id}_${session_id}`;
    const value = hashToken(refreshToken);
    const REFRESH_TOKEN_TTL = Number(env.REFRESH_TOKEN_EXPIRES_SEC)

    try {
        const storedData: StoredTokenData = {
            userDetails,
            refreshToken: value,
        };

        await redisClient.setEx(key, REFRESH_TOKEN_TTL, JSON.stringify(storedData));
        logger.info(`Stored refresh token with REFRESHTOKEN_DATA:${userDetails.user_id}_${session_id}`);
        return { accessToken, refreshToken };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Failed to store refresh token in Redis:", err);
        logger.error("Failed to store refresh token in Redis: " + errorMessage);
        throw err;
    }
}

// Delete (revoke) one refresh token
const deleteRefreshToken = async (userId: string, session_id: string): Promise<void> => {
    if (!redisClient) {
        throw new Error("Redis client is not connected.");
    }
    const key = `REFRESHTOKEN_DATA:${userId}_${session_id}`;
    await redisClient.del(key);
}

// Revoke all sessions for user (delete all keys pattern)
async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
    if (!redisClient) {
        throw new Error("Redis client is not connected.");
    }
    const pattern = `REFRESHTOKEN_DATA:${userId}_*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length) {
        await redisClient.del(keys);
    }
}

// Verify refresh token against Redis: ensures token hasn't been revoked
async function isRefreshTokenInRedis(userId: string, session_id: string, refreshToken: string): Promise<boolean> {
    if (!redisClient) {
        throw new Error("Redis client is not connected.");
    }
    const key = `REFRESHTOKEN_DATA:${userId}_${session_id}`;
    const stored = await redisClient.get(key);

    if (!stored) {
        return false;
    }

    const data: StoredTokenData = JSON.parse(stored);
    return data.refreshToken === hashToken(refreshToken);
}

export {
    redis_connection,
    storeTokens,
    deleteRefreshToken,
    revokeAllUserRefreshTokens,
    isRefreshTokenInRedis,
    UserDetails,
    TokenPair
};

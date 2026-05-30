import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

interface EnvConfig {
    PORT: number;
    MONGO_URI: string;
    ALLOWED_DOMINES: string;
    REDIS_USERNAME?: string;
    REDIS_PASSWORD?: string;
    REDIS_URL: string;
    REDIS_PORT: string;
    SALT_ROUND?: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRES: string;
    REFRESH_TOKEN_EXPIRES_SEC: string;
    IMAGEKIT_PUBLIC_KEY: string;
    IMAGEKIT_PRIVATE_KEY: string;
    IMAGEKIT_URLENDPOINT: string;
}

function getEnv(key: string, required: boolean = true): string {
    try {
        const value = process.env[key];
        if (required && !value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value || '';
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('Catch block error in getEnv()', errorMessage);
        logger.error(`Catch block error in getEnv() ${errorMessage}`)
        return '';
    }
}

const env: EnvConfig = {
    PORT: parseInt(getEnv("PORT", false) || '3000'),
    MONGO_URI: getEnv("MONGO_URI", false),
    ALLOWED_DOMINES: getEnv("ALLOWED_DOMINES", false) || "*",
    REDIS_USERNAME: getEnv('REDIS_USERNAME', false),
    REDIS_PASSWORD: getEnv('REDIS_PASSWORD', false),
    REDIS_URL: getEnv('REDIS_URL', true),
    REDIS_PORT: getEnv('REDIS_PORT', true),
    SALT_ROUND: getEnv('SALT_ROUND', false),
    ACCESS_TOKEN_SECRET: getEnv('ACCESS_TOKEN_SECRET', true),
    REFRESH_TOKEN_SECRET: getEnv('REFRESH_TOKEN_SECRET', true),
    ACCESS_TOKEN_EXPIRES: getEnv('ACCESS_TOKEN_EXPIRES', true),
    REFRESH_TOKEN_EXPIRES_SEC: getEnv('REFRESH_TOKEN_EXPIRES_SEC', true),
    IMAGEKIT_PUBLIC_KEY: getEnv('IMAGEKIT_PUBLIC_KEY', true),
    IMAGEKIT_PRIVATE_KEY: getEnv('IMAGEKIT_PRIVATE_KEY', true),
    IMAGEKIT_URLENDPOINT: getEnv('IMAGEKIT_URLENDPOINT', true),
};

export { env };

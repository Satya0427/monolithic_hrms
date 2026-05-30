import { app } from './app';
import { server_connection } from './config/db_connections/mongodb';
import { env } from './config/env';
import logger from './config/logger';
import { redis_connection } from './config/db_connections/redisDb';
import { initGridFS } from './config/db_connections/gridfs';
async function start_server(): Promise<void> {
    try {
        await server_connection();
        initGridFS();
        await redis_connection();
        app.listen(env.PORT, () => {
            logger.info(`Server is running in ${env.PORT}`)
        })
    } catch (error) {
        logger.error(`Server is running in ${env.PORT}`)
    }
}

start_server();

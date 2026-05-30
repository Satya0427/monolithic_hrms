import mongoose from "mongoose";
import { env } from "../env";
import logger from "../logger";

export async function server_connection(): Promise<void> {
    try {
        await mongoose.connect(env.MONGO_URI, {
            autoIndex: true
        });

        logger.info("MongoDB connected successfully");
    } catch (error) {
        logger.error("MongoDB connection failed", error);
        process.exit(1); // ⬅️ important
    }
}

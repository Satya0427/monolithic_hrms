import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './cron-jobs/leaveCredit.cron';
import './cron-jobs/mid-night-attendance.cron';
// module imports
import mainRoute from './modules/main.router';
import { wrongRouteErrorCatch, globalErrorCatch } from './common/middleware/error.middleware';

const app: Express = express();

app.use(express.urlencoded({ extended: true }));  // This is used for to understand the request body in urlencoded format

let allowedOrigins: string[] = [
    "http://localhost:4201",
    "http://localhost:4200",
    "http://192.168.0.8:4201",
    "http://localhost:8080",
    "http://localhost:80"
];

if (process.env.ALLOWED_DOMINES) {
    try {
        const parsed = JSON.parse(process.env.ALLOWED_DOMINES);
        if (Array.isArray(parsed)) {
            allowedOrigins = parsed;
        } else if (typeof parsed === 'string') {
            allowedOrigins = [parsed];
        }
    } catch (e) {
        const splitOrigins = process.env.ALLOWED_DOMINES.split(',').map((o: string) => o.trim()).filter(Boolean);
        if (splitOrigins.length > 0) {
            allowedOrigins = splitOrigins;
        }
    }
}

app.use(cors({
    origin: allowedOrigins,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    maxAge: 3600,
    optionsSuccessStatus: 200,
}))
// app.options("*", cors());

app.use(cookieParser());
app.use(express.json());    // This is used for to understand the request body in json format

app.use('/api', mainRoute);
app.use(wrongRouteErrorCatch);  /* Handling Invalid Routes Here */
app.use(globalErrorCatch);     /* Global Error Handler should always be at last */

export { app };

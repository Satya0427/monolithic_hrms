import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const async_error_handler = (func: AsyncRequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res, next)
            .catch((error: Error) => {
                next(error)
            })
    }
}

export { async_error_handler };

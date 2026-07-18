import { NextFunction, Request, Response } from "express";

type Handler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

// Wraps async route handlers so rejected promises reach Express's error middleware
// instead of crashing the process.
export function asyncHandler<Req extends Request = Request>(fn: Handler<Req>) {
  return (req: Req, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

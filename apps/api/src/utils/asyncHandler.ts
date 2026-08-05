import type { NextFunction, Request, Response } from "express";

export type AuthedHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/** Wraps async route handlers so rejections reach the error middleware. */
export const ah =
  (fn: AuthedHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

export const ok = <T>(res: Response, data: T, status = 200): void => {
  res.status(status).json({ ok: true, data });
};

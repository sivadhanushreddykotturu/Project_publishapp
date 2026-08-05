import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/errors.js";
import { logger } from "../config/logger.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res
    .status(404)
    .json({ ok: false, error: { code: "NOT_FOUND", message: "Route not found" } });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res
      .status(err.statusCode)
      .json({ ok: false, error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: {
        code: "VALIDATION",
        message: err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
    });
    return;
  }
  if (err instanceof Error && err.name === "CastError") {
    res
      .status(400)
      .json({ ok: false, error: { code: "BAD_ID", message: "Invalid id" } });
    return;
  }
  logger.error({ err }, "unhandled error");
  res.status(500).json({
    ok: false,
    error: { code: "INTERNAL", message: "Internal server error" },
  });
}

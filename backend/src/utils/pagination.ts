import { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(req: Request): PaginationParams {
  const parsedPage = Number(req.query.page ?? 1);
  const parsedLimit = Number(req.query.limit ?? 20);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isSafeInteger(parsedLimit) && parsedLimit > 0 ? Math.min(100, parsedLimit) : 20;
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPageMeta(page: number, limit: number, total: number) {
  return { page, limit, total, pages: Math.ceil(total / limit) };
}

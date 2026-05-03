import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ error: message });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route not found" });
}

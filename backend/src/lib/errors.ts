import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  statusCode: number;
  errors: unknown[];

  constructor(statusCode: number, message: string, errors: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function badRequestError(message: string, errors: unknown[] = []) {
  return new AppError(400, message, errors);
}

export function unauthorizedError(message = "Authentication required") {
  return new AppError(401, message);
}

export function forbiddenError(message = "Forbidden") {
  return new AppError(403, message);
}

export function notFoundError(message = "Resource not found") {
  return new AppError(404, message);
}

export function conflictError(message: string, errors: unknown[] = []) {
  return new AppError(409, message, errors);
}

export function asyncHandler<TReq extends Request = Request, TRes extends Response = Response>(
  handler: (req: TReq, res: TRes, next: NextFunction) => Promise<unknown>
) {
  return (req: TReq, res: TRes, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(notFoundError("Endpoint not found"));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  void _next;
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    errors: []
  });
}

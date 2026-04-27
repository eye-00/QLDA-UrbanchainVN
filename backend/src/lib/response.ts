import { Response } from "express";

export function ok(res: Response, data: unknown, message = "Operation completed successfully") {
  return res.status(200).json({ success: true, message, data, meta: {} });
}

export function created(res: Response, data: unknown, message = "Created successfully") {
  return res.status(201).json({ success: true, message, data, meta: {} });
}

export function badRequest(res: Response, message: string, errors: unknown[] = []) {
  return res.status(400).json({ success: false, message, errors });
}

export function unauthorized(res: Response, message = "Authentication required") {
  return res.status(401).json({ success: false, message, errors: [] });
}

export function forbidden(res: Response, message = "Forbidden") {
  return res.status(403).json({ success: false, message, errors: [] });
}

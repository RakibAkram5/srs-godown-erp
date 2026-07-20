import { Response } from 'express';

/* Consistent success envelope for all endpoints. */
export function sendSuccess<T>(res: Response, data: T, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

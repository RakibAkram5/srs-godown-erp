import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/* Validates req.body / req.query / req.params against a Zod schema. */
export const validate =
  (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) return next(err);
      next(err);
    }
  };

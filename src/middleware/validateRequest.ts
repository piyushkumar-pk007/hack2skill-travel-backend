import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export function validateRequest(schemas: {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const targets: Array<['body' | 'query' | 'params', unknown, ZodTypeAny | undefined]> = [
      ['body', req.body, schemas.body],
      ['query', req.query, schemas.query],
      ['params', req.params, schemas.params],
    ];

    for (const [name, value, schema] of targets) {
      if (!schema) {
        continue;
      }

      const result = schema.safeParse(value);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.error.issues.map((issue) => `${name}.${issue.path.join('.') || 'root'} ${issue.message}`).join('. '),
            code: 'VALIDATION_ERROR',
          },
        });
      }

      req[name] = result.data;
    }

    next();
  };
}

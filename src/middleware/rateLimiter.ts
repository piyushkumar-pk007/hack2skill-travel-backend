import rateLimit from 'express-rate-limit';

export function rateLimiter(options?: { windowMs?: number; max?: number; message?: string }) {
  return rateLimit({
    windowMs: options?.windowMs ?? 60_000,
    limit: options?.max ?? 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        message: options?.message ?? 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
      },
    },
  });
}

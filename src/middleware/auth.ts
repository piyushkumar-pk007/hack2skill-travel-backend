import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById } from '../services/userService.js';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
    }

    const token = header.slice('Bearer '.length);
    const secret = process.env.JWT_SECRET ?? 'dev-secret-not-for-production';
    const payload = jwt.verify(token, secret) as { sub: string };
    const user = await getUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
  }
}

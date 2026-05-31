import type { User } from '@travel-engine/shared';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { fetchLiveTravelUpdates } from '../services/claudeService.js';
import { cacheUpdates, getCachedUpdates } from '../services/updatesService.js';

const querySchema = z.object({
  destination: z.string().min(1),
  dates: z.string().optional(),
});

const router = Router();

router.get(
  '/',
  authenticate,
  rateLimiter({ windowMs: 60_000, max: 10 }),
  validateRequest({ query: querySchema }),
  async (req, res, next) => {
    try {
      const { destination, dates } = req.query as z.infer<typeof querySchema>;
      const cached = await getCachedUpdates(destination);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }

      const feed = await fetchLiveTravelUpdates(destination, dates ?? 'upcoming travel');
      await cacheUpdates(destination, feed, 30);
      res.json({ success: true, data: feed, cached: false });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

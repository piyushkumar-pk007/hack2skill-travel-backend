import { Router } from 'express';
import { ChatMessageSchema } from '@travel-engine/shared';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { streamConciergeChat } from '../services/claudeService.js';
import { getTripPreferences } from '../services/tripService.js';

const router = Router();

router.post(
  '/stream',
  authenticate,
  validateRequest({ body: ChatMessageSchema }),
  async (req, res, next) => {
    try {
      const { message, tripId, history } = req.body;
      const tripContext = tripId ? await getTripPreferences(tripId, req.user!.id) : undefined;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      for await (const chunk of streamConciergeChat(message, history, tripContext)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      next(error);
    }
  },
);

export default router;

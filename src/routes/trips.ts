import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getTripById, listTripsForUser } from '../services/tripService.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const trips = await listTripsForUser(req.user!.id);
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
});

router.get('/:tripId', authenticate, async (req, res, next) => {
  try {
    const trip = await getTripById(String(req.params.tripId), req.user!.id);
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
});

export default router;

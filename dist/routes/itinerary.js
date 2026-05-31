import { Router } from 'express';
import { TripPreferencesSchema } from '@travel-engine/shared';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { generateItinerary } from '../services/claudeService.js';
import { getTripItinerary, saveTripWithItinerary } from '../services/tripService.js';
const router = Router();
router.post('/generate', authenticate, rateLimiter({ windowMs: 60_000, max: 5, message: 'Too many generation requests. Please wait 1 minute.' }), validateRequest({ body: TripPreferencesSchema }), async (req, res, next) => {
    try {
        const preferences = req.body;
        const itinerary = await generateItinerary(preferences);
        const trip = await saveTripWithItinerary(req.user.id, preferences, itinerary);
        itinerary.tripId = trip.id;
        res.json({ success: true, data: { tripId: trip.id, itinerary } });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:tripId', authenticate, async (req, res, next) => {
    try {
        const itinerary = await getTripItinerary(String(req.params.tripId), req.user.id);
        if (!itinerary) {
            return res.status(404).json({ success: false, error: { message: 'Itinerary not found', code: 'NOT_FOUND' } });
        }
        res.json({ success: true, data: itinerary });
    }
    catch (error) {
        next(error);
    }
});
export default router;

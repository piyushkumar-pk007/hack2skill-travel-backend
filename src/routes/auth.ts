import { Router } from 'express';
import { LoginSchema, RegisterSchema } from '@travel-engine/shared';
import { validateRequest } from '../middleware/validateRequest.js';
import { loginUser, registerUser } from '../services/userService.js';

const router = Router();

router.post('/register', validateRequest({ body: RegisterSchema }), async (req, res, next) => {
  try {
    const auth = await registerUser(req.body);
    res.status(201).json({ success: true, data: auth });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validateRequest({ body: LoginSchema }), async (req, res, next) => {
  try {
    const auth = await loginUser(req.body.email, req.body.password);
    res.json({ success: true, data: auth });
  } catch (error) {
    next(error);
  }
});

export default router;

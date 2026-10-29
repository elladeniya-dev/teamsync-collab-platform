import { Router } from 'express';
import {
  googleAuth,
  register,
  login,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/google', googleAuth);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;

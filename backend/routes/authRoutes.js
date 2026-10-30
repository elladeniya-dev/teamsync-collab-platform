import { Router } from 'express';
import {
  googleAuth,
  register,
  login,
  getMe,
  getAllUsers,
  updateUserRole,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.post('/google', googleAuth);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers);
router.patch('/users/:id/role', protect, requireRole(['Owner', 'Admin']), updateUserRole);

export default router;

import { Router } from 'express';
import taskRoutes from './taskRoutes.js';
import teamRoutes from './teamRoutes.js';
import authRoutes from './authRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/team', teamRoutes);

export default apiRouter;

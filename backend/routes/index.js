import { Router } from 'express';
import taskRoutes from './taskRoutes.js';
import teamRoutes from './teamRoutes.js';
import authRoutes from './authRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import workspaceRoutes from './workspaceRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/team', teamRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/workspaces', workspaceRoutes);

export default apiRouter;

import { Router } from 'express';
import taskRoutes from './taskRoutes.js';
import teamRoutes from './teamRoutes.js';

const apiRouter = Router();

apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/team', teamRoutes);

export default apiRouter;

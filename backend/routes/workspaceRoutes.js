import express from 'express';
import {
  getWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspaceController.js';

const router = express.Router();

router.get('/', getWorkspaces);
router.post('/', createWorkspace);
router.get('/:id', getWorkspaceById);
router.put('/:id', updateWorkspace);
router.patch('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);

export default router;

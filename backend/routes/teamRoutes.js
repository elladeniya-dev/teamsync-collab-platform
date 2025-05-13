import express from 'express';
import { getMembers, addMember, removeMember } from '../controllers/teamMemberController.js';

const router = express.Router();

router.get('/', getMembers);
router.post('/', addMember);
router.delete('/:id', removeMember);

export default router;
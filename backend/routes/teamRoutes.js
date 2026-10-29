import express from 'express';
import { getMembers, addMember, updateMember, removeMember } from '../controllers/teamMemberController.js';

const router = express.Router();

router.get('/', getMembers);
router.post('/', addMember);
router.put('/:id', updateMember);
router.patch('/:id', updateMember);
router.delete('/:id', removeMember);

export default router;

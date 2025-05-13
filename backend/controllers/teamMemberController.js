import TeamMember from '../models/TeamMember.js';

export const getMembers = async (req, res) => {
  try {
    const members = await TeamMember.find();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

export const addMember = async (req, res) => {
  try {
    const newMember = new TeamMember(req.body);
    await newMember.save();
    res.status(201).json(newMember);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add member' });
  }
};

export const removeMember = async (req, res) => {
  try {
    await TeamMember.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to remove member' });
  }
};

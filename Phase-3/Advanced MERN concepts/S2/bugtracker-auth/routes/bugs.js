import express from 'express';
import Bug from '../model/Bug.js';
import requirePermission from '../middleware/requirePermission.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

router.get('/', authenticate,  async (_req, res) => {
  try {
    const bugs = await Bug.find().sort({ createdAt: -1 });
    res.json(bugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found' });
    res.json(bug);
  } catch (error) {
    res.status(400).json({ message: 'Invalid bug id' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const bug = await Bug.create(req.body);
    res.status(201).json(bug);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const bug = await Bug.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!bug) return res.status(404).json({ message: 'Bug not found' });
    res.json(bug);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id', authenticate, requirePermission("update:any"), async (req, res) => {
  try {
    const bug = await Bug.findByIdAndUpdate(req.params.id,{status:  req.body.status}, {
      new: true,
      runValidators: true
    });
    if (!bug) return res.status(404).json({ message: 'Bug not found' });
    res.json(bug);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, requirePermission("delete:any"), async (req, res) => {
  try {
    const bug = await Bug.findByIdAndDelete(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found' });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ message: 'Invalid bug id' });
  }
});

export default router;
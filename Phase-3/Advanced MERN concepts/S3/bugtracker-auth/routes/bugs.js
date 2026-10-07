import express from 'express';
import Bug from '../model/Bug.js';
import { requirePermission, requireAnyPermission } from '../middleware/requirePermission.js';
import requireOwnershipUnless from '../middleware/requireOwnership.js';
import authenticate from '../middleware/authenticate.js';
import optionalAuthenticate from '../middleware/optionalAuthenticate.js';

const router = express.Router();

async function getBugOwnerId(req) {
  const bug = await Bug.findById(req.params.id);
  if (!bug) {
    const err = new Error('Bug not found');
    err.statusCode = 404;
    throw err;
  }
  return bug.reportedBy;
}

router.get('/', optionalAuthenticate, async (_req, res) => {
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
    const bug = await Bug.create({ ...req.body, reportedBy: req.user.userId });
    res.status(201).json(bug);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT removed — PATCH covers status updates with proper permission+ownership checks

router.patch('/:id',
  authenticate,
  requireAnyPermission(["update:any", "update:own"]),
  requireOwnershipUnless("update:any", getBugOwnerId),
  async (req, res) => {
    try {
      const bug = await Bug.findByIdAndUpdate(req.params.id, { status: req.body.status }, {
        new: true,
        runValidators: true
      });
      if (!bug) return res.status(404).json({ message: 'Bug not found' });
      res.json(bug);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

router.delete('/:id',
  authenticate,
  requireAnyPermission(["delete:any", "delete:own"]),
  requireOwnershipUnless("delete:any", getBugOwnerId),
  async (req, res) => {
    try {
      const bug = await Bug.findByIdAndDelete(req.params.id);
      if (!bug) return res.status(404).json({ message: 'Bug not found' });
      res.status(204).end();
    } catch (error) {
      res.status(400).json({ message: 'Invalid bug id' });
    }
  }
);

export default router;
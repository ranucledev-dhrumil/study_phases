import express from "express";
import Task from "../models/Task.js";
import validate from "../middleware/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../validation/taskValidation.js";

const router = express.Router();

// GET /api/tasks
router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task Not Found",
      });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post(
  "/",
  validate(createTaskSchema),
  async (req, res, next) => {
    try {
      const task = await Task.create(req.body);

      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/tasks/:id
router.put(
  "/:id",
  validate(updateTaskSchema),
  async (req, res, next) => {
    try {
      const task = await Task.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!task) {
        return res.status(404).json({
          message: "Task Not Found",
        });
      }

      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task Not Found",
      });
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;

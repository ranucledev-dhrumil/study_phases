import { z } from "zod";

const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required"),

    priority: z
      .enum(["low", "medium", "high"])
      .default("low"),
  })
  .strict();

const updateTaskSchema = z
  .object({
    status: z.enum(
      ["todo", "in-progress", "done"],
      {
        message: "Status must be todo, in-progress, or done",
      }
    ),
  })
  .strict();

export { createTaskSchema, updateTaskSchema };

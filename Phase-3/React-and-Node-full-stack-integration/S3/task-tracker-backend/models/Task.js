import mongoose from 'mongoose';

const TaskSchema = mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
        priority: { type: String, enum: ["low", "medium", "high"], default: "low" }
    }, { timestamps: true }
);

export default mongoose.model('Task', TaskSchema)
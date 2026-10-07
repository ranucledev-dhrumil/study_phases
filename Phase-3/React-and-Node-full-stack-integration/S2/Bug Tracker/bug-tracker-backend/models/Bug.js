import mongoose from 'mongoose';

const BugSchema = mongoose.Schema(
    {
        title: { type:String, required:true, trim:true},
        description: { type: String, required: true, trim: true },
        status: {type: String, enum: ['open', 'closed'], default: "open"}
    }, { timestamps: true }
);

export default mongoose.model('Bug', BugSchema)
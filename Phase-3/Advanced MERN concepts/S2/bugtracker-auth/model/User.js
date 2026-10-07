import mongoose from 'mongoose';

const UserSchema = mongoose.Schema(
    {
        email: { type: String, required: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['reporter', 'maintainer', 'admin'], default: "reporter" },
    }, { timestamps: true }
);

export default mongoose.model('User', UserSchema)
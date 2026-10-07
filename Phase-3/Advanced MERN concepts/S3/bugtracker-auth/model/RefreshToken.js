import mongoose from 'mongoose';

const RefreshTokenSchema = mongoose.Schema(
    {
        token: { type: String, required: true, unique: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        expiresAt: { type: Date, required: true }
    }, { timestamps: true }
);

export default mongoose.model('RefreshToken', RefreshTokenSchema)
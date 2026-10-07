import express from 'express';
import mongoose from 'mongoose';
import bugsRouter from './routes/bugs.js';
import 'dotenv/config'
import cors from 'cors'


const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
    throw new Error('MONGO_URI is required');
}

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true, // only if you actually need cookies/auth headers — otherwise omit
}));
app.use(express.json());
app.use('/api/bugs', bugsRouter);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

mongoose
    .connect(MONGO_URI)
    .then(() => {
        app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
    })
    .catch((error) => {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    });
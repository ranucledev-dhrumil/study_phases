import express from 'express'
import mongoose from 'mongoose'
import 'dotenv/config'
import cors from 'cors'
import TasksRouter from './routes/Tasks.js'
import ErrorHandler from './middleware/handleError.js'


const app = express();

const PORT = process.env.PORT || 3001
const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
    throw new Error('MONGO_URI is required');
}

app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
}))
app.use("/api/tasks", TasksRouter)
app.use(ErrorHandler)

mongoose
    .connect(MONGO_URI)
    .then(() => { app.listen(PORT, () => { console.log(`Backend running on http://localhost:${PORT}`) }) })
    .catch((error) => {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1)
    })
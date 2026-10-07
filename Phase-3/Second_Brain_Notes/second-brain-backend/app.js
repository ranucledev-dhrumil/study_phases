import 'dotenv/config'
import ErrorHandler from './middleware/handleError.js'
import express from 'express'
import connectDB from './db.js';
import itemsRouter from './routes/items.js'
import cors from 'cors'
import authRouter from './routes/auth.js'

const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
}))
connectDB();

app.use('/api/items', itemsRouter);
app.use('/api/auth', authRouter)
app.use(ErrorHandler)

app.listen(process.env.PORT || 3000, () => console.log(`Server running on ${process.env.PORT || 3000}`));
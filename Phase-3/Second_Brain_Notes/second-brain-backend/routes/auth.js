import express from 'express'
import User from '../models/User.js'
import bcrypt from 'bcrypt'
import config from '../config/env.js'
import authenticate from '../middleware/authenticate.js';
import {
    signAccessToken,
} from '../services/tokenService.js'

const router = express.Router();

router.post("/register", async (req, resp, next) => {
    try {
        const pass = req.body.password
        const email = req.body.email
        const hashedPass = await bcrypt.hash(pass, 10)

        const user = await User.create({ email, password: hashedPass })

        resp.status(201).json({
            id: user._id,
            email: user.email,
        });
    }
    catch (e) {
        next(e)
    }
})

router.post("/login", async (req, resp, next) => {
    try {
        const pass = req.body.password
        const email = req.body.email

        const user = await User.findOne({ email });
        if (!user) { throw new Error('Invalid Credentials') }

        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) { throw new Error('Invalid credentials'); }

        const userId = user._id;
        const ACCESS_SECRET = config.jwt.accessSecret;

        const accessToken = signAccessToken({ userId })

        resp.status(200).json({
            id: user._id,
            email: user.email,
            accessToken: accessToken
        });
    }
    catch (e) {
        next(e)
    }
})

export default router;
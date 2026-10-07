import express from 'express'
import User from '../model/User.js'
import bcrypt from 'bcrypt'
import RefreshToken from '../model/RefreshToken.js';
import config from '../config/env.js'
import authenticate from '../middleware/authenticate.js';
import requirePermission from '../middleware/requirePermission.js';
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from '../services/tokenService.js'

const router = express.Router();

router.post("/register", async (req, resp, next) => {
    try {
        const pass = req.body.password
        const email = req.body.email
        const role = 'reporter'
        const hashedPass = await bcrypt.hash(pass, 10)
        console.log(hashedPass)

        const user = await User.create({ email, password: hashedPass, role })

        resp.status(201).json({
            id: user._id,
            email: user.email,
            role: user.role,
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
        console.log(pass)

        const user = await User.findOne({ email });
        if (!user) { throw new Error('Invalid Credentials') }

        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) { throw new Error('Invalid credentials'); }

        const userId = user._id;
        const ACCESS_SECRET = config.jwt.accessSecret;
        const REFRESH_SECRET = config.jwt.refreshSecret;

        const accessToken = signAccessToken({ userId })
        const refreshToken = signRefreshToken({ userId })

        await RefreshToken.create({ token: refreshToken, user: user._id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });

        resp.status(200).json({
            id: user._id,
            email: user.email,
            role: user.role,
            refreshToken: refreshToken,
            accessToken: accessToken
        });
    }
    catch (e) {
        next(e)
    }
})

router.post("/refresh", async (req, resp, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return resp.status(401).json({
                message: "Refresh token required",
            });
        }

        const decoded = verifyRefreshToken(
            refreshToken,
            config.jwt.refreshSecret
        );

        const storedToken = await RefreshToken.findOne({
            token: refreshToken,
        });

        if (!storedToken) {
            return resp.status(401).json({
                message: "Invalid refresh token",
            });
        }

        const userId = decoded.userId;
        const ACCESS_SECRET = config.jwt.accessSecret;

        const newAccessToken = signAccessToken({ userId })

        resp.status(200).json({
            accessToken: newAccessToken,
        });
    }
    catch (e) {
        next(e)
    }
})


router.post("/logout", async (req, resp, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return resp.status(400).json({
                message: "Refresh token required",
            });
        }

        await RefreshToken.deleteOne({
            token: refreshToken,
        });

        resp.status(200).json({
            message: "Logged out successfully",
        });
    }
    catch (e) {
        next(e)
    }
})


router.patch("/users/:id/role", authenticate, requirePermission('manage:roles'), async (req, resp, next) => {
    try {
        const allowedRoles = ["reporter", "maintainer", "admin"];

        if (!allowedRoles.includes(req.body.role)) {
            return resp.status(400).json({
                message: "Invalid role",
            });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, {
            new: true,
            runValidators: true
        });
        if (!user) return resp.status(404).json({ message: 'User not found' });
        resp.json({
            id: user._id,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        resp.status(400).json({ message: error.message });
    }

})

export default router;
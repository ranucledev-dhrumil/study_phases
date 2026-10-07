
import jwt from 'jsonwebtoken'
import config from '../config/env.js'


const signAccessToken = (payload) => {
    return jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn,
    });
};

const signRefreshToken = (payload) => {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    });
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, config.jwt.accessSecret);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.jwt.refreshSecret);
};

export default {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
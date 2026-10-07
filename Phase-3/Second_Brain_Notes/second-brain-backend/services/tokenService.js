import jwt from 'jsonwebtoken'
import config from '../config/env.js'


const signAccessToken = (payload) => {
    return jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn,
    });
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, config.jwt.accessSecret);
};

export {
    signAccessToken,
    verifyAccessToken,
};
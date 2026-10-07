import config from '../config/env.js'
import {verifyAccessToken} from '../services/tokenService.js'

function authenticate(req, resp, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return resp.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = verifyAccessToken(token)

        req.user = decoded
        next();
    }
    catch (e) {
        return resp.status(401).json({
            message: "Invalid or expired token",
        });
    }
}

export default authenticate;
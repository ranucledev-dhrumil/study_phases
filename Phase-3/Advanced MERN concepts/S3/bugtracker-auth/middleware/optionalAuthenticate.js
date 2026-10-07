import { verifyAccessToken } from "../services/tokenService.js";

const optionalAuthenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        req.user = verifyAccessToken(token);
        next();
    } catch (error) {
        // Invalid token → continue as anonymous
        next();
    }
};

export default optionalAuthenticate;
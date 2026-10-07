import jwt from 'jsonwebtoken'

function authenticate(req, resp, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return resp.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.ACCESS_SECRET)

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
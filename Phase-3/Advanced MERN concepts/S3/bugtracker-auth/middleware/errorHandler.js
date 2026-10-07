function errorHandler(err, req, res, next) {
    console.error(err);

    // JWT: invalid token
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            message: "Invalid token",
        });
    }

    // JWT: expired token
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            message: "Token expired",
        });
    }

    // Mongoose validation errors
    if (err.name === "ValidationError") {
        return res.status(400).json({
            message: err.message,
        });
    }

    // Generic errors
    return res.status(err.status || 500).json({
        message: err.message || "Internal server error",
    });
}

export default errorHandler;
function handleError(err, req, resp, next) {
    if (err.name === "CastError") {
        return resp.status(400).json({ message: 'Invalid ID' });
    }
    if (err.statusCode) {
        return resp.status(err.statusCode).json({ message: err.message });
    }
    return resp.status(500).json({ message: "Internal Server Error" });
}
export default handleError
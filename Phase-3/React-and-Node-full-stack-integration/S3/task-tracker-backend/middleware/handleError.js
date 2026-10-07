function handleError(err, req, resp, next) {
    if (err.name === "CastError") {
        return resp.status(400).json({
            message: 'Invalid ID'
        });
    }
    return resp.status(500).json({
        message: "Internal Server Error"
    })

}

export default handleError
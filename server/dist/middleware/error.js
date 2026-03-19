export class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
export function asyncHandler(handler) {
    return (req, res, next) => {
        handler(req, res, next).catch(next);
    };
}
export function notFound(_req, res) {
    res.status(404).json({ message: "Route not found." });
}
export function errorHandler(error, _req, res, _next) {
    if (error instanceof HttpError) {
        res.status(error.status).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "An unexpected error occurred." });
}

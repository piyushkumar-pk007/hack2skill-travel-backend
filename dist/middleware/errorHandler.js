export function errorHandler(err, _req, res, _next) {
    const status = err.status ?? 500;
    const isOperational = status < 500;
    if (!isOperational) {
        console.error('[Unhandled error]', err);
    }
    res.status(status).json({
        success: false,
        error: {
            message: isOperational ? err.message : 'Internal server error',
            code: err.code ?? 'INTERNAL_ERROR',
        },
    });
}

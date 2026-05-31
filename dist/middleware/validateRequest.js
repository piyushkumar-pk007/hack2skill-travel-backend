export function validateRequest(schemas) {
    return (req, res, next) => {
        const targets = [
            ['body', req.body, schemas.body],
            ['query', req.query, schemas.query],
            ['params', req.params, schemas.params],
        ];
        for (const [name, value, schema] of targets) {
            if (!schema) {
                continue;
            }
            const result = schema.safeParse(value);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: result.error.issues.map((issue) => `${name}.${issue.path.join('.') || 'root'} ${issue.message}`).join('. '),
                        code: 'VALIDATION_ERROR',
                    },
                });
            }
            req[name] = result.data;
        }
        next();
    };
}

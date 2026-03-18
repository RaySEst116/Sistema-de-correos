export const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.connection.remoteAddress;
    
    
    // Capturar el tiempo de respuesta
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
    });
    
    next();
};

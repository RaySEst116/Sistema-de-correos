export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Error de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Error de validación',
            details: err.message
        });
    }
    
    // Error de base de datos
    if (err.code?.startsWith('ER_')) {
        return res.status(500).json({
            error: 'Error en la base de datos',
            details: err.message
        });
    }
    
    // Error por defecto
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor'
    });
};

export const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path,
        method: req.method
    });
};

export const successResponse = (data, message = 'Operación exitosa') => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

export const errorResponse = (message, code = 500, details = null) => {
    return {
        success: false,
        error: message,
        code,
        details,
        timestamp: new Date().toISOString()
    };
};

export const paginatedResponse = (data, page, limit, total, message = 'Datos recuperados') => {
    const totalPages = Math.ceil(total / limit);
    
    return {
        success: true,
        message,
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        },
        timestamp: new Date().toISOString()
    };
};

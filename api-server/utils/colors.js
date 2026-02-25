// Utilidades de colores para la consola
export const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};

// Funciones helper para logging con colores
export const log = {
    success: (message) => console.log(`${colors.green}%s${colors.reset}`, message),
    error: (message) => console.error(`${colors.red}%s${colors.reset}`, message),
    warning: (message) => console.warn(`${colors.yellow}%s${colors.reset}`, message),
    info: (message) => console.log(`${colors.cyan}%s${colors.reset}`, message),
    server: (message) => console.log(`${colors.blue}%s${colors.reset}`, message),
    websocket: (message) => console.log(`${colors.magenta}%s${colors.reset}`, message),
    database: (message) => console.log(`${colors.green}%s${colors.reset}`, message),
    highlight: (message) => console.log(`${colors.bright}${colors.white}%s${colors.reset}`, message)
};

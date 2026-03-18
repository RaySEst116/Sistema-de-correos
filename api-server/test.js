const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME
};

async function prueba() {
    try {
        const pool = mysql.createPool(dbConfig);
    
        // Si esto falla aquí, es la librería. Si pasa, es tu server.js.
        const connection = await pool.getConnection(); 
        
        
        connection.release();
        process.exit(0);
    } catch (e) {
        console.error("❌ ERROR FATAL:", e);
        process.exit(1);
    }
}

prueba();
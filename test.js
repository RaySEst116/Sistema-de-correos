const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost', 
    port: 3307, 
    user: 'root', 
    password: '1234', 
    database: 'alhmail_security'
};

async function prueba() {
    try {
        console.log("1. Creando Pool...");
        const pool = mysql.createPool(dbConfig);
        
        console.log("2. Intentando obtener conexión (getConnection)...");
        // Si esto falla aquí, es la librería. Si pasa, es tu server.js.
        const connection = await pool.getConnection(); 
        
        console.log("✅ ¡ÉXITO! La conexión funciona y .getConnection() existe.");
        
        connection.release();
        process.exit(0);
    } catch (e) {
        console.error("❌ ERROR FATAL:", e);
        process.exit(1);
    }
}

prueba();
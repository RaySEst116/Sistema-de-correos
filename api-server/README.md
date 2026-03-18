# API Server - Sistema de Correos

Backend refactorizado con arquitectura modular y limpia para el sistema de correos Alhmail.

## 🏗️ Estructura del Proyecto

```
api-server/
├── src/
│   └── server.js              # Servidor principal y punto de entrada
├── config/
│   ├── app.js                 # Configuración de la aplicación
│   └── database.js            # Configuración de base de datos
├── controllers/
│   ├── authController.js      # Controlador de autenticación
│   ├── contactController.js   # Controlador de contactos
│   ├── emailController.js     # Controlador de emails
│   ├── healthController.js    # Controlador de health checks
│   └── userController.js      # Controlador de usuarios
├── middleware/
│   ├── errorHandler.js        # Middleware de manejo de errores
│   └── requestLogger.js       # Middleware de logging de peticiones
├── models/
│   ├── Contact.js             # Modelo de contactos
│   ├── Email.js               # Modelo de emails
│   └── User.js                # Modelo de usuarios
├── routes/
│   ├── index.js               # Rutas principales
│   ├── auth.js                # Rutas de autenticación
│   ├── contacts.js            # Rutas de contactos
│   ├── emails.js              # Rutas de emails
│   ├── health.js              # Rutas de health checks
│   └── users.js               # Rutas de usuarios
├── services/
│   ├── authService.js         # Servicio de autenticación
│   ├── emailService.js        # Servicio de emails
│   ├── securityService.js     # Servicio de seguridad
│   └── websocketService.js    # Servicio de WebSocket
├── utils/
│   ├── colors.js              # Utilidades de colores para consola
│   └── responseFormatter.js   # Utilidades de formato de respuesta
├── package.json               # Dependencias y scripts
├── test.js                    # Script de prueba de BD
└── README.md                  # Este archivo
```

## 🚀 Instalación y Ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto con:
```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Correo
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASS=your_app_password

# Servidor
PORT=3001

# IA (opcional)
GEN_AI_KEY=your_gemini_api_key
```

### 3. Ejecutar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start

# Probar conexión a BD
npm run db:test
```

## 📡 API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/profile` - Obtener perfil (requiere autenticación)

### Usuarios
- `GET /users` - Obtener todos los usuarios
- `GET /users/:id` - Obtener usuario por ID
- `POST /users` - Crear usuario
- `PUT /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario

### Emails
- `GET /emails` - Obtener emails de un usuario
- `POST /emails` - Enviar email interno
- `POST /emails/downloaded` - Eliminar emails descargados
- `DELETE /emails/:id` - Eliminar email específico
- `PUT /emails/:id` - Actualizar estado (leído/no leído)

### Contactos
- `GET /contacts` - Obtener todos los contactos
- `POST /contacts` - Crear contacto
- `PUT /contacts/:id` - Actualizar contacto
- `DELETE /contacts/:id` - Eliminar contacto

### Health Checks
- `GET /ping` - Ping básico
- `GET /health` - Health check completo

## 🔌 WebSocket Events

### Cliente → Servidor
- `health-check` - Solicitar estado del servidor

### Servidor → Cliente
- `server-status` - Estado inicial del servidor
- `health-response` - Respuesta de health check
- `new-email` - Notificación de nuevo email
- `email-status-updated` - Actualización de estado de email
- `notification` - Notificación general

## 🛡️ Características de Seguridad

- Análisis heurístico de contenido spam
- Detección de adjuntos peligrosos
- Listas blancas/negras de remitentes
- Validación de entrada de datos
- Manejo seguro de errores

## 🔧 Configuración

### Base de Datos
- Pool de conexiones MySQL con límite de 10 conexiones
- Reconexión automática
- Manejo de transacciones

### CORS
Configurado para `http://localhost:5173` (frontend)

### WebSocket
- Comunicación en tiempo real
- Notificaciones instantáneas
- Health checks via WebSocket

### Colores en Consola
El sistema utiliza códigos de color ANSI para mejorar la legibilidad:
- **Verde**: Operaciones exitosas
- **Rojo**: Errores y advertencias críticas
- **Amarillo**: Advertencias y señales del sistema
- **Cyan**: Información general y health checks
- **Azul**: Información del servidor
- **Magenta**: Eventos de WebSocket

## 📝 Mejoras Implementadas

### ✅ Separación de Responsabilidades
- **Configuración**: Variables de entorno y constantes centralizadas
- **Modelos**: Acceso a datos desacoplado
- **Servicios**: Lógica de negocio separada
- **Controladores**: Manejo de HTTP puro
- **Rutas**: Definición de endpoints organizada

### ✅ Limpieza de Código
- Eliminación de emojis, reemplazados por texto con colores
- Nomenclatura consistente
- Documentación clara
- Manejo de errores centralizado

### ✅ Orden y Estructura
- Arquitectura modular
- Dependencias claras
- Imports organizados
- Middleware reutilizable

### ✅ Control y Monitoreo
- Logging con colores para mejor legibilidad
- Health checks
- Manejo de errores
- Métricas básicas

## 🔄 Migración desde el Monolito

El archivo original `node.js` ha sido completamente refactorizado:

1. **Configuración** → `config/`
2. **Rutas** → `routes/`
3. **Lógica de negocio** → `services/`
4. **Acceso a datos** → `models/`
5. **Manejo HTTP** → `controllers/`
6. **Middleware** → `middleware/`
7. **Servidor principal** → `src/server.js`

## 🚨 Notas Importantes

- La IA de Gemini está desactivada por defecto
- El sistema de autenticación es básico (sin JWT por ahora)
- Las contraseñas se guardan en texto plano (solo para desarrollo)
- Se recomienda implementar medidas de seguridad adicionales para producción
- Los colores en consola mejoran la experiencia de desarrollo sin depender de emojis

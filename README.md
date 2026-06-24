# 🛰️ ABD Logs Microservice - Central de Auditoría

[![ERA 11 Certified](https://img.shields.io/badge/ERA%2011-CERTIFIED-brightgreen?style=for-the-badge&logo=shield)](../.github/workflows/audit.yml)

Consola centralizada e ingesta de logs de auditoría técnica y operacional para el ecosistema **ABD**.

---

## 🚀 Arquitectura y Tecnologías
El microservicio está certificado bajo los más altos estándares de **Clean Architecture** e incluye:

*   **Next.js 16.2.6 & React 19**: Aprovecha al máximo los React Server Components (RSC).
*   **Mongoose 9.6.2 & Zod**: Capa de persistencia con tipados estrictos y base de datos centralizada de logs en MongoDB Atlas.
*   **Next-Intl**: Soporte multilingüe integral (Inglés / Español) mediante enrutamiento localizado con prefijos de idioma (`/[locale]`).
*   **Encadenamiento Criptográfico SOC2**: Aseguramiento forense de logs mediante firmas SHA-256 acumulativas (`previousHash` + `payload`) por Tenant, con validación de integridad inmutable.

---

## 🛠️ Guía de Inicio Rápido

### Requisitos Previos
Configurar las variables de entorno en el archivo `.env.local`:
```env
MONGODB_URI=mongodb+srv://...
DATABASE_URL=mongodb+srv://...
ENCRYPTION_SECRET=...
LOGS_SECRET_TOKEN=...
```

### Comandos de Desarrollo
Para arrancar el servidor local en el puerto oficial **`5003`**:
```powershell
# Levantar el entorno local
.\start.bat
```

Para validar tipos estáticos, compilación y empaquetado de producción:
```powershell
pnpm build
```

---

## 📜 Manifestos del Proyecto
*   **[PROGRESS.md](file:///d:/desarrollos/ABDLogs/PROGRESS.md)**: Tablero de hitos técnicos y fases completadas.
*   **[ROADMAP.md](file:///d:/desarrollos/ABDLogs/ROADMAP.md)**: Planificación estratégica y próximos hitos.

---

## ☁️ Despliegue en Producción (Vercel)

### 🛠️ Configuración de Variables de Entorno en Vercel

| Variable de Entorno | Valor en Local (`.env.local`) | Valor en Producción (Vercel) | Razón / Propósito |
| :--- | :--- | :--- | :--- |
| **`NEXTAUTH_URL`** | `http://localhost:5003` | `https://abd-logs.vercel.app` | URL base para la autenticación. |
| **`AUTH_URL`** | `http://localhost:5003` | `https://abd-logs.vercel.app` | URL de callback e inicio del flujo de Auth.js. |
| **`APP_DOMAIN`** | `localhost:5003` | `abd-logs.vercel.app` | Dominio base para resolución. |
| **`NEXT_PUBLIC_APP_URL`** | `http://localhost:5003` | `https://abd-logs.vercel.app` | URL pública de la aplicación para APIs y recursos. |
| **`AUTH_JWT_SECRET`** | `abd-suite-shared-industrial-secret-2026-prod` | `[Misma clave compartida]` | Secreto compartido de firma simétrica para criptografía de sesión federada. |

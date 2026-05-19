# 🛰️ ABD Multi-Tenant Control Plane - Gobernanza

Consola centralizada de gobernanza de tenants, administración de sub-espacios corporativos y personalización visual en tiempo real con inyección SSR Zero-FOUC para el ecosistema **ABD**.

---

## 🚀 Arquitectura y Tecnologías
La plataforma está certificada bajo los más altos estándares de **Clean Architecture** (Era 11) e incluye:

*   **Next.js 16.2.6 & React 19**: Aprovecha al máximo los React Server Components (RSC) y las Server Actions seguras.
*   **Tailwind CSS v4 & @abd/styles**: Inyección reactiva y dinámica de variables CSS HSL síncronas en el servidor para evitar parpadeos visuales en el cliente (Zero-FOUC).
*   **Mongoose 9.6.2 & Zod**: Capa de persistencia con tipados estrictos `QueryFilter<T>`, validaciones en tiempo de ejecución de Zod y aislamiento lógico robusto a través de `TenantAwareRepository`.
*   **Next-Intl**: Soporte multilingüe integral (Inglés / Español) mediante enrutamiento localizado con prefijos de idioma (`/[locale]`).

---

## 🛠️ Guía de Inicio Rápido

### Requisitos Previos
Configurar las variables de entorno en el archivo [**.env.local**](file:///d:/desarrollos/ABDtenantGobernance/.env.local):
```env
MONGODB_URI=mongodb+srv://...
DATABASE_URL=mongodb+srv://...
ENCRYPTION_SECRET=...
CLOUDINARY_URL=cloudinary://...
```

### Comandos de Desarrollo
Para arrancar el servidor local en el puerto oficial **`3500`** e inicializar el Control Plane:
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
*   **[PROGRESS.md](file:///d:/desarrollos/ABDtenantGobernance/PROGRESS.md)**: Tablero de hitos técnicos y fases completadas.
*   **[ROADMAP.md](file:///d:/desarrollos/ABDtenantGobernance/ROADMAP.md)**: Planificación estratégica y próximos hitos.
*   **[LESSONS_LEARNED.md](file:///d:/desarrollos/ABDtenantGobernance/docs/LESSONS_LEARNED.md)**: Santuario de descubrimientos de ingeniería y blindaje de código.

---

## ☁️ Despliegue en Producción (Vercel)

La plataforma está oficialmente desplegada en producción en Vercel:
*   **URL de Producción**: [https://abd-tenant-gobernance.vercel.app/](https://abd-tenant-gobernance.vercel.app/)

### 🛠️ Configuración de Variables de Entorno en Vercel

Para que la aplicación funcione perfectamente en el entorno productivo de Vercel sin apuntar a servicios o puertos locales (`localhost`), debes configurar las siguientes variables de entorno en el panel de administración del proyecto en Vercel (`Project Settings > Environment Variables`):

| Variable de Entorno | Valor en Local (`.env.local`) | Valor en Producción (Vercel) | Razón / Propósito |
| :--- | :--- | :--- | :--- |
| **`NEXTAUTH_URL`** | `http://localhost:3500` | `https://abd-tenant-gobernance.vercel.app` | URL base para la autenticación de NextAuth. |
| **`AUTH_URL`** | `http://localhost:3500` | `https://abd-tenant-gobernance.vercel.app` | URL de callback e inicio del flujo de Auth.js. |
| **`APP_DOMAIN`** | `localhost:3500` | `abd-tenant-gobernance.vercel.app` | Dominio base para resolución de subdominios. |
| **`NEXT_PUBLIC_APP_URL`** | `http://localhost:3500` | `https://abd-tenant-gobernance.vercel.app` | URL pública de la aplicación para APIs y recursos. |
| **`FEATURE_GRAPH_RELATIONS`**| `true` | `false` (o `true` con AuraDB en la nube) | Desactivar si no cuentas con un servidor de Neo4j accesible públicamente en la nube. |
| **`REDIS_URL`** | `"redis://localhost:6379"` | (Usar Endpoint TLS de Upstash en la nube) | Configurar con la URL TLS de Redis remota si utilizas cacheo de sesiones productivo. |

*Nota: Las variables de conexión a MongoDB Atlas (`DATABASE_URL`, `MONGODB_URI`, `MONGODB_LOGS_URI`) y el SSO centralizado (`AUTH_PROVIDER_URL` en `https://abd-auth.vercel.app`) ya apuntan a servicios productivos en la nube, por lo que pueden ser importadas textualmente sin cambios.*


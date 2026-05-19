# 🗺️ Hoja de Ruta de Gobernanza - ABD Gobernanza

Este documento detalla la planificación estratégica, las fases del ecosistema multi-tenant y los próximos hitos a desarrollar en la consola centralizada de gobernanza.

---

## 🏁 Estado de Hitos del Roadmap

### 🟩 Completado (Completed)
- **Fase 1: Marca Blanca en Tiempo Real (SSR Zero-FOUC)**
  - Inyección dinámica de CSS HSL adaptada a Tailwind CSS v4.
  - Recálculo dinámico de contraste de texto basado en luminancia YIQ.
- **Fase 2: Consola Visual Interactiva & Cloudinary CDN**
  - Subida directa de logotipos y favicons a Cloudinary CDN con borrado automático de obsoletos.
  - Server Actions y refresco reactivo con Sonner.
- **Fase 3: Capa de Datos Aislada y Segura**
  - Repositorio genérico adaptado a `QueryFilter<T>` de Mongoose 9.x.
  - `TenantAwareRepository` para aislamiento seguro de datos de múltiples organizaciones.
- **Fase 8: Gobernanza de Ecosistema Multi-Tenant**
  - Consola CRUD de administración de organizaciones, industrias y bases de datos aisladas.
  - API de administración perimetral y guardas de seguridad (`ensureIndustrialAccess`).
  - Internacionalización i18n al 100% de cobertura en español e inglés.
  - Personalización de marca blanca dinámica a nivel de tenant aislado con botón de acceso directo contextual y Selector de Contexto (*Context Switcher*) integrado.
- **Fase 9: Jerarquía de Espacios & Rutas Materializadas**
  - Integrar el servicio backend `SpaceService` (con actualización recursiva en cascada) con la interfaz de usuario.
  - Modelo de tipología aséptica mediante `customSpaceLabels` derivado de la profundidad de cada nodo raíz.

### 🟨 En Curso (Active Development)
- **Fase 9.5: Refinamiento de Permisos Espaciales**
  - Preparar la gestión de visibilidad (`INTERNAL`, `PRIVATE`, `PUBLIC`) por espacio materializado.

### 🟦 Próximamente (Future Roadmap)
- **Fase 10: Auditoría en Cadena en MongoDB Atlas**
  - Registro de auditoría centralizado para capturar cada cambio de marca y espacio.
  - Visualización del historial de configuraciones por tenant.

---

## 🔗 Enlaces Clave a Módulos Activos
*   **Consola de Marca**: `/[locale]/admin/branding`
*   **Gobernanza de Organizaciones**: `/[locale]/admin/tenants`
*   **Documentación de Lecciones Aprendidas**: [LESSONS_LEARNED.md](file:///d:/desarrollos/ABDtenantGobernance/docs/LESSONS_LEARNED.md)

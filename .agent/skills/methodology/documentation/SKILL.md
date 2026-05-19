---
name: industrial-documentation-sync
description: Protocolo automatizado para la sincronización y blindaje de la verdad única, especificaciones y lecciones aprendidas arquitectónicas en ABD Gobernanza.
---

# Skill: Industrial Documentation Sync 📜🛡️

Este protocolo automatiza la sincronización de la documentación técnica, especificaciones funcionales e hitos de la plataforma **ABD Gobernanza**. Asegura que la verdad única del repositorio refleje de forma fiel la pureza arquitectónica y las lecciones críticas de ingeniería descubiertas en cada fase.

---

## 🎯 Objetivos
1.  **Preservar la Verdad Única**: Sincronizar dinámicamente `PROGRESS.md`, `ROADMAP.md` y `README.md` con la realidad operativa del código fuente.
2.  **Blindar el Conocimiento (Evitar Regresiones)**: Garantizar la documentación exhaustiva en `docs/LESSONS_LEARNED.md` ante cualquier resolución de bugs complejos o comportamientos críticos del framework (React 19, Next.js 16, Tailwind v4).
3.  **Zero-Noise Documentation**: Asegurar que toda la documentación siga los estrictos estándares de la Era 11, libre de ambigüedades, desactualizaciones o código hardcodeado.

---

## 🛠️ Flujo de Sincronización de Hitos

### 1. Auditoría del Impacto de Código
*   Revisar los archivos modificados en la tarea actual (componentes, API routes o globales).
*   Identificar dependencias o cambios en el flujo de sesiones federadas con el IdP central (**ABDAuth**).
*   Localizar variaciones en el sistema de estilos de temas dinámicos (Claro / Oscuro).

### 2. Sincronización de Manifiestos de Estado
*   **`PROGRESS.md`**:
    *   Marcar cada hito completado con `[X]` o `✅`.
    *   Registrar nuevas funcionalidades añadidas bajo la fase correspondiente (ej. hitos 2.10, 2.11, etc.).
    *   Actualizar la fecha de última certificación de estado (`SYS_CERTIFIED`).
*   **`ROADMAP.md`**:
    *   Mover los objetivos completados a la sección "Completed".
    *   Actualizar enlaces directos a las nuevas rutas y módulos (ej. `/admin/branding` en lugar de las antiguas vistas).
*   **`README.md`**:
    *   Garantizar que los comandos de inicio rápido (`npm run dev`) y puertos asignados (`3500`) estén actualizados.
    *   Actualizar el estatus de las tecnologías integradas (Next.js 16, React 19, Tailwind CSS v4, Next-Intl).

### 3. El Santuario de Lecciones Aprendidas (`docs/LESSONS_LEARNED.md`)
Cada vez que se resuelva un reto técnico complejo o una falla silenciosa de renderizado, **es obligatorio** documentar el incidente detallando:

1.  **El Síntoma**: Qué error reportaba la consola o qué fallo de interfaz inerte se detectaba.
2.  **La Causa Raíz**: El origen exacto del fallo a nivel del compilador Turbopack, la hidratación de React o el flujo de red.
3.  **La Solución Industrial**: El código modelo o patrón recomendado para blindar el repositorio de cara al futuro.

> [!IMPORTANT]
> **Lecciones críticas obligatorias a vigilar**:
> - **Hydration Mismatches en React 19**: Controlar renderizados cliente basados en variables que cambian (como `localStorage` de temas o cookies de usuario) usando siempre un estado `mounted` antes de pintar o asociar eventos interactivos.
> - **Inyección de Estilos en Head**: Usar scripts síncronos inline en `layout.tsx` para configurar temas visuales globales antes de la renderización del DOM para evitar destellos lumínicos (*flashes*).
> - **SSO y Etiquetas de Salida**: Evitar el uso de `<Link>` de cliente para rutas que limpien sesiones y redirijan a dominios externos; usar siempre etiquetas `<a>` nativas.
> - **Abstracción por Tokens Semánticos**: Vetar el uso de clases de color hardcodeadas (`bg-black`, `border-white/10`) y exigir el uso de tokens semánticos del sistema (`border-border`, `bg-background`, `bg-muted`) para garantizar la mutabilidad inmediata del tema.

---

## 🛡️ Reglas de Oro de Documentación
*   **Cero Redundancias**: Si una especificación técnica o arquitectura de base de datos está detallada en un archivo de `docs/` (ej. `TENANT_GOVERNANCE.md`), no la dupliques en el README. Usa hipervínculos markdown directos.
*   **Fechas Estelares de Proyecto**: Toda actualización cronológica de progreso debe registrar la fecha exacta de su certificación.
*   **Tags de Estado Homologados**: Emplear únicamente estados aprobados de gobernanza: `SYS_READY`, `SYS_CERTIFIED`, `ALPHA`, `BETA`.

---

## 🚀 Disparadores de Uso de esta Skill
Esta skill **debe** ejecutarse siempre en los siguientes escenarios:
-   Tras finalizar o desplegar con éxito una tarea que involucre refactorizaciones visuales o arquitectónicas.
-   Inmediatamente después de diagnosticar y corregir un error crítico de ciclo de vida o renderizado (como un Hydration Mismatch).
-   Antes de realizar una entrega formal o hand-off de sesión de trabajo al usuario o a otros agentes.

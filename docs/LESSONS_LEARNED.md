# 📜 Lecciones Aprendidas - ABD Logs

Este documento funciona como el Santuario de Lecciones Aprendidas del microservicio de Gobernanza y Logs. Registra los incidentes de ingeniería complejos resueltos, sus causas raíces y soluciones industriales validadas para evitar regresiones técnicas.

---

## 🔑 Lección 1: Bucle de Redirecciones SSO (`ERR_TOO_MANY_REDIRECTS`)

### 1. El Síntoma
Al intentar loguearse o navegar por las páginas protegidas de `https://abd-logs.vercel.app/` en producción, el navegador entraba en un bucle infinito de redirecciones entre `abd-logs` (satélite) y `abd-auth` (IdP central) que terminaba con el error `ERR_TOO_MANY_REDIRECTS` o redirección constante a la ruta de callback con el código `"Code already used"`.

### 2. La Causa Raíz
* **Asimetría de Firmas Criptográficas**: `ABDAuth` (NextAuth) firma los tokens usando la variable `AUTH_JWT_SECRET`, cayendo en el fallback de `AUTH_SECRET` si no está configurada. Por su parte, `ABDLogs` verifica dichos tokens a través de su middleware (`proxy.ts`) consultando únicamente `AUTH_JWT_SECRET` (cayendo en el fallback de desarrollo local `'abd-auth-industrial-fallback-secret-2026'`).
* **Desconexión en Vercel**: En el Dashboard de Vercel no se había alineado `AUTH_JWT_SECRET` en ambos proyectos. Esto provocaba que `ABDAuth` firmase con su propia variable `AUTH_SECRET` autogenerada de NextAuth, y `ABDLogs` intentase descifrar el token usando el fallback local. El token era catalogado como inválido, el usuario se consideraba desautenticado, y el proxy le redirigía de nuevo a autenticarse al IdP, reiniciando el ciclo.

### 3. La Solución Industrial
* **Unificación de Secretos en el Panel de Control**: Es mandatorio definir la variable de entorno `AUTH_JWT_SECRET` en todos los proyectos satélites (`abd-logs`, `abd-quiz`, `abd-tenant-gobernance`) y en el IdP central (`abd-auth`) del panel de control de Vercel usando la misma clave simétrica compartida (ej: `abd-suite-shared-industrial-secret-2026-prod`).
* **Robustez ante Fallos de Sesión**: Implementar un bloque de resiliencia en el callback del satélite para capturar fallos de intercambio y, si ya existe una cookie de sesión local válida, resolver gracefully redirigiendo al estado original en lugar de relanzar el flujo JSON de error.

---

## 🍔 Lección 2: Bloqueo de Interfaz e Inactividad en Botón Hamburguesa (`TacticalSidebar`)

### 1. El Síntoma
Al abrir el panel de navegación lateral táctil en entornos de producción, el menú flotante se desplegaba correctamente pero no permitía interactuar con el botón flotante de hamburguesa (el cual cambia al icono `X`) para cerrarlo. El componente desplegado "se quedaba fijo" u obstaculizaba la vista sin responder a clics en la zona del disparador.

### 2. La Causa Raíz
* **Superposición de Capas de Interfaz (Z-Index)**: El disparador flotante del menú lateral estaba configurado con una propiedad CSS estática de `z-40`. Sin embargo, al abrir el menú se inyectaban en el DOM el velo oscuro de fondo (`backdrop` con `z-[45]`) y el propio contenedor `aside` (`z-50`).
* **Oclusión Física**: Al tener el panel y el backdrop un z-index superior (`z-50` y `z-[45]`) al del botón disparador (`z-40`), este quedaba ocultado/bloqueado por debajo de las nuevas capas, impidiendo cualquier captura de eventos de puntero (clic/touch) sobre el icono de cierre.

### 3. La Solución Industrial
* **Z-Index Dinámico**: Modificar la clase del botón en `TacticalSidebar.tsx` de `@ajabadia/styles` mediante el utilitario `cn()` para inyectar una clase dinámica de prioridad en caliente:
  ```typescript
  className={cn(
    "fixed top-6 left-6 p-3 rounded-none ...",
    isOpen ? "z-[55]" : "z-40"
  )}
  ```
  De esta forma, cuando el menú está cerrado, el botón no invade otras interfaces modales superiores (`z-40`), pero al abrirse salta a la cima de la pila visual (`z-[55]`) superando al panel (`z-50`) y al velo oscuro, garantizando plena interactividad.
* **Empaquetado y Distribución Centralizada**: Ejecutar siempre el build de distribución (`tsc`) en `@ajabadia/styles` antes de subir cambios a la rama principal de GitHub (`main`) para que los satélites en Vercel incorporen de forma inmediata los CSS y componentes transpilados.

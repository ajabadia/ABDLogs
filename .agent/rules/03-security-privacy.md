# Security & Privacy Standards

## ⚖️ Laws
1. **Server Actions as Public Endpoints**: Cada `"use server"` debe validar la sesión del usuario (Auth) y los permisos (Tenant).
2. **PII Protection**: Prohibido persistir datos sensibles (email, teléfono) sin cifrado o necesidad clara.
3. **Input Validation**: Todo input debe ser validado con esquemas de Zod antes de procesarlo.
4. **Rate Limiting**: Implementar protección contra fuerza bruta en endpoints sensibles.

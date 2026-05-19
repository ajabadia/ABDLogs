# Core Code Standards (Next.js 16 + React 19)

## 🛠️ Stack
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **DB**: MongoDB Atlas (Mongoose)
- **Language**: TypeScript Strict

## ⚖️ Laws
1. **Guerra al Waterfall**: Usa `Promise.all()` para fetches independientes.
2. **Zero Barrel Imports**: Importa directamente del archivo fuente.
3. **Security First**: Valida sesión e inputs dentro de cada Server Action (`"use server"`).
4. **Multitenant Isolation**: Cada query a MongoDB **OBLIGATORIO** incluir `tenantId`.
5. **Fire Rule: Max 150 Lines**: Los archivos deben ser pequeños y especializados. Si un archivo supera las 150 líneas, debe ser refactorizado.
6. **Fire Rule: DRY Philosophy**: Prohibida la duplicación de lógica. Usa hooks, utilities y services compartidos.
7. **Clean Structure**: Todo el código fuente en `web/src/`.
8. **Types over Interfaces**: Usa `type` para definiciones de datos de BD.

## 📁 Structure
```
web/src/
  app/          # Next.js App Router
  components/   # React Components
  lib/          # Utilities and DB Config
  models/       # Mongoose/Zod Models
  services/     # Business Logic
```

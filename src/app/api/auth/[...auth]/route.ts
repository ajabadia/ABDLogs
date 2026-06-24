/**
 * @purpose Gestiona rutas de autenticación dinámicamente para sesiones de SSO, salida y llamadas federadas.
 * @purpose_en Manages authentication routes dynamically for SSO sessions, logout, and federated callbacks.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:1h1j3g5
 * @lastUpdated 2026-06-23T23:05:57.550Z
 */

import { createAuthRouteHandler } from '@ajabadia/satellite-sdk';

/**
 * 🛰️ Catch-All SSO Auth Route Handler
 * Manages /api/auth/session, /api/auth/logout, and /api/auth/federated/callback dynamically.
 */
const handler = createAuthRouteHandler({
  appId: process.env.NEXT_PUBLIC_APP_ID as string,
  clientId: process.env.AUTH_CLIENT_ID as string,
  clientSecret: process.env.AUTH_CLIENT_SECRET || '',
  jwtSecret: process.env.AUTH_JWT_SECRET!,
});


export async function GET(request: Request) {
  return handler(request as Parameters<typeof handler>[0]);
}

export async function POST(request: Request) {
  return handler(request as Parameters<typeof handler>[0]);
}

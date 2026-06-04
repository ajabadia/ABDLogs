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

export async function GET(request: any, context: any) {
  return handler(request);
}

export async function POST(request: any, context: any) {
  return handler(request);
}

import { createAuthRouteHandler } from '@abd/satellite-sdk';

/**
 * 🛰️ Catch-All SSO Auth Route Handler
 * Manages /api/auth/session, /api/auth/logout, and /api/auth/federated/callback dynamically.
 */
const handler = createAuthRouteHandler({
  appId: process.env.NEXT_PUBLIC_APP_ID || 'logs',
  clientId: process.env.AUTH_CLIENT_ID || 'abdlogs-industrial-client-id',
  clientSecret: process.env.AUTH_CLIENT_SECRET || '',
  jwtSecret: process.env.AUTH_JWT_SECRET || '',
});

export { handler as GET, handler as POST };

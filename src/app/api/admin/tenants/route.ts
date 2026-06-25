/**
 * @purpose Gestiona el solicitud GET para obtener una lista de inquilinos, aplicando límite de velocidad y control de acceso basado en roles.
 * @purpose_en Manages the GET request to retrieve a list of tenants, applying rate limiting and role-based access control.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:6,sig:1eu6g0r
 * @lastUpdated 2026-06-25T10:25:33.795Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { getGlobalModel } from '@ajabadia/satellite-sdk/db';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk/utils';
import { assertAccess } from '@/lib/abac';
import mongoose from 'mongoose';

export const revalidate = 0; // Evitar el cacheado estático de la API

const TenantSchema = new mongoose.Schema({ tenantId: String, name: String, active: Boolean }, { collection: 'tenants' });
const TenantModel = getGlobalModel('Tenant', TenantSchema, 'AUTH');

export async function GET(request: Request) {
  try {
    // 🚦 Rate limit: 20 tenant list requests per 60s
    const ip = rateLimitMongodb.getClientIpFromRequest(request);
    const allowed = await rateLimitMongodb.check(ip, 'api', 20, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

    // 🛡️ Verificar acceso con rol mínimo ADMIN
    const user = await ensureIndustrialAccess('ADMIN');
    await assertAccess({ userId: user.id || user.email || 'system', tenantId: user.tenantId, resource: 'admin/tenants', action: 'list' });
    
    // Solo SUPER_ADMIN puede ver todos los tenants
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rawTenants = await TenantModel.find().lean();
    const tenants = (rawTenants as unknown as { tenantId: string; name?: string; active?: boolean }[]).map((t) => ({
      tenantId: t.tenantId,
      name: t.name || t.tenantId,
      active: t.active !== false,
    }));

    return NextResponse.json(tenants);
  } catch (error: unknown) {
    console.error('[API_GET_TENANTS_ERROR]', error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

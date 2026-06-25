/**
 * @purpose Gestiona la solicitud PATCH para eliminar un registro específico de anomalía.
 * @purpose_en Handles the PATCH request to dismiss a specific anomaly record.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:5,sig:18uopp2
 * @lastUpdated 2026-06-25T10:25:49.799Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AnomalyEngine } from '@/services/tenant/anomaly-engine';
import { assertAccess } from '@/lib/abac';

export const revalidate = 0;

/**
 * 🔒 PATCH /api/admin/threats/[id]
 * Dismisses a specific anomaly record.
 * Body: { tenantId?: string }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    await assertAccess({ userId: user.id || user.email || 'system', tenantId: user.tenantId, resource: 'threats', action: 'dismiss' });
    await connectDB();

    const { id } = await params;

    let body: { tenantId?: string } = {};
    try { body = await request.json(); } catch { /* optional */ }

    const tenantId = (user.role === 'SUPER_ADMIN' && body.tenantId)
      ? body.tenantId
      : (user.tenantId ?? 'SYSTEM');

    const ok = await AnomalyEngine.dismissAnomaly(id, tenantId);

    if (!ok) {
      return NextResponse.json({ error: 'ANOMALY_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, dismissedId: id });
  } catch (error: unknown) {
    console.error('[API_THREATS_DISMISS_ERROR]', error);
    const err = error as Error;
    const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Server Error' }, { status });
  }
}

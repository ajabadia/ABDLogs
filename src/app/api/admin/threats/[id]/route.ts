/**
 * @purpose Gestiona la solicitud PATCH para eliminar un registro específico de anomalía.
 * @purpose_en Handles the PATCH request to dismiss a specific anomaly record.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:3,sig:1nj6301
 * @lastUpdated 2026-06-23T23:05:53.028Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess, connectDB } from '@ajabadia/satellite-sdk';
import { AnomalyEngine } from '@/services/tenant/anomaly-engine';

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

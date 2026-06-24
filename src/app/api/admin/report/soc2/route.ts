/**
 * @purpose Gestiona y renderiza un informe ejecutivo de SOC2 estructurado para un inquilino.
 * @purpose_en Handles the generation and retrieval of a structured SOC2 executive report for a tenant.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:3,sig:1ph3tiu
 * @lastUpdated 2026-06-23T23:05:36.086Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess, connectDB } from '@ajabadia/satellite-sdk';
import { AnomalyEngine } from '@/services/tenant/anomaly-engine';

export const revalidate = 0;

/**
 * 🔒 GET /api/admin/report/soc2
 * Generates a structured SOC2 executive report for the tenant.
 * Query params: ?tenantId=&days=30
 */
export async function GET(request: Request) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    await connectDB();

    const { searchParams } = new URL(request.url);
    const overrideTenantId = searchParams.get('tenantId') ?? undefined;
    const days = Math.min(Number(searchParams.get('days') ?? 30), 365);

    const tenantId = (user.role === 'SUPER_ADMIN' && overrideTenantId)
      ? overrideTenantId
      : (user.tenantId ?? 'SYSTEM');

    const report = await AnomalyEngine.buildSoc2Report(tenantId, days);

    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: unknown) {
    console.error('[API_SOC2_REPORT_ERROR]', error);
    const err = error as Error;
    const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Server Error' }, { status });
  }
}

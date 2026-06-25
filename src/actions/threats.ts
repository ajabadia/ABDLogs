/**
 * @purpose Gestiona y recupera amenazas de anomalía para los inquilinos utilizando el AnomalyEngine, maneja autenticación del usuario y gestión de errores.
 * @purpose_en Manages and retrieves anomaly threats for tenants using the AnomalyEngine, handling user authentication and error management.
 * @refactorable true (contains multiple distinct actions)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:8,imports:3,sig:19sr3wc
 * @lastUpdated 2026-06-25T10:24:00.781Z
 */

'use server';

import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { AnomalyEngine } from '@/services/tenant/anomaly-engine';
import type { IAnomalyRecord } from '@/models/AnomalyRecord';

// ─── scanThreatsAction ─────────────────────────────────────────────────────────

export interface ScanThreatsResult {
  ok: boolean;
  created: number;
  anomalies: IAnomalyRecord[];
  error?: string;
}

/**
 * Triggers a full anomaly scan for the calling user's tenant.
 * Super admins may pass an explicit tenantId to scan on behalf of another tenant.
 */
export async function scanThreatsAction(overrideTenantId?: string): Promise<ScanThreatsResult> {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    const tenantId = (user.role === 'SUPER_ADMIN' && overrideTenantId)
      ? overrideTenantId
      : (user.tenantId ?? 'SYSTEM');

    const anomalies = await AnomalyEngine.runFullScan(tenantId);
    return { ok: true, created: anomalies.length, anomalies };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, created: 0, anomalies: [], error: message };
  }
}

// ─── getThreatsAction ─────────────────────────────────────────────────────────

export interface GetThreatsResult {
  ok: boolean;
  anomalies: IAnomalyRecord[];
  error?: string;
}

export async function getThreatsAction(
  overrideTenantId?: string,
  status: 'OPEN' | 'DISMISSED' | 'RESOLVED' | 'ALL' = 'OPEN'
): Promise<GetThreatsResult> {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    const tenantId = (user.role === 'SUPER_ADMIN' && overrideTenantId)
      ? overrideTenantId
      : (user.tenantId ?? 'SYSTEM');

    const anomalies = await AnomalyEngine.getAnomalies(tenantId, status);
    return { ok: true, anomalies };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, anomalies: [], error: message };
  }
}

// ─── dismissThreatAction ───────────────────────────────────────────────────────

export interface DismissThreatResult {
  ok: boolean;
  error?: string;
}

export async function dismissThreatAction(
  anomalyId: string,
  overrideTenantId?: string
): Promise<DismissThreatResult> {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    const tenantId = (user.role === 'SUPER_ADMIN' && overrideTenantId)
      ? overrideTenantId
      : (user.tenantId ?? 'SYSTEM');

    const dismissed = await AnomalyEngine.dismissAnomaly(anomalyId, tenantId);
    if (!dismissed) return { ok: false, error: 'Anomaly not found or already dismissed.' };
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message };
  }
}

// ─── getSoc2ReportAction ───────────────────────────────────────────────────────

export interface Soc2ReportResult {
  ok: boolean;
  report?: Record<string, unknown>;
  error?: string;
}

export async function getSoc2ReportAction(
  overrideTenantId?: string,
  days = 30
): Promise<Soc2ReportResult> {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    const tenantId = (user.role === 'SUPER_ADMIN' && overrideTenantId)
      ? overrideTenantId
      : (user.tenantId ?? 'SYSTEM');

    const report = await AnomalyEngine.buildSoc2Report(tenantId, days);
    return { ok: true, report };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message };
  }
}

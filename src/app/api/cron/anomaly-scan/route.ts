/**
 * @purpose Gestiona solicitudes GET para escaneos de anomalías, se conecta a la base de datos, recupera IDs únicos de tenantes, realiza escaneos completos de anomalías para cada tenante y devuelve los resultados.
 * @purpose_en Handles the GET request for anomaly scans, connects to the database, retrieves distinct tenant IDs, runs full anomaly scans for each tenant, and returns the results.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:4,sig:9e0svr
 * @lastUpdated 2026-06-26T06:17:30.256Z
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AuditLog } from '@/models/AuditLog';
import { AnomalyEngine } from '@/services/tenant/anomaly-engine';

export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    const tenants = await AuditLog.distinct('tenantId') as string[];
    const targetTenants = tenants.length > 0 ? tenants : ['SYSTEM'];

    const results: { tenantId: string; anomaliesFound: number; alertsCreated: number }[] = [];

    for (const tenantId of targetTenants) {
      const anomalies = await AnomalyEngine.runFullScan(tenantId, true);
      const highCritical = anomalies.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length;
      results.push({ tenantId, anomaliesFound: anomalies.length, alertsCreated: highCritical });
    }

    const totalAnomalies = results.reduce((s, r) => s + r.anomaliesFound, 0);
    const totalAlerts = results.reduce((s, r) => s + r.alertsCreated, 0);

    return NextResponse.json({
      success: true,
      scannedTenants: targetTenants.length,
      totalAnomalies,
      totalAlertsCreated: totalAlerts,
      details: results.filter(r => r.anomaliesFound > 0),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[CRON_ANOMALY_SCAN_ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

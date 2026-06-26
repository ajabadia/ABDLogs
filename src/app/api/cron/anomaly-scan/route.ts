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

/**
 * @purpose Gestiona el solicitud POST para eliminar registros de purga GDPR para un inquilino, eliminando documentos de varias colecciones.
 * @purpose_en Handles the POST request to purge GDPR logs for a specific tenant by deleting documents from multiple collections.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:2dg0g9
 * @lastUpdated 2026-06-25T10:26:07.516Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AuditLog } from '@/models/AuditLog';
import { AnomalyRecord } from '@/models/AnomalyRecord';
import { AlertThreshold } from '@/models/AlertThreshold';
import { AlertEvent } from '@/models/AlertEvent';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!secret || secret !== process.env.ABD_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    await connectDB();

    // Delete documents matching tenantId
    const resLogs = await AuditLog.deleteMany({ tenantId });
    const resAnom = await AnomalyRecord.deleteMany({ tenantId });
    const resThresh = await AlertThreshold.deleteMany({ tenantId });
    const resEvents = await AlertEvent.deleteMany({ tenantId });

    console.log(`[GDPR_PURGE_LOGS] Purged logs for tenant ${tenantId}:`, {
      logs: resLogs.deletedCount,
      anomalies: resAnom.deletedCount,
      thresholds: resThresh.deletedCount,
      events: resEvents.deletedCount,
    });

    return NextResponse.json({
      success: true,
      message: `Tenant logs purged successfully`,
      deletedCounts: {
        logs: resLogs.deletedCount,
        anomalies: resAnom.deletedCount,
        thresholds: resThresh.deletedCount,
        events: resEvents.deletedCount,
      }
    });
  } catch (error) {
    console.error('[GDPR_PURGE_LOGS_ERROR]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

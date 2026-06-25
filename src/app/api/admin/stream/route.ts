/**
 * @purpose Gestiona eventos Server-Sent para streaming de registro auditivo en tiempo real y evaluación de alertas.
 * @purpose_en Manages Server-Sent Events for real-time audit log streaming and alert evaluation.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:5,sig:1e6p7bb
 * @lastUpdated 2026-06-25T10:25:13.714Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AuditLog, IAuditLog } from '@/models/AuditLog';
import { AlertService } from '@/services/tenant/alert-service';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

/**
 * 🔴 SSE Stream: Hot Log Streaming + Alert Evaluation
 * 
 * Server-Sent Events endpoint that streams new audit logs and alerts in real-time.
 * Falls back to timestamp-based polling when MongoDB change streams are unavailable.
 */
export async function GET(request: Request) {
  try {
    // 1. Authenticate — must be admin
    const user = await ensureIndustrialAccess('ADMIN');
    const { searchParams } = new URL(request.url);
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const tenantIdParam = searchParams.get('tenantId');
    const tenantId = isSuperAdmin && tenantIdParam ? tenantIdParam : user.tenantId;

    await connectDB();

    // 2. Get the latest log timestamp to stream from
    const latestLog = await AuditLog.findOne({ tenantId })
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean();
    let lastTimestamp = latestLog?.createdAt
      ? new Date(latestLog.createdAt).getTime()
      : Date.now();

    // 3. Track connected state
    let isConnected = true;

    // 4. Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connected event
        const connectedEvent = `event: connected\ndata: ${JSON.stringify({ tenantId, status: 'streaming' })}\n\n`;
        controller.enqueue(new TextEncoder().encode(connectedEvent));

        // Polling interval: check for new logs every 2 seconds
        const pollingInterval = setInterval(async () => {
          if (!isConnected) {
            clearInterval(pollingInterval);
            return;
          }

          try {
            const newLogs = await AuditLog.find({
              tenantId,
              createdAt: { $gt: new Date(lastTimestamp) },
            })
              .sort({ createdAt: 1 })
              .limit(50)
              .lean();

            if (newLogs.length > 0) {
              for (const log of newLogs) {
                // Evaluate alert thresholds for this log
                const alerts = await AlertService.evaluateLog(log as unknown as IAuditLog);

                // Send log event
                const logId = (log as unknown as { _id: { toString(): string } })._id?.toString();
                const logPayload = {
                  ...log,
                  _id: logId || 'unknown',
                };
                const logEvent = `event: log\ndata: ${JSON.stringify(logPayload)}\n\n`;
                controller.enqueue(new TextEncoder().encode(logEvent));

                // Send alert events if triggered
                for (const alert of alerts) {
                  const alertPayload = {
                    ...alert,
                    _id: alert._id?.toString?.() || alert._id,
                  };
                  const alertEvent = `event: alert\ndata: ${JSON.stringify(alertPayload)}\n\n`;
                  controller.enqueue(new TextEncoder().encode(alertEvent));
                }

                // Update timestamp
                const logTime = new Date(log.createdAt).getTime();
                if (logTime > lastTimestamp) {
                  lastTimestamp = logTime;
                }
              }
            }

            // Send heartbeat every 10s to keep connection alive
            controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
          } catch (err) {
            console.error('[SSE_STREAM_ERROR]', err);
            try {
              controller.enqueue(
                new TextEncoder().encode(`event: error\ndata: ${JSON.stringify({ error: 'Stream error, reconnecting...' })}\n\n`)
              );
            } catch {
              // Stream may be closed, do nothing
            }
          }
        }, 2000);

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          isConnected = false;
          clearInterval(pollingInterval);
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: unknown) {
    console.error('[SSE_AUTH_ERROR]', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Unauthorized' },
      { status: err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500 }
    );
  }
}

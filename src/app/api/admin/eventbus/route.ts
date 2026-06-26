/**
 * @purpose Gestiona solicitudes HTTP GET para recuperar datos del bus de eventos, incluyendo información de flujo y recientes eventos, con control de acceso basado en roles.
 * @purpose_en Handles HTTP GET requests to retrieve event bus data, including stream information and recent events, with role-based access control.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:3,sig:e2tjht
 * @lastUpdated 2026-06-26T06:17:24.212Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { getAllStreamInfo, getStreamRecentEvents, SystemEventType } from '@ajabadia/satellite-sdk/event-bus';

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const user = await ensureIndustrialAccess();
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail') === 'true';

    const streams = await getAllStreamInfo();

    if (!detail) {
      const totalEvents = streams.reduce((sum, s) => sum + s.length, 0);
      return NextResponse.json({
        eventTypes: Object.values(SystemEventType).length,
        activeStreams: streams.filter(s => s.length > 0).length,
        totalEvents,
        streams,
      });
    }

    const streamDetails = await Promise.all(
      streams.filter(s => s.length > 0).map(async (s) => {
        const events = await getStreamRecentEvents(s.eventType, 10);
        return { ...s, events };
      })
    );

    const totalEvents = streams.reduce((sum, s) => sum + s.length, 0);

    return NextResponse.json({
      eventTypes: Object.values(SystemEventType).length,
      activeStreams: streamDetails.length,
      totalEvents,
      streams,
      streamDetails,
    });
  } catch (error: unknown) {
    const err = error as Error;
    const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status });
  }
}

/**
 * @purpose Gestiona endpoints de API para listar y gestionar alertas, incluyendo recuperar alertas activas o historia de alertas y reconocer o resolver alertas.
 * @purpose_en Manages API endpoints for listing and managing alerts, including retrieving active alerts or alert history, and acknowledging or resolving alerts.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:4,sig:1ah0k5p
 * @lastUpdated 2026-06-25T10:24:19.852Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk/utils';
import { AlertService } from '@/services/tenant/alert-service';

export const revalidate = 0;

/**
 * GET /api/admin/alerts/events
 * List active alerts or alert history for a tenant.
 * Query param: ?scope=active (default) | history
 */
export async function GET(request: Request) {
  try {
    const ip = rateLimitMongodb.getClientIpFromRequest(request);
    const allowed = await rateLimitMongodb.check(ip, 'api', 30, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

    const user = await ensureIndustrialAccess('ADMIN');
    const { searchParams } = new URL(request.url);
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const tenantIdParam = searchParams.get('tenantId');
    const tenantId = isSuperAdmin && tenantIdParam ? tenantIdParam : user.tenantId;
    const scope = searchParams.get('scope') || 'active';

    const alerts = scope === 'history'
      ? await AlertService.getAlertHistory(tenantId)
      : await AlertService.getActiveAlerts(tenantId);

    return NextResponse.json(alerts);
  } catch (error: unknown) {
    console.error('[API_GET_ALERTS_ERROR]', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message },
      { status: err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500 }
    );
  }
}

/**
 * PATCH /api/admin/alerts/events
 * Acknowledge or resolve an alert.
 * Body: { alertId: string, action: 'acknowledge' | 'resolve' }
 */
export async function PATCH(request: Request) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    const { searchParams } = new URL(request.url);
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const tenantIdParam = searchParams.get('tenantId');
    const tenantId = isSuperAdmin && tenantIdParam ? tenantIdParam : user.tenantId;

    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId || !action) {
      return NextResponse.json({ error: 'MISSING_ALERT_ID_OR_ACTION' }, { status: 400 });
    }

    let success = false;
    if (action === 'acknowledge') {
      success = await AlertService.acknowledgeAlert(alertId, tenantId, user.id || 'unknown');
    } else if (action === 'resolve') {
      success = await AlertService.resolveAlert(alertId, tenantId);
    } else {
      return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json({ error: 'ALERT_NOT_FOUND_OR_ACTION_FAILED' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[API_PATCH_ALERT_ERROR]', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message },
      { status: err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500 }
    );
  }
}

/**
 * @purpose Gestiona rutas API para manejar umbral de alertas, incluyendo listar, crear, actualizar y eliminar umbrales.
 * @purpose_en Manages API routes for handling alert thresholds, including listing, creating, updating, and deleting thresholds.
 * @refactorable true (contains multiple endpoints and business logic)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:4,imports:5,sig:lhfq6l
 * @lastUpdated 2026-06-25T10:24:29.358Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk/utils';
import { AlertService } from '@/services/tenant/alert-service';
import { thresholdCache } from '@/services/tenant/threshold-cache';

export const revalidate = 0;

/**
 * GET /api/admin/alerts/thresholds
 * List all alert thresholds for the active tenant.
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

    const thresholds = await AlertService.getThresholds(tenantId);
    return NextResponse.json(thresholds);
  } catch (error: unknown) {
    console.error('[API_GET_THRESHOLDS_ERROR]', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message },
      { status: err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/alerts/thresholds
 * Create or update an alert threshold.
 */
export async function POST(request: Request) {
  try {
    const ip = rateLimitMongodb.getClientIpFromRequest(request);
    const allowed = await rateLimitMongodb.check(ip, 'api', 20, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

    const user = await ensureIndustrialAccess('ADMIN');
    const { searchParams } = new URL(request.url);
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const tenantIdParam = searchParams.get('tenantId');
    const tenantId = isSuperAdmin && tenantIdParam ? tenantIdParam : user.tenantId;

    const body = await request.json();
    const threshold = await AlertService.upsertThreshold(tenantId, { ...body, tenantId });

    if (!threshold) {
      return NextResponse.json({ error: 'FAILED_TO_SAVE_THRESHOLD' }, { status: 500 });
    }

    // Invalidate cache so next log evaluation picks up the change
    thresholdCache.invalidate(tenantId);

    return NextResponse.json(threshold, { status: 201 });
  } catch (error: unknown) {
    console.error('[API_POST_THRESHOLD_ERROR]', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message },
      { status: err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/alerts/thresholds
 * Delete an alert threshold by ID.
 */
export async function DELETE(request: Request) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    const { searchParams } = new URL(request.url);
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const tenantIdParam = searchParams.get('tenantId');
    const tenantId = isSuperAdmin && tenantIdParam ? tenantIdParam : user.tenantId;
    const thresholdId = searchParams.get('id');

    if (!thresholdId) {
      return NextResponse.json({ error: 'MISSING_THRESHOLD_ID' }, { status: 400 });
    }

    const deleted = await AlertService.deleteThreshold(thresholdId, tenantId);
    if (!deleted) {
      return NextResponse.json({ error: 'THRESHOLD_NOT_FOUND' }, { status: 404 });
    }

    // Invalidate cache so next log evaluation picks up the deletion
    thresholdCache.invalidate(tenantId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[API_DELETE_THRESHOLD_ERROR]', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message },
      { status: err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500 }
    );
  }
}

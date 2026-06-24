/**
 * @purpose Gestiona solicitudes GET para permisos de grupo.
 * @purpose_en Handles GET requests for group permissions.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:apb8u9
 * @lastUpdated 2026-06-22T06:29:25.680Z
 */

import { GET as getHandler } from "@ajabadia/ecosystem-widgets/api/groups";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return getHandler(request as unknown as Parameters<typeof getHandler>[0]);
}

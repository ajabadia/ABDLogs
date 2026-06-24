/**
 * @purpose Gestiona solicitudes GET para datos de espacios.
 * @purpose_en Handles GET requests for spaces data.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:apb8u9
 * @lastUpdated 2026-06-22T06:29:31.570Z
 */

import { GET as getHandler } from "@ajabadia/ecosystem-widgets/api/spaces";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return getHandler(request as unknown as Parameters<typeof getHandler>[0]);
}

/**
 * @purpose Gestiona una solicitud de verificación de salud pre-vuelo para el servicio microservicio ABDLogs, retornando información básica de conectividad y disponibilidad.
 * @purpose_en Handles a pre-flight health check request for the ABDLogs microservice, returning basic connectivity and uptime information.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:fnfjze
 * @lastUpdated 2026-06-23T23:06:03.327Z
 */

import { NextResponse } from 'next/server';

/**
 * 🩺 Pre-flight Health Check Endpoint — §12.C.1
 *
 * Ultra-lightweight connectivity probe for ABDLogs microservice.
 * No DB access, no auth required — pure heartbeat.
 * Used by satellite services (ABDQuiz, ABDAuth, etc.) to verify
 * logging pipeline availability before sending critical audit events.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'ABDLogs',
    uptime: process.uptime(),
  });
}

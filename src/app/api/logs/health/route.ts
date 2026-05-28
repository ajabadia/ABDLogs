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

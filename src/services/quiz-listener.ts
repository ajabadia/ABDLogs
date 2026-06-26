/**
 * @purpose Gestiona eventos de intento de quiz registrando su inicio y finalización, utilizando un consumidor de eventos desde la biblioteca Satellite SDK.
 * @purpose_en Manages quiz attempt events by logging their start and completion, using an event consumer from the Satellite SDK.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:5yk4wm
 * @lastUpdated 2026-06-26T06:17:49.703Z
 */

'use server';

import { createConsumer, SystemEventType } from '@ajabadia/satellite-sdk/event-bus';
import { AuditService } from '@/services/tenant/audit-service';

let lastProcessed = 0;
const DEBOUNCE_MS = 2000;

const consumer = createConsumer({ source: 'abdlogs', pollIntervalMs: 30000 });

consumer.on(SystemEventType.QUIZ_ATTEMPT_STARTED, async (event) => {
  const { attemptId, tenantId, userId, examConfigId } = event.data as {
    attemptId: string; tenantId: string; userId: string; examConfigId: string;
  };
  await AuditService.logEvent({
    tenantId,
    action: 'QUIZ_ATTEMPT_STARTED',
    entityType: 'EXAM',
    entityId: attemptId,
    userId,
    userEmail: userId,
    changedFields: { examConfigId },
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[QUIZ_LISTENER] Logged ATTEMPT_STARTED', { attemptId, tenantId });
  }
});

consumer.on(SystemEventType.QUIZ_ATTEMPT_COMPLETED, async (event) => {
  const { attemptId, tenantId, userId } = event.data as {
    attemptId: string; tenantId: string; userId: string;
  };
  await AuditService.logEvent({
    tenantId,
    action: 'QUIZ_ATTEMPT_COMPLETED',
    entityType: 'EXAM',
    entityId: attemptId,
    userId,
    userEmail: userId,
    changedFields: {},
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[QUIZ_LISTENER] Logged ATTEMPT_COMPLETED', { attemptId, tenantId });
  }
});

export async function processQuizEvents(): Promise<void> {
  const now = Date.now();
  if (now - lastProcessed < DEBOUNCE_MS) return;
  lastProcessed = now;
  await consumer.processPending();
}

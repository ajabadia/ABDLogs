'use client';

/**
 * @purpose Gestiona la integración de eventos de quiz y escaneo de anomalías.
 * @purpose_en Manages the integration of quiz events and triggers anomaly scans.
 * @refactorable false
 * @classification Custom Hook
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:smr3ky
 * @lastUpdated 2026-06-26T06:17:45.702Z
 */

import { useEffect, useRef } from 'react';
import { processQuizEvents } from '@/services/quiz-listener';

const SCAN_INTERVAL_MS = 5 * 60 * 1000;

export function EventBusBridge() {
  const scanRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    processQuizEvents();
    triggerAnomalyScan();

    const onVisible = () => {
      processQuizEvents();
      triggerAnomalyScan();
    };
    document.addEventListener('visibilitychange', onVisible);

    scanRef.current = setInterval(triggerAnomalyScan, SCAN_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      if (scanRef.current) clearInterval(scanRef.current);
    };
  }, []);

  return null;
}

function triggerAnomalyScan() {
  fetch('/api/cron/anomaly-scan')
    .then(res => {
      if (!res.ok) console.warn('[SCAN] Anomaly scan returned', res.status);
    })
    .catch(err => console.warn('[SCAN] Anomaly scan failed', err));
}

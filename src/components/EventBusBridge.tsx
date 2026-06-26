'use client';

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

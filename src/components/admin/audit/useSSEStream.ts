'use client';

/**
 * @purpose Gestiona un flujo de Server-Sent Events (SSE) para datos de registro y alertas en tiempo real, maneja conexiones, desconexiones y intentos de reconexión con exponencial backoff.
 * @purpose_en Manages a Server-Sent Events (SSE) stream for real-time log and alert data, handling connections, disconnections, and reconnection attempts with exponential backoff.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Custom Hook
 * @complexity Medium
 * @fingerprint exports:2,imports:1,sig:u9y2w2
 * @lastUpdated 2026-06-23T23:06:21.479Z
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface SSEStreamEvent {
  type: 'log' | 'alert' | 'connected' | 'error';
  data: unknown;
}

interface UseSSEStreamOptions {
  tenantId: string;
  enabled?: boolean;
  onLog?: (log: unknown) => void;
  onAlert?: (alert: unknown) => void;
  onError?: (error: string) => void;
}

interface UseSSEStreamReturn {
  isConnected: boolean;
  lastEvent: SSEStreamEvent | null;
  reconnect: () => void;
}

/**
 * useSSEStream — React hook that connects to the SSE hot log stream endpoint.
 * Automatically reconnects on disconnect with exponential backoff.
 */
export function useSSEStream({
  tenantId,
  enabled = true,
  onLog,
  onAlert,
  onError,
}: UseSSEStreamOptions): UseSSEStreamReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEStreamEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const maxRetryDelay = 30000; // 30s max backoff

  // Use a ref for the connect function to avoid forward-reference lint errors
  const connectRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !tenantId) return;

    cleanup();

    const url = `/api/admin/stream?tenantId=${encodeURIComponent(tenantId)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setIsConnected(true);
      retryCountRef.current = 0;
      const event: SSEStreamEvent = { type: 'connected', data: {} };
      setLastEvent(event);
    });

    es.addEventListener('log', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as unknown;
        const sseEvent: SSEStreamEvent = { type: 'log', data };
        setLastEvent(sseEvent);
        onLog?.(data);
      } catch { /* skip malformed */ }
    });

    es.addEventListener('alert', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as unknown;
        const sseEvent: SSEStreamEvent = { type: 'alert', data };
        setLastEvent(sseEvent);
        onAlert?.(data);
      } catch { /* skip malformed */ }
    });

    es.addEventListener('error', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>;
        const errorMsg = (data?.error as string) || 'Unknown stream error';
        onError?.(errorMsg);
      } catch { /* skip */ }
    });

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff — use ref to avoid forward-reference lint error
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), maxRetryDelay);
      retryCountRef.current++;
      onError?.(`Stream disconnected. Reconnecting in ${Math.round(delay / 1000)}s...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        connectRef.current?.();
      }, delay);
    };
  }, [tenantId, enabled, onLog, onAlert, onError, cleanup]);

  // Keep ref in sync with latest connect function
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  return { isConnected, lastEvent, reconnect };
}

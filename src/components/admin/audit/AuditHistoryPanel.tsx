'use client';

/**
 * @purpose Renderiza un panel que muestra registros de auditoría con filtrado y actualizaciones en tiempo real.
 * @purpose_en Renders a panel displaying audit logs with filtering and live updates.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:10,sig:qtfzof
 * @lastUpdated 2026-06-22T06:31:41.765Z
 */

import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Activity, ShieldAlert, FileText, Settings, Wifi, WifiOff } from 'lucide-react';
import type { AuditLog } from './types';
import { TelemetryControlBar } from './TelemetryControlBar';
import { FilterChip } from './FilterChip';
import { AuditLogRow } from './AuditLogRow';
import { useSSEStream } from './useSSEStream';
import { AlertBanner, type AlertEvent as AlertEventType } from './AlertBanner';

interface AuditHistoryPanelProps { tenantId: string; }

const NEW_ROW_FLASH_DURATION_MS = 2500;

export function AuditHistoryPanel({ tenantId }: AuditHistoryPanelProps) {
  const t = useTranslations('admin');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLive, setIsLive] = useState(true);
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [alerts, setAlerts] = useState<AlertEventType[]>([]);

  const knownIdsRef = useRef<Set<string>>(new Set());

  // 🔴 SSE Stream connection
  const { isConnected } = useSSEStream({
    tenantId,
    enabled: isLive,
    onLog: (data: unknown) => {
      const log = data as AuditLog;
      if (!log._id) return;

      // Add to logs
      setLogs(prev => {
        // Avoid duplicates
        if (knownIdsRef.current.has(log._id!)) return prev;
        knownIdsRef.current.add(log._id!);
        const newLogs = [log, ...prev].slice(0, 100);
        return newLogs;
      });

      // Flash new row indicator
      setNewLogIds(prev => new Set([...prev, log._id!]));
      setTimeout(() => {
        setNewLogIds(prev => {
          const next = new Set(prev);
          next.delete(log._id!);
          return next;
        });
      }, NEW_ROW_FLASH_DURATION_MS);

      setLastFetched(new Date());
    },
    onAlert: (data: unknown) => {
      const alert = data as AlertEventType;
      setAlerts(prev => {
        // Avoid duplicates
        if (prev.some(a => a._id === alert._id)) return prev;
        return [alert, ...prev].slice(0, 50);
      });
    },
    onError: (error: string) => {
      console.error('[SSE_ERROR]', error);
    },
  });

  // Initial fetch via REST (fills the existing list)
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/audit?tenantId=${tenantId}&limit=50`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data: AuditLog[] = await res.json();

      knownIdsRef.current = new Set(data.map(l => l._id).filter(Boolean) as string[]);
      setLogs(data);
      setLastFetched(new Date());
    } catch (err) {
      console.error(err);
      toast.error(t('audit_error_load', { defaultMessage: 'Error al conectar con el servidor.' }));
    } finally {
      setLoading(false);
    }
  }, [tenantId, t]);

  useEffect(() => { startTransition(() => { fetchLogs(); }); }, [fetchLogs]);

  // Also fetch active alerts on mount
  useEffect(() => {
    fetch(`/api/admin/alerts/events?tenantId=${tenantId}&scope=active`)
      .then(res => res.ok ? res.json() : [])
      .then((data: AlertEventType[]) => setAlerts(data))
      .catch(() => {});
  }, [tenantId]);

  const toggleExpand = (id: string) => setExpandedLogId(prev => prev === id ? null : id);
  const toggleLive = () => setIsLive(prev => !prev);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/admin/alerts/events?tenantId=${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'acknowledge' }),
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a =>
          a._id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a
        ));
        toast.success(t('alert_acknowledged', { defaultMessage: 'Alerta reconocida' }));
      }
    } catch { toast.error(t('alert_error', { defaultMessage: 'Error al reconocer alerta' })); }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/admin/alerts/events?tenantId=${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'resolve' }),
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a._id !== alertId));
        toast.success(t('alert_resolved', { defaultMessage: 'Alerta resuelta' }));
      }
    } catch { toast.error(t('alert_error', { defaultMessage: 'Error al resolver alerta' })); }
  };

  const filteredLogs = logs.filter(log => filter === 'ALL' || log.appId?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="space-y-4">
      {/* Connection status indicator */}
      <div className="flex items-center justify-between">
        <TelemetryControlBar
          isLive={isLive}
          lastFetched={lastFetched}
          tenantId={tenantId}
          onToggleLive={toggleLive}
        />
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          isConnected ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
        }`}>
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              SSE Live
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Polling
            </>
          )}
        </div>
      </div>

      {/* 🔴 Active Alerts Banner */}
      {alerts.length > 0 && (
        <AlertBanner
          alerts={alerts}
          onAcknowledge={handleAcknowledgeAlert}
          onResolve={handleResolveAlert}
        />
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <FilterChip id="ALL" label={t('audit_filter_all', { defaultMessage: 'Todos los Logs' })} ariaLabel={t('filterAllLabel', { defaultMessage: 'Filtrar todos los logs' })} icon={Activity} activeFilter={filter} onSelect={setFilter} />
        <FilterChip id="AUTH" label="ABDAuth" ariaLabel={t('filterAuthLabel', { defaultMessage: 'Filtrar por logs de autenticación' })} icon={ShieldAlert} activeFilter={filter} onSelect={setFilter} />
        <FilterChip id="QUIZ" label="ABDQuiz" ariaLabel={t('filterQuizLabel', { defaultMessage: 'Filtrar por logs de evaluación' })} icon={FileText} activeFilter={filter} onSelect={setFilter} />
        <FilterChip id="GOBERNANZA" label="Gobernanza" ariaLabel={t('filterGobernanzaLabel', { defaultMessage: 'Filtrar por logs de gobernanza' })} icon={Settings} activeFilter={filter} onSelect={setFilter} />
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 w-full rounded-xl bg-secondary/10 border border-border animate-pulse" />)}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-secondary/5 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/60 mb-3 animate-pulse" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">{t('audit_no_activity', { defaultMessage: 'Sin Actividad Auditable' })}</h4>
          <p className="text-[10px] text-muted-foreground mt-1">{t('audit_no_activity_desc', { defaultMessage: 'No hay logs registrados para este filtro.' })}</p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {filteredLogs.map(log => (
            <AuditLogRow key={log._id} log={log} isExpanded={expandedLogId === log._id} isNew={log._id ? newLogIds.has(log._id) : false} onToggle={toggleExpand} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

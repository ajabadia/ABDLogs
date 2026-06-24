'use client';

/**
 * @purpose Renderiza un panel que muestra eventos de alerta históricos para un inquilino dado, incluyendo filtrado y expansión de detalles.
 * @purpose_en Renders a panel displaying historical alert events for a given tenant, including filtering and expanding details.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1qr2efr
 * @lastUpdated 2026-06-22T06:31:24.392Z
 */

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  AlertTriangle, AlertCircle, Info, History, RotateCcw, Eye, CheckCircle2,
} from 'lucide-react';

interface AlertEvent {
  _id: string;
  thresholdName: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  message: string;
  appId?: string;
  matchCount: number;
  windowMinutes: number;
  createdAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

interface AlertHistoryPanelProps {
  tenantId: string;
}

const severityIcon = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return AlertCircle;
    case 'WARNING': return AlertTriangle;
    default: return Info;
  }
};

const statusStyles = {
  ACTIVE: 'text-red-400 bg-red-500/10 border-red-500/20',
  ACKNOWLEDGED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  RESOLVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export function AlertHistoryPanel({ tenantId }: AlertHistoryPanelProps) {
  const t = useTranslations('admin');
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/alerts/events?tenantId=${tenantId}&scope=history`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    startTransition(() => { void fetchAlerts(); });
  }, [fetchAlerts, startTransition]);

  const handleAcknowledge = async (alertId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/alerts/events?tenantId=${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'acknowledge' }),
      });
      if (res.ok) {
        toast.success(t('alert_acknowledge_success'));
        fetchAlerts();
      } else {
        toast.error(t('alert_acknowledge_error'));
      }
    });
  };

  const handleResolve = async (alertId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/alerts/events?tenantId=${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'resolve' }),
      });
      if (res.ok) {
        toast.success(t('alert_resolve_success'));
        fetchAlerts();
      } else {
        toast.error(t('alert_resolve_error'));
      }
    });
  };

  const filteredAlerts = filter === 'ALL' ? alerts : alerts.filter(a => a.status === filter);

  return (
    <div className="p-5 border border-border bg-card/60 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {t('alert_history_title')}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {t('alert_history_desc')}
            </p>
          </div>
        </div>
        <button
          aria-label={t('alert_history_title')}
          onClick={fetchAlerts}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-border hover:bg-foreground/5 transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map(s => (
          <button
            key={s}
            aria-label={s === 'ALL' ? t('all') : s}
            onClick={() => setFilter(s)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              filter === s
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-foreground/5 border-border text-muted-foreground hover:border-primary/30'
            }`}
          >
            {s === 'ALL' ? t('all') : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 w-full rounded-lg bg-secondary/10 border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <History className="w-6 h-6 mx-auto mb-2 opacity-40" />
          <p className="text-xs">
            {t('no_alerts_history')}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredAlerts.map(alert => {
            const Icon = severityIcon(alert.severity);
            const isExpanded = expandedId === alert._id;

            return (
              <div
                key={alert._id}
                className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-background/50 hover:bg-foreground/5 transition-all cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : alert._id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'text-red-400' :
                      alert.severity === 'WARNING' ? 'text-amber-400' : 'text-blue-400'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{alert.thresholdName}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${statusStyles[alert.status]}`}>
                          {alert.status}
                        </span>
                        {alert.appId && (
                          <span className="text-[9px] font-mono text-muted-foreground bg-foreground/5 px-1 py-0.5 rounded">
                            {alert.appId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {alert.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert._id); }}
                          className="p-1 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          title={t('alert_acknowledge')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResolve(alert._id); }}
                          className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all cursor-pointer"
                          title={t('alert_resolve')}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-7 pl-4 border-l-2 border-border/40 space-y-1 pt-1">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                      <span className="text-muted-foreground">{t('alert_label_matches')}</span>
                      <span className="font-mono text-foreground">{t('alert_matches_in_window', { count: alert.matchCount, minutes: alert.windowMinutes })}</span>
                      <span className="text-muted-foreground">{t('alert_label_triggered')}</span>
                      <span className="font-mono text-foreground">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                      {alert.acknowledgedBy && (
                        <>
                          <span className="text-muted-foreground">{t('alert_label_acknowledged_by')}</span>
                          <span className="font-mono text-foreground">{alert.acknowledgedBy}</span>
                        </>
                      )}
                      {alert.resolvedAt && (
                        <>
                          <span className="text-muted-foreground">{t('alert_label_resolved_at')}</span>
                          <span className="font-mono text-foreground">
                            {new Date(alert.resolvedAt).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

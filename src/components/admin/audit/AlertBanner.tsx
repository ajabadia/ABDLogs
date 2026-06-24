'use client';

/**
 * @purpose Renderiza una notificacion emergente con detalles de severidad, estado y otros datos.
 * @purpose_en Renders a banner to display alert events with severity, status, and other details.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:3,sig:1xur2u3
 * @lastUpdated 2026-06-22T06:31:18.676Z
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle, AlertCircle, Info, X, CheckCircle2, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';

export interface AlertEvent {
  _id: string;
  tenantId: string;
  thresholdId: string;
  thresholdName: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  message: string;
  appId?: string;
  matchCount: number;
  windowMinutes: number;
  createdAt: string;
}

interface AlertBannerProps {
  alerts: AlertEvent[];
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

const severityConfig = {
  CRITICAL: {
    icon: AlertCircle,
    border: 'border-red-500/40',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300',
  },
  WARNING: {
    icon: AlertTriangle,
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  INFO: {
    icon: Info,
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
  },
};

export function AlertBanner({ alerts, onAcknowledge, onResolve }: AlertBannerProps) {
  const t = useTranslations('admin');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a._id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleAlerts.map(alert => {
        const config = severityConfig[alert.severity];
        const Icon = config.icon;
        const isExpanded = expandedId === alert._id;

        return (
          <div
            key={alert._id}
            className={`relative group flex flex-col gap-2 p-3 rounded-lg border ${config.border} ${config.bg} backdrop-blur-sm transition-all animate-in slide-in-from-top-2`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${config.text}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${config.badge}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">
                      {alert.thresholdName}
                    </span>
                    {alert.appId && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-foreground/5 px-1.5 py-0.5 rounded">
                        {alert.appId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {alert.status === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => onAcknowledge(alert._id)}
                      className="p-1.5 rounded-md bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      title={t('alert_acknowledge')}
                      aria-label={t('alert_acknowledge')}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onResolve(alert._id)}
                      className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                      title={t('alert_resolve')}
                      aria-label={t('alert_resolve')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : alert._id)}
                      className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground transition-all cursor-pointer"
                      aria-label={t('alert_expand_details')}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDismissedIds(prev => new Set(prev).add(alert._id))}
                  className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  aria-label={t('alert_dismiss')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="ml-6 pl-4 border-l-2 border-border/40 space-y-1.5 pt-1">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  <span className="text-muted-foreground">{t('alert_label_threshold')}</span>
                  <span className="font-mono text-foreground">{alert.thresholdName}</span>
                  <span className="text-muted-foreground">{t('alert_label_matches')}</span>
                  <span className="font-mono text-foreground">{t('alert_matches_in_window', { count: alert.matchCount, minutes: alert.windowMinutes })}</span>
                  <span className="text-muted-foreground">{t('alert_label_status')}</span>
                  <span className={`font-mono ${alert.status === 'ACTIVE' ? 'text-red-400' : alert.status === 'ACKNOWLEDGED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {alert.status}
                  </span>
                  <span className="text-muted-foreground">{t('alert_label_triggered')}</span>
                  <span className="font-mono text-foreground">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                  {alert.appId && (
                    <>
                      <span className="text-muted-foreground">{t('alert_label_source')}</span>
                      <span className="font-mono text-foreground">{alert.appId}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

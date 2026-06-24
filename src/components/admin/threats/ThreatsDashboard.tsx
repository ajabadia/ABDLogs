'use client';

/**
 * @purpose Gestiona un panel de control para el manejo de amenazas con funciones para escanear, deshacerse y visualizar informes de SOC2.
 * @purpose_en Renders a dashboard for managing threats with functionalities to scan, dismiss, and view SOC2 reports.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:1k2odge
 * @lastUpdated 2026-06-23T23:06:27.059Z
 */

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle, Shield, ShieldOff, ScanSearch, CheckCircle2,
  Loader2, XCircle, Clock, Wifi, Trash2, FileDown, ChevronDown, ChevronUp,
  ActivitySquare
} from 'lucide-react';
import { toast } from 'sonner';
import { scanThreatsAction, getThreatsAction, dismissThreatAction, getSoc2ReportAction } from '@/actions/threats';
import type { IAnomalyRecord, AnomalyType, AnomalySeverity } from '@/models/AnomalyRecord';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThreatsDashboardProps {
  initialAnomalies: IAnomalyRecord[];
  tenantId: string;
}

// ─── Severity Config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<AnomalySeverity, { label: string; color: string; glow: string; dot: string }> = {
  CRITICAL: {
    label: 'CRÍTICO',
    color: 'text-red-400 border-red-500/40 bg-red-950/30',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
    dot: 'bg-red-500 animate-pulse',
  },
  HIGH: {
    label: 'ALTO',
    color: 'text-orange-400 border-orange-500/40 bg-orange-950/20',
    glow: '',
    dot: 'bg-orange-500',
  },
  MEDIUM: {
    label: 'MEDIO',
    color: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20',
    glow: '',
    dot: 'bg-yellow-500',
  },
  LOW: {
    label: 'BAJO',
    color: 'text-blue-400 border-blue-500/40 bg-blue-950/20',
    glow: '',
    dot: 'bg-blue-500',
  },
};

// ─── Type Config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AnomalyType, { label: string; icon: React.ReactNode }> = {
  BRUTE_FORCE: { label: 'Fuerza Bruta', icon: <ShieldOff className="w-3.5 h-3.5" /> },
  MASS_DELETION: { label: 'Borrado Masivo', icon: <Trash2 className="w-3.5 h-3.5" /> },
  OFF_HOURS: { label: 'Acceso Nocturno', icon: <Clock className="w-3.5 h-3.5" /> },
  NEW_IP: { label: 'IP Desconocida', icon: <Wifi className="w-3.5 h-3.5" /> },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date | string) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' });
}

// ─── SOC2 Report Panel ────────────────────────────────────────────────────────

/** Renders a dynamic width bar without JSX inline styles by using a ref. */
function ProgressBar({ pct }: { pct: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${pct}%`;
    }
  }, [pct]);
  return <div ref={barRef} className="h-full bg-primary rounded-full transition-all duration-500" />;
}


function Soc2Panel({ tenantId }: { tenantId: string }) {
  const t = useTranslations('admin');
  const [isPending, startTransition] = useTransition();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [open, setOpen] = useState(false);

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await getSoc2ReportAction(tenantId === 'SYSTEM' ? undefined : tenantId, 30);
      if (result.ok && result.report) {
        setReport(result.report);
        setOpen(true);
        toast.success(t('threats_report_title'));
      } else {
        toast.error(result.error ?? t('network_error'));
      }
    });
  };

  const handleExport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soc2_report_${tenantId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const logsData = report?.logs as Record<string, unknown> | undefined;
  const threatsData = report?.threats as Record<string, unknown> | undefined;
  const byApp = logsData?.byApplication as { appId: string; count: number }[] | undefined;

  return (
    <div className="mt-8 border border-border/60 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 bg-card/40 hover:bg-card/70 transition-colors cursor-pointer"
        aria-label="Alternar panel de informe ejecutivo SOC2"
      >
        <div className="flex items-center gap-3">
          <ActivitySquare className="w-4 h-4 text-primary" />
          <span className="text-xs font-black uppercase tracking-wider text-foreground">
            Informe Ejecutivo SOC2
          </span>
          <span className="text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">
            {t('threats_report_period')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleGenerate(); }}
            disabled={isPending}
            aria-label="Generar informe ejecutivo SOC2"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
            {isPending ? t('threats_report_generating') : t('threats_report_generate')}
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && report && (
        <div className="p-6 bg-card/20 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Logs', value: String(logsData?.total ?? 0), color: 'text-primary' },
              { label: 'Amenazas Abiertas', value: String(threatsData?.open ?? 0), color: 'text-red-400' },
              { label: 'Amenazas Resueltas', value: String(threatsData?.resolved ?? 0), color: 'text-emerald-400' },
              { label: 'Total Anomalías', value: String(threatsData?.total ?? 0), color: 'text-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 border border-border/50 rounded-lg bg-background/30 text-center">
                <p className={`text-2xl font-black font-mono ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* By App */}
          {byApp && byApp.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Distribución por Satélite
              </p>
              <div className="space-y-2">
                {byApp.map(({ appId, count }) => {
                  const total = (logsData?.total as number) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={appId} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-24 truncate">{appId}</span>
                      <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
                        <ProgressBar pct={pct} />
                      </div>
                      <span className="text-xs font-mono text-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Certification + Export */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400 tracking-wider">
                {String(report.certification ?? '')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleExport}
              aria-label="Exportar informe SOC2 en formato JSON"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border border-border hover:border-primary/40 hover:text-primary transition-all cursor-pointer"
            >
              <FileDown className="w-3 h-3" />
              {t('threats_report_export')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ThreatsDashboard({ initialAnomalies, tenantId }: ThreatsDashboardProps) {
  const t = useTranslations('admin');
  const [isPending, startTransition] = useTransition();
  const [anomalies, setAnomalies] = useState<IAnomalyRecord[]>(initialAnomalies);
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'DISMISSED' | 'ALL'>('OPEN');
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const refreshAnomalies = useCallback((status: 'OPEN' | 'DISMISSED' | 'ALL') => {
    startTransition(async () => {
      const result = await getThreatsAction(
        tenantId === 'SYSTEM' ? undefined : tenantId,
        status
      );
      if (result.ok) setAnomalies(result.anomalies);
    });
  }, [tenantId]);

  const handleScan = () => {
    startTransition(async () => {
      const result = await scanThreatsAction(tenantId === 'SYSTEM' ? undefined : tenantId);
      if (result.ok) {
        if (result.created === 0) {
          toast.success('✅ Sin nuevas amenazas detectadas');
        } else {
          toast.warning(`⚠️ ${result.created} nueva(s) anomalía(s) detectada(s)`);
        }
        refreshAnomalies(statusFilter);
      } else {
        toast.error(result.error ?? 'Error al ejecutar el escaneo');
      }
    });
  };

  const handleDismiss = (id: string) => {
    setDismissingId(id);
    startTransition(async () => {
      const result = await dismissThreatAction(id, tenantId === 'SYSTEM' ? undefined : tenantId);
      setDismissingId(null);
      if (result.ok) {
        toast.success('Anomalía descartada');
        setAnomalies(prev => prev.filter(a => String(a._id) !== id));
      } else {
        toast.error(result.error ?? 'Error al descartar la anomalía');
      }
    });
  };

  const handleFilterChange = (newStatus: 'OPEN' | 'DISMISSED' | 'ALL') => {
    setStatusFilter(newStatus);
    refreshAnomalies(newStatus);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const openCount = initialAnomalies.filter(a => a.status === 'OPEN').length;
  const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {openCount > 0 ? (
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          ) : (
            <Shield className="w-5 h-5 text-emerald-400" />
          )}
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-foreground">
              {openCount > 0 ? `${openCount} Amenaza${openCount > 1 ? 's' : ''} Activa${openCount > 1 ? 's' : ''}` : 'Sin Amenazas Activas'}
            </p>
            {criticalCount > 0 && (
              <p className="text-[10px] text-red-400 font-mono">
                {criticalCount} crítica{criticalCount > 1 ? 's' : ''} — requiere atención inmediata
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden text-[10px] font-bold uppercase tracking-wider">
            {(['OPEN', 'DISMISSED', 'ALL'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => handleFilterChange(s)}
                aria-label={`Filtrar anomalías: ${s}`}
                className={`px-3 py-2 transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                }`}
              >
                {s === 'OPEN' ? t('threats_filter_open') : s === 'DISMISSED' ? t('threats_filter_dismissed') : t('threats_filter_all')}
              </button>
            ))}
          </div>

          {/* Scan Button */}
          <button
            type="button"
            onClick={handleScan}
            disabled={isPending}
            aria-label="Ejecutar escaneo de amenazas predictivas"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(var(--primary),0.25)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t('threats_scanning')}</>
            ) : (
              <><ScanSearch className="w-3.5 h-3.5" />{t('threats_scan_now')}</>
            )}
          </button>
        </div>
      </div>

      {/* Anomaly Table */}
      {anomalies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/50 rounded-xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4 opacity-60" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {t('threats_no_threats')}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {t('threats_no_threats_desc')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {anomalies.map((anomaly) => {
            const id = String(anomaly._id);
            const severityCfg = SEVERITY_CONFIG[anomaly.severity];
            const typeCfg = TYPE_CONFIG[anomaly.type];
            const isDismissing = dismissingId === id;

            return (
              <div
                key={id}
                className={`p-5 border rounded-xl transition-all ${severityCfg.color} ${severityCfg.glow}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: type + description */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${severityCfg.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-current/30">
                          {typeCfg.icon}
                          {typeCfg.label}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                          [{severityCfg.label}]
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground/90">
                        {anomaly.description}
                      </p>

                      {/* Metadata chips */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {anomaly.userId && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            👤 {anomaly.userId}
                          </span>
                        )}
                        {anomaly.ipAddress && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            🌐 {anomaly.ipAddress}
                          </span>
                        )}
                        {anomaly.appId && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            📡 {anomaly.appId}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground">
                          🕒 {formatDate(anomaly.detectedAt)}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          📊 {anomaly.count} ocurrencia{anomaly.count > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Dismiss button */}
                  {anomaly.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => handleDismiss(id)}
                      disabled={isDismissing || isPending}
                      aria-label={`Descartar anomalía de tipo ${typeCfg.label}`}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border border-current/30 opacity-70 hover:opacity-100 transition-all disabled:opacity-30 cursor-pointer"
                    >
                      {isDismissing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {t('threats_dismiss')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SOC2 Report Panel */}
      <Soc2Panel tenantId={tenantId} />
    </div>
  );
}

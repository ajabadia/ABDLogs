'use client';

/**
 * @purpose Renderiza una barra de control para configuraciones de telemetry en la sección de auditoria administrativa, incluyendo estado en vivo, última hora de actualización y botón de métricas.
 * @purpose_en Renders a control bar for telemetry settings in the admin audit section, including live status, last fetched time, and metrics button.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1r7njb5
 * @lastUpdated 2026-06-23T16:27:00.045Z
 */

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Wifi, WifiOff, Pause, Play, BarChart3 } from 'lucide-react';

interface TelemetryControlBarProps {
  isLive: boolean;
  lastFetched: Date | null;
  tenantId: string;
  onToggleLive: () => void;
}

export function TelemetryControlBar({ isLive, lastFetched, tenantId, onToggleLive }: TelemetryControlBarProps) {
  const t = useTranslations('admin');
  const locale = useLocale();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/50">
      <div className="flex items-center gap-2.5">
        <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border transition-all ${
          isLive
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
            : 'bg-zinc-700/20 border-zinc-600/30 text-zinc-500'
        }`}>
          {isLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Wifi className="w-3 h-3" />
              {t('audit_live_on', { defaultMessage: 'LIVE' })}
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              {t('audit_live_off', { defaultMessage: 'PAUSED' })}
            </>
          )}
        </div>
        {lastFetched && (
          <span className="font-mono text-[10px] text-muted-foreground">
            Sync: {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}/admin/dashboard?tenantId=${tenantId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer shadow-sm"
          title={t('audit_view_telemetry_title', { defaultMessage: 'Ver Telemetría Visual' })}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('audit_metrics_label', { defaultMessage: 'Métricas' })}</span>
        </Link>

        <button
          aria-label={isLive
            ? t('audit_live_pause', { defaultMessage: 'Pausar Stream' })
            : t('audit_live_resume', { defaultMessage: 'Reanudar Stream' })
          }
          onClick={onToggleLive}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            isLive
              ? 'bg-background border-border text-muted-foreground hover:border-amber-500/50 hover:text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
          }`}
        >
          {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isLive ? t('audit_live_pause', { defaultMessage: 'Pausar Stream' }) : t('audit_live_resume', { defaultMessage: 'Reanudar Stream' })}
        </button>
      </div>
    </div>
  );
}

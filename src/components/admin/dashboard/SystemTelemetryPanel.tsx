/**
 * @purpose Renderiza un panel que muestra información de sistema de telemetry para una consola administrativa, incluyendo ID del usuario, rol, ubicación y estado de seguridad.
 * @purpose_en Renders a panel displaying system telemetry information for an admin dashboard, including user ID, role, locale, and security status.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1uh5oxe
 * @lastUpdated 2026-06-22T06:32:28.607Z
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SystemTelemetryPanelProps {
  userId: string;
  userRole: string;
  locale: string;
}

export function SystemTelemetryPanel({
  userId,
  userRole,
  locale,
}: SystemTelemetryPanelProps) {
  const t = useTranslations('admin');

  return (
    <div className="group relative p-8 flex flex-col min-h-[300px] overflow-hidden rounded-none bg-card backdrop-blur-sm border border-border transition-all duration-500 hover:border-primary/40">
      {/* Marca de Agua Decorativa */}
      <ShieldCheck className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-foreground" size={96} aria-hidden="true" />
      
      <div className="z-10 flex flex-col h-full">
        {/* Bloque Narrativo Superior */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-foreground leading-none truncate">
              {t('securityTitle')}
            </h2>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" aria-label="System Secure" />
          </div>
        </div>
        
        {/* Bandeja de Metadatos (Telemetría de Sesión) */}
        <div className="flex-1 border-t border-border pt-6 flex flex-col gap-4 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/80">
          <div className="flex justify-between items-center gap-2">
            <span className="opacity-70">{t('activeAuthority')}</span>
            <span className="text-primary font-bold truncate max-w-[150px]" title={userId}>{userId}</span>
          </div>
          <div className="flex justify-between items-center border-t border-border/50 pt-3">
            <span className="opacity-70">{t('sessionRole')}</span>
            <span className="text-foreground font-bold">{userRole}</span>
          </div>
          <div className="flex justify-between items-center border-t border-border/50 pt-3">
            <span className="opacity-70">{t('localRegion')}</span>
            <span className="text-foreground font-bold">{locale.toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center border-t border-border/50 pt-3">
            <span className="opacity-70">{t('certification')}</span>
            <span className="text-emerald-500 font-black animate-pulse">{t('prodReady')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

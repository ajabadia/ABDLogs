'use client';

/**
 * @purpose Renderiza una fila para un registro de auditoría en la interfaz administrativa, mostrando detalles como tipo de entidad, acción y fechas.
 * @purpose_en Renders a row for an audit log entry in the admin interface, displaying details such as entity type, action, and timestamps.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:14dt3mu
 * @lastUpdated 2026-06-22T06:31:47.456Z
 */

import { Calendar, User, Eye, ChevronUp, Layers, ShieldAlert, Terminal, FileText, Settings, Activity } from 'lucide-react';
import type { AuditLog } from './types';
import { ActionBadge } from './ActionBadge';
import { AuditDeltaViewer } from './AuditDeltaViewer';

function getEntityIcon(entityType: AuditLog['entityType']) {
  switch (entityType) {
    case 'USER': return <User className="w-4 h-4 text-primary" />;
    case 'TENANT': return <Settings className="w-4 h-4 text-primary" />;
    case 'SSO': return <ShieldAlert className="w-4 h-4 text-primary" />;
    case 'EXAM': return <FileText className="w-4 h-4 text-primary" />;
    case 'CONFIG': return <Terminal className="w-4 h-4 text-primary" />;
    default: return <Layers className="w-4 h-4 text-primary" />;
  }
}

interface AuditLogRowProps {
  log: AuditLog;
  isExpanded: boolean;
  isNew: boolean;
  onToggle: (id: string) => void;
  t: (key: string, opts?: { defaultMessage?: string }) => string;
}

export function AuditLogRow({ log, isExpanded, isNew, onToggle, t }: AuditLogRowProps) {
  const logDate = log.createdAt ? new Date(log.createdAt) : null;
  const timeStr = logDate ? logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  const dateStr = logDate ? logDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-700 ${
        isNew
          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
          : isExpanded
          ? 'bg-secondary/15 border-primary/50 shadow-sm'
          : 'bg-card border-border hover:bg-secondary/10'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isNew && (
            <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-widest">
              NEW
            </span>
          )}
          <div className="p-2 rounded border border-border bg-background text-primary">
            {getEntityIcon(log.entityType)}
          </div>
          <div className="grid gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                {log.appId}
              </span>
              <ActionBadge action={log.action} />
              {log.entityId && (
                <span className="font-mono text-[10px] font-bold text-foreground/80 bg-background border border-border px-2 py-0.5 rounded">
                  ID: {log.entityId.slice(-6)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <User className="w-3.5 h-3.5 text-primary opacity-60" />
              <span className="font-medium text-foreground/75 truncate max-w-[200px]" title={log.userEmail}>
                {log.userEmail}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-border/25 pt-2.5 md:pt-0">
          <div className="flex flex-col text-left md:text-right font-mono text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 md:justify-end font-bold text-foreground/85">
              <Calendar className="w-3 h-3 text-primary opacity-70" />
              {dateStr}
            </span>
            <span className="mt-0.5 opacity-80">{timeStr}</span>
          </div>

          <button
            aria-label={t('audit_toggle_details', { defaultMessage: 'Expandir detalles del log' })}
            onClick={() => log._id && onToggle(log._id)}
            className="p-1.5 rounded border border-border bg-background hover:bg-secondary hover:text-foreground text-muted-foreground transition-all cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in fade-in duration-200">
          <AuditDeltaViewer log={log} />
        </div>
      )}
    </div>
  );
}

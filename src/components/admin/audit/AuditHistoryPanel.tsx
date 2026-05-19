'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { 
  Activity, 
  Calendar, 
  User, 
  Settings, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Eye,
  ShieldAlert,
  Terminal,
  FileText
} from 'lucide-react';
import { AuditLog } from './types';
import { ActionBadge } from './ActionBadge';
import { AuditDeltaViewer } from './AuditDeltaViewer';

interface AuditHistoryPanelProps {
  tenantId: string;
}

export function AuditHistoryPanel({ tenantId }: AuditHistoryPanelProps) {
  const t = useTranslations('admin');
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/audit?tenantId=${tenantId}&limit=100`);
        if (!res.ok) throw new Error('Failed to fetch logs');
        const data = await res.json();
        setLogs(data);
      } catch (err: unknown) {
        console.error(err);
        toast.error(t('audit_error_load', { defaultMessage: 'Error al conectar con el servidor.' }));
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [tenantId, t]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    return log.appId?.toLowerCase() === filter.toLowerCase();
  });

  const getEntityIcon = (entityType: AuditLog['entityType']) => {
    switch (entityType) {
      case 'USER':
        return <User className="w-4 h-4 text-primary" />;
      case 'TENANT':
        return <Settings className="w-4 h-4 text-primary" />;
      case 'SSO':
        return <ShieldAlert className="w-4 h-4 text-primary" />;
      case 'EXAM':
        return <FileText className="w-4 h-4 text-primary" />;
      case 'CONFIG':
        return <Terminal className="w-4 h-4 text-primary" />;
      default:
        return <Layers className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros Interactivos por Aplicación del Ecosistema */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button aria-label={t('filterAllLabel', { defaultMessage: 'Filtrar todos los logs' })}
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20'
          }`}
        >
          {t('audit_filter_all', { defaultMessage: 'Todos los Logs' })}
        </button>
        <button aria-label={t('filterAuthLabel', { defaultMessage: 'Filtrar por logs de autenticación' })}
          onClick={() => setFilter('AUTH')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'AUTH'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20'
          }`}
        >
          ABD Auth
        </button>
        <button aria-label={t('filterQuizLabel', { defaultMessage: 'Filtrar por logs de evaluación' })}
          onClick={() => setFilter('QUIZ')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'QUIZ'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20'
          }`}
        >
          ABD Quiz
        </button>
        <button aria-label={t('filterGobernanzaLabel', { defaultMessage: 'Filtrar por logs de gobernanza' })}
          onClick={() => setFilter('GOBERNANZA')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            filter === 'GOBERNANZA'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20'
          }`}
        >
          ABD Gobernanza
        </button>
      </div>

      {/* Cuerpo del Feed Cronológico */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 w-full rounded-xl bg-secondary/10 border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-secondary/5 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/60 mb-3 animate-pulse" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
            {t('audit_no_activity', { defaultMessage: 'Sin Actividad Auditable' })}
          </h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            {t('audit_no_activity_desc', { defaultMessage: 'No hay logs registrados para este filtro.' })}
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {filteredLogs.map(log => {
            const isExpanded = expandedLogId === log._id;
            const logDate = log.createdAt ? new Date(log.createdAt) : null;
            const timeStr = logDate ? logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
            const dateStr = logDate ? logDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '';

            return (
              <div
                key={log._id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isExpanded
                    ? 'bg-secondary/15 border-primary/50 shadow-sm'
                    : 'bg-card border-border hover:bg-secondary/10'
                }`}
              >
                {/* Cabecera del Item */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded border border-border bg-background text-primary">
                      {getEntityIcon(log.entityType)}
                    </div>
                    <div className="grid gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Indicador de Aplicación */}
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

                  {/* Telemetría y Controles */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-border/25 pt-2.5 md:pt-0">
                    <div className="flex flex-col text-left md:text-right font-mono text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1 md:justify-end font-bold text-foreground/85">
                        <Calendar className="w-3 h-3 text-primary opacity-70" />
                        {dateStr}
                      </span>
                      <span className="mt-0.5 opacity-80">{timeStr}</span>
                    </div>

                    <button aria-label={t('audit_toggle_details', { defaultMessage: 'Expandir detalles del log' })}
                      onClick={() => log._id && toggleExpand(log._id)}
                      className="p-1.5 rounded border border-border bg-background hover:bg-secondary hover:text-foreground text-muted-foreground transition-all cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Detalles y Delta Expandido */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in fade-in duration-200">
                    <AuditDeltaViewer log={log} />
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

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  FileText,
  Pause,
  Play,
  Wifi,
  WifiOff
} from 'lucide-react';
import { AuditLog } from './types';
import { ActionBadge } from './ActionBadge';
import { AuditDeltaViewer } from './AuditDeltaViewer';

interface AuditHistoryPanelProps {
  tenantId: string;
}

// ─── FilterChip — declared outside component to avoid 'component created during render' ───
interface FilterChipProps {
  id: string;
  label: string;
  ariaLabel: string;
  icon: React.ElementType;
  activeFilter: string;
  onSelect: (id: string) => void;
}

function FilterChip({ id, label, ariaLabel, icon: Icon, activeFilter, onSelect }: FilterChipProps) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={() => onSelect(id)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
        activeFilter === id
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/20'
      }`}
    >
      <Icon className="w-3 h-3 opacity-80" />
      {label}
    </button>
  );
}

// Frecuencia de sondeo en milisegundos (5 segundos)
const POLL_INTERVAL_MS = 5000;

// Tiempo que una fila nueva brilla en ms antes de normalizar su color
const NEW_ROW_FLASH_DURATION_MS = 2500;

export function AuditHistoryPanel({ tenantId }: AuditHistoryPanelProps) {
  const t = useTranslations('admin');
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  // Estado de telemetría en vivo
  const [isLive, setIsLive] = useState(true);
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Ref para rastrear los IDs conocidos sin recrear el intervalo de sondeo
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isLiveRef = useRef(isLive);
  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  // ─── Función de carga de datos (Sondeo e Inicial) ──────────────────────────
  const fetchLogs = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      
      const res = await fetch(`/api/admin/audit?tenantId=${tenantId}&limit=50`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch logs');
      
      const data: AuditLog[] = await res.json();

      // Detectar IDs nuevos comparando con los que ya conocíamos en memoria
      if (!isInitial && knownIdsRef.current.size > 0) {
        const incoming = new Set<string>();
        data.forEach(log => {
          if (log._id && !knownIdsRef.current.has(log._id)) {
            incoming.add(log._id);
          }
        });

        if (incoming.size > 0) {
          setNewLogIds(prev => new Set([...prev, ...incoming]));
          
          // Programar la eliminación de la clase de destello tras la duración definida
          setTimeout(() => {
            setNewLogIds(prev => {
              const next = new Set(prev);
              incoming.forEach(id => next.delete(id));
              return next;
            });
          }, NEW_ROW_FLASH_DURATION_MS);
        }
      }

      // Actualizar la referencia de IDs conocidos en memoria
      knownIdsRef.current = new Set(data.map(l => l._id).filter(Boolean) as string[]);
      
      setLogs(data);
      setLastFetched(new Date());
    } catch (err: unknown) {
      console.error(err);
      if (isInitial) {
        toast.error(t('audit_error_load', { defaultMessage: 'Error al conectar con el servidor.' }));
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [tenantId, t]);

  // ─── Carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    void fetchLogs(true);
  }, [fetchLogs]);

  // ─── Sondeo periódico (activado solo cuando LIVE) ─────────────────────────────
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      if (isLiveRef.current) {
        fetchLogs(false);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isLive, fetchLogs]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const toggleLive = () => {
    setIsLive(prev => {
      const next = !prev;
      if (next) {
        // Carga inmediata de sincronización al volver a LIVE
        fetchLogs(false);
      }
      return next;
    });
  };

  // ─── Filtrado por origen del ecosistema ─────────────────────────────────────
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
      {/* ── Barra de Control de Telemetría ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/50">
        {/* Indicador LIVE / PAUSED */}
        <div className="flex items-center gap-2.5">
          <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border transition-all ${
            isLive
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : 'bg-zinc-700/20 border-zinc-600/30 text-zinc-500'
          }`}>
            {isLive ? (
              <>
                {/* Pulsating dot */}
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

        {/* Toggle LIVE/PAUSE */}
        <button
          aria-label={isLive
            ? t('audit_live_pause', { defaultMessage: 'Pausar Stream' })
            : t('audit_live_resume', { defaultMessage: 'Reanudar Stream' })
          }
          onClick={toggleLive}
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

      {/* ── Chips de Filtro por Aplicación ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <FilterChip
          id="ALL"
          label={t('audit_filter_all', { defaultMessage: 'Todos los Logs' })}
          ariaLabel={t('filterAllLabel', { defaultMessage: 'Filtrar todos los logs' })}
          icon={Activity}
          activeFilter={filter}
          onSelect={setFilter}
        />
        <FilterChip
          id="AUTH"
          label="ABDAuth"
          ariaLabel={t('filterAuthLabel', { defaultMessage: 'Filtrar por logs de autenticación' })}
          icon={ShieldAlert}
          activeFilter={filter}
          onSelect={setFilter}
        />
        <FilterChip
          id="QUIZ"
          label="ABDQuiz"
          ariaLabel={t('filterQuizLabel', { defaultMessage: 'Filtrar por logs de evaluación' })}
          icon={FileText}
          activeFilter={filter}
          onSelect={setFilter}
        />
        <FilterChip
          id="GOBERNANZA"
          label="Gobernanza"
          ariaLabel={t('filterGobernanzaLabel', { defaultMessage: 'Filtrar por logs de gobernanza' })}
          icon={Settings}
          activeFilter={filter}
          onSelect={setFilter}
        />
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
            const isNew = log._id ? newLogIds.has(log._id) : false;
            const logDate = log.createdAt ? new Date(log.createdAt) : null;
            const timeStr = logDate ? logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
            const dateStr = logDate ? logDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '';

            return (
              <div
                key={log._id}
                className={`p-4 rounded-xl border transition-all duration-700 ${
                  isNew
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                    : isExpanded
                    ? 'bg-secondary/15 border-primary/50 shadow-sm'
                    : 'bg-card border-border hover:bg-secondary/10'
                }`}
              >
                {/* Cabecera del Item */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Indicador de nuevo item */}
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

                    <button 
                      aria-label={t('audit_toggle_details', { defaultMessage: 'Expandir detalles del log' })}
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

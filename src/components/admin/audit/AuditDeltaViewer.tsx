'use client';

import { useTranslations } from 'next-intl';
import { FileCode, Tag } from 'lucide-react';
import { AuditLog } from './types';

interface AuditDeltaViewerProps {
  log: AuditLog;
}

export function AuditDeltaViewer({ log }: AuditDeltaViewerProps) {
  const t = useTranslations('admin');
  
  const changes = log.changedFields || {};
  const previous = log.previousState || {};

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="grid gap-3 p-4 rounded-lg bg-secondary/15 border border-border font-mono text-xs text-foreground/90 max-h-72 overflow-y-auto">
      <div className="flex items-center gap-1.5 border-b border-border pb-2 text-[10px] uppercase tracking-wider text-primary font-bold">
        <FileCode className="w-3.5 h-3.5 text-primary" />
        {t('audit_delta_title', { defaultMessage: 'Comparación de Estados (Delta)' })}
      </div>
      
      {Object.keys(changes).length === 0 ? (
        <span className="text-muted-foreground italic">
          {t('audit_no_details', { defaultMessage: 'No hay detalles adicionales.' })}
        </span>
      ) : (
        Object.keys(changes).map(key => {
          if (key === 'updatedAt' || key === 'createdAt' || key === '_id') return null;
          
          const prevValue = previous[key];
          const newValue = changes[key];

          return (
            <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-border/10 last:border-b-0 items-start">
              <div className="font-bold text-primary flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 opacity-60 text-primary" />
                {key}
              </div>
              <div className="md:col-span-2 grid gap-1.5">
                {prevValue !== undefined && (
                  <div className="flex items-center gap-2 text-rose-500 bg-rose-500/5 px-2.5 py-0.5 rounded border border-rose-500/10 w-fit">
                    <span className="text-[9px] uppercase font-semibold tracking-wider opacity-60">
                      {t('audit_previous', { defaultMessage: 'Previo:' })}
                    </span>
                    <span className="break-all font-bold">{formatValue(prevValue)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/5 px-2.5 py-0.5 rounded border border-emerald-500/10 w-fit">
                  <span className="text-[9px] uppercase font-semibold tracking-wider opacity-60">
                    {t('audit_new', { defaultMessage: 'Nuevo:' })}
                  </span>
                  <span className="break-all font-bold">{formatValue(newValue)}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

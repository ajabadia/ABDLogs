'use client';

/**
 * @purpose Rendra un componente de badge según el tipo de acción desde un registro de auditoría, mostrando iconos y texto localizados adecuados.
 * @purpose_en Renders a badge component based on the type of action from an audit log, displaying appropriate icons and localized text.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1g90qfw
 * @lastUpdated 2026-06-22T06:31:14.319Z
 */

import { useTranslations } from 'next-intl';
import { 
  Activity, 
  Settings, 
  Layers, 
  Shield
} from 'lucide-react';
import { AuditLog } from './types';

interface ActionBadgeProps {
  action: AuditLog['action'];
}

export function ActionBadge({ action }: ActionBadgeProps) {
  const t = useTranslations('admin');

  switch (action) {
    case 'CREATE_SPACE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Layers className="w-3 h-3" />
          {t('audit_action_create_space', { defaultMessage: 'Creación Espacio' })}
        </span>
      );
    case 'UPDATE_SPACE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          <Layers className="w-3 h-3" />
          {t('audit_action_update_space', { defaultMessage: 'Edición Espacio' })}
        </span>
      );
    case 'MOVE_SPACE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Activity className="w-3 h-3" />
          {t('audit_action_move_space', { defaultMessage: 'Traslado Espacio' })}
        </span>
      );
    case 'HERITAGE_VISIBILITY':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Shield className="w-3 h-3" />
          {t('audit_action_heritage_visibility', { defaultMessage: 'Herencia Permisos' })}
        </span>
      );
    case 'UPDATE_BRANDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
          <Settings className="w-3 h-3" />
          {t('audit_action_update_branding', { defaultMessage: 'Marca Blanca' })}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
          {action}
        </span>
      );
  }
}

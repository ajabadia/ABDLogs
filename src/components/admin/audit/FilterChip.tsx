'use client';

/**
 * @purpose Renderiza un componente de filtro en una celda de filtro que se puede seleccionar para aplicar un filtro, con indicación visual del estado de selección.
 * @purpose_en Renders a filter chip component that can be selected to apply a filter, with visual indication of selection status.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:178wbpy
 * @lastUpdated 2026-06-22T06:31:53.794Z
 */

import type { ElementType } from 'react';

interface FilterChipProps {
  id: string;
  label: string;
  ariaLabel: string;
  icon: ElementType;
  activeFilter: string;
  onSelect: (id: string) => void;
}

export function FilterChip({ id, label, ariaLabel, icon: Icon, activeFilter, onSelect }: FilterChipProps) {
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

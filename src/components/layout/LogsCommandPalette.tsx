'use client';

/**
 * @purpose Renderiza una pestaña de comandos con varios comandos relacionados con registro, navegación y configuración del usuario.
 * @purpose_en Renders a command palette with various commands related to logging, navigation, and user settings.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:aw6sm2
 * @lastUpdated 2026-06-30T05:49:35.141Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { ShieldCheck, Server } from 'lucide-react';

export function LogsCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const commands: Command[] = [
    // Navigation Category
    {
      id: 'nav-audit',
      title: locale === 'es' ? 'Visor Forense (Audit)' : 'Forensic Viewer',
      description: locale === 'es' ? 'Explorar el registro de logs unificado' : 'Explore the unified log registry',
      category: locale === 'es' ? 'Auditoría' : 'Audit',
      shortcut: ['g', 'a'],
      icon: <ShieldCheck className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    {
      id: 'nav-status',
      title: locale === 'es' ? 'Estado del Servicio' : 'Service Status',
      description: locale === 'es' ? 'Verificar ingestas y latencia' : 'Check ingestion and latency',
      category: locale === 'es' ? 'Auditoría' : 'Audit',
      shortcut: ['g', 's'],
      icon: <Server className="w-4 h-4" />,
      action: () => {
        router.push('/admin');
      }
    },
    // Configuration / Action Category
    ...buildCommonCommands({ locale, pathname, router, onLogout: () => { window.location.href = '/api/abd-auth/logout'; } })
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={locale === 'es' ? 'Escribe un comando o busca trazas...' : 'Type a command or search traces...'}
    />
  );
}

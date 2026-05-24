'use client';

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { CommandPalette, Command } from '@abd/ecosystem-widgets';
import { ShieldCheck, Server, Globe, LogOut, Settings } from 'lucide-react';

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
    {
      id: 'action-language',
      title: locale === 'es' ? 'Switch to English' : 'Cambiar a Español',
      description: locale === 'es' ? 'Change layout language to English' : 'Cambiar el idioma a Español',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['c', 'l'],
      icon: <Globe className="w-4 h-4" />,
      action: () => {
        const nextLocale = locale === 'es' ? 'en' : 'es';
        router.replace(pathname, { locale: nextLocale });
      }
    },
    {
      id: 'action-settings',
      title: locale === 'es' ? 'Abrir Panel de Configuración' : 'Open System Settings',
      description: locale === 'es' ? 'Ajustar temas visuales e idioma' : 'Adjust theme modes and language',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['c', 's'],
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        const settingsBtn = document.querySelector('[aria-label="Open Settings"]') as HTMLButtonElement;
        if (settingsBtn) {
          settingsBtn.click();
        }
      }
    },
    {
      id: 'action-logout',
      title: locale === 'es' ? 'Cerrar Sesión' : 'Sign Out',
      description: locale === 'es' ? 'Finalizar sesión de forma segura' : 'Securely end your session',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['q', 'q'],
      icon: <LogOut className="w-4 h-4" />,
      action: () => {
        window.location.href = '/api/auth/logout';
      }
    }
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={locale === 'es' ? 'Escribe un comando o busca trazas...' : 'Type a command or search traces...'}
    />
  );
}

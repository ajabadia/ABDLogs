'use client';

import React from 'react';
import { Home, Terminal, ShieldCheck } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { AppSidebarNavigation, type AppSidebarLink } from '@ajabadia/ecosystem-widgets';

interface UserSession {
  authenticated: boolean;
  user?: {
    name: string;
    surname: string;
    email: string;
    role: string;
    tenantId: string;
    branding?: {
      logoUrl?: string | null;
    } | null;
  };
}

interface SidebarNavigationProps {
  session: UserSession;
  logoUrl?: string | null;
  tenantSelectorSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
}

export function SidebarNavigation({ session, logoUrl, tenantSelectorSlot, settingsSlot }: SidebarNavigationProps) {
  const t = useTranslations('common');
  const locale = useLocale();

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;

  const allLinks: AppSidebarLink[] = [
    {
      href: '/',
      label: locale === 'es' ? 'Bienvenida' : 'Welcome',
      icon: <Home size={14} />
    },
    {
      href: '/admin/audit',
      label: locale === 'es' ? 'Auditoría en Cadena' : 'Chain Auditing',
      icon: <ShieldCheck size={14} />,
      requiresAdmin: true
    },
    {
      href: '/admin',
      label: t('adminMenu') || (locale === 'es' ? 'Consola de Control' : 'Control Console'),
      icon: <Terminal size={14} />,
      requiresAdmin: true
    }
  ];

  const finalLogoUrl = logoUrl || (isLoggedIn && user?.branding ? user.branding.logoUrl : null);

  return (
    <AppSidebarNavigation
      session={session}
      logoUrl={finalLogoUrl}
      links={allLinks}
      brandName={t('appTitle') || 'ABD SYSTEM'}
      appBadge="LOGS"
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
    />
  );
}

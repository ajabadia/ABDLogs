'use client';

import React from 'react';
import { Home, Terminal, ShieldCheck } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { SmartNavbar, buildSidebarLinks } from '@abd/ecosystem-widgets';

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
  const pathname = usePathname();
  const router = useRouter();
  const [queryStr, setQueryStr] = React.useState('');

  React.useEffect(() => {
    setQueryStr(window.location.search.substring(1));
  }, []);

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;

  const allLinks = [
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
  ] as const;

  const links = buildSidebarLinks(allLinks, user?.role, isLoggedIn);

  const finalLogoUrl = logoUrl || (isLoggedIn && user?.branding ? user.branding.logoUrl : null);

  // Preserve query params across navigation
  const transformHref = (href: string) => {
    return queryStr ? `${href}?${queryStr}` : href;
  };

  const handleLocaleChange = (newLocale: string) => {
    let domainSuffix = "";
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        domainSuffix = `; domain=.${parts.slice(-2).join('.')}`;
      }
    }
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax${domainSuffix}`;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`${pathname}${search}`, { locale: newLocale });
  };

  return (
    <SmartNavbar
      session={session}
      links={links}
      logoUrl={finalLogoUrl}
      onLogout={() => { window.location.href = '/api/auth/logout'; }}
      brandName={t('appTitle') || 'ABD SYSTEM'}
      activeHref={pathname}
      locale={locale}
      transformHref={queryStr ? transformHref : undefined}
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
      onLocaleChange={handleLocaleChange}
      onSearchTrigger={() => {
        window.dispatchEvent(new CustomEvent('abd-command-palette-open'));
      }}
      translations={{
        brandFallback: t('appTitle') || 'ABD SYSTEM',
        logoutBtn: locale === 'es' ? 'TERMINAR SESIÓN' : 'SIGN OUT',
        identityProvider: locale === 'es' ? 'PROVEEDOR DE IDENTIDAD' : 'IDENTITY PROVIDER',
        statusOnline: locale === 'es' ? 'EN LÍNEA' : 'ONLINE',
        emailLabel: locale === 'es' ? 'CORREO' : 'EMAIL'
      }}
    />
  );
}


'use client';

import React from 'react';
import { Home, Terminal, ShieldCheck } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/routing';
import { TacticalSidebar as SharedTacticalSidebar } from '@abd/styles';

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
}

export function SidebarNavigation({ session, logoUrl }: SidebarNavigationProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryStr = searchParams.toString();

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;
  const isAdmin = isLoggedIn && user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

  const links = [
    {
      href: '/',
      label: locale === 'es' ? 'Bienvenida' : 'Welcome',
      icon: <Home size={14} />
    }
  ];

  if (isLoggedIn && isAdmin) {
    links.push(
      {
        href: '/admin/audit',
        label: locale === 'es' ? 'Auditoría en Cadena' : 'Chain Auditing',
        icon: <ShieldCheck size={14} />
      },
      {
        href: '/admin',
        label: t('adminMenu') || (locale === 'es' ? 'Consola de Control' : 'Control Console'),
        icon: <Terminal size={14} />
      }
    );
  }

  const navUser = isLoggedIn && user ? {
    name: `${user.name} ${user.surname}`,
    role: user.role,
    tenantId: user.tenantId,
    email: user.email
  } : {
    name: locale === 'es' ? 'Invitado' : 'Guest',
    role: 'PUBLIC',
    tenantId: 'GLOBAL',
    email: ''
  };

  const finalLogoUrl = logoUrl || (isLoggedIn && user?.branding ? user.branding.logoUrl : null);

  const LocalizedLink = ({ href, onClick, className, children }: { href: string; onClick?: () => void; className?: string; children: React.ReactNode }) => {
    const finalHref = queryStr ? `${href}?${queryStr}` : href;
    return (
      <Link href={finalHref} onClick={onClick} className={className}>
        {children}
      </Link>
    );
  };

  return (
    <SharedTacticalSidebar
      user={navUser}
      links={links}
      logoUrl={finalLogoUrl}
      onLogout={() => {
        window.location.href = '/api/auth/logout';
      }}
      brandName={user?.tenantId || t('appTitle') || 'ABD SYSTEM'}
      LinkComponent={LocalizedLink}
      activeHref={pathname}
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

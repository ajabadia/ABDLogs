'use client';

import React from 'react';
import { Home, Palette, Folder, Terminal, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface SidebarLinksProps {
  toggleSidebar: () => void;
  locale: string;
  isLoggedIn: boolean;
  isAdmin: boolean | "" | null | undefined;
}

export function SidebarLinks({
  toggleSidebar,
  locale,
  isLoggedIn,
  isAdmin,
}: SidebarLinksProps) {
  const t = useTranslations('common');

  return (
    <nav className="flex flex-col gap-2" role="navigation" aria-label="Sidebar Links">
      {/* Link A.0: Public Welcome Page */}
      <Link
        href="/"
        onClick={toggleSidebar}
        className="flex items-center gap-4 px-4 py-3 bg-muted/10 border border-border hover:border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200 uppercase font-mono text-[10px] font-bold tracking-wider rounded-none"
      >
        <Home className="w-4 h-4 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
        {locale === 'es' ? 'Bienvenida' : 'Welcome'}
      </Link>
      
      {/* Link A: Visual Branding (Marca Blanca) */}
      {isLoggedIn && isAdmin && (
        <Link
          href="/admin/branding"
          onClick={toggleSidebar}
          className="flex items-center gap-4 px-4 py-3 bg-muted/10 border border-border hover:border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200 uppercase font-mono text-[10px] font-bold tracking-wider rounded-none"
        >
          <Palette className="w-4 h-4 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
          {locale === 'es' ? 'Marca Blanca' : 'White-Labeling'}
        </Link>
      )}

      {/* Link A.1: Spaces (Jerarquía de Espacios) */}
      {isLoggedIn && isAdmin && (
        <Link
          href="/admin/spaces"
          onClick={toggleSidebar}
          className="flex items-center gap-4 px-4 py-3 bg-muted/10 border border-border hover:border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200 uppercase font-mono text-[10px] font-bold tracking-wider rounded-none"
        >
          <Folder className="w-4 h-4 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
          {locale === 'es' ? 'Jerarquía de Espacios' : 'Spaces Hierarchy'}
        </Link>
      )}

      {/* Link A.2: Chain Auditing (Auditoría en Cadena) */}
      {isLoggedIn && isAdmin && (
        <Link
          href="/admin/audit"
          onClick={toggleSidebar}
          className="flex items-center gap-4 px-4 py-3 bg-muted/10 border border-border hover:border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200 uppercase font-mono text-[10px] font-bold tracking-wider rounded-none"
        >
          <ShieldCheck className="w-4 h-4 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
          {locale === 'es' ? 'Auditoría en Cadena' : 'Chain Auditing'}
        </Link>
      )}

      {/* Link B: Administration (Only for admins) */}
      {isLoggedIn && isAdmin && (
        <Link
          href="/admin"
          onClick={toggleSidebar}
          className="flex items-center gap-4 px-4 py-3 bg-muted/10 border border-border hover:border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200 uppercase font-mono text-[10px] font-bold tracking-wider rounded-none"
        >
          <Terminal className="w-4 h-4 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
          {t('adminMenu')}
        </Link>
      )}
    </nav>
  );
}

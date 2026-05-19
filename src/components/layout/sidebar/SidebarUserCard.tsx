'use client';

import React from 'react';
import { ShieldCheck, LogOut, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface UserSessionInfo {
  name: string;
  surname: string;
  email: string;
  role: string;
}

interface SidebarUserCardProps {
  isLoggedIn: boolean;
  user?: UserSessionInfo;
  locale: string;
  toggleSidebar: () => void;
}

export function SidebarUserCard({
  isLoggedIn,
  user,
  locale,
  toggleSidebar,
}: SidebarUserCardProps) {
  const t = useTranslations('common');

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      {isLoggedIn && user ? (
        <div className="flex items-center justify-between">
          {/* User Credentials details */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-black tracking-wider text-foreground uppercase">
              {user.name} {user.surname}
            </span>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono text-[8px] text-muted-foreground/80 uppercase tracking-wider">
                {user.email}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/auth/logout"
              className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 border border-border hover:border-red-500/20 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-400/50"
              title={t('logout')}
              aria-label={t('logout')}
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="font-mono text-[9px] text-muted-foreground/80 uppercase tracking-widest">
              {locale === 'es' ? 'Sesión Desconectada' : 'Session Disconnected'}
            </span>
          </div>
          <Link
            href="/admin"
            onClick={toggleSidebar}
            className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-mono text-[9px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border-b-2 border-primary-foreground/10 active:border-b-0 active:translate-y-[1px] outline-none"
          >
            <LogIn className="w-3.5 h-3.5" />
            {t('login')}
          </Link>
        </div>
      )}
    </div>
  );
}

'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { SystemSettings as SharedSystemSettings } from '@abd/ecosystem-widgets';

interface SystemSettingsProps {
  isAuthenticated?: boolean;
}

export function SystemSettings({ isAuthenticated = false }: SystemSettingsProps) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SharedSystemSettings
      locale={locale}
      onLocaleChange={(newLoc) => {
        let domainSuffix = "";
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") {
          const parts = hostname.split('.');
          if (parts.length >= 2) {
            domainSuffix = `; domain=.${parts.slice(-2).join('.')}`;
          }
        }
        document.cookie = `NEXT_LOCALE=${newLoc}; path=/; max-age=31536000; SameSite=Lax${domainSuffix}`;
        
        const search = typeof window !== 'undefined' ? window.location.search : '';
        router.replace(`${pathname}${search}`, { locale: newLoc });
      }}
      isAuthenticated={isAuthenticated}
      showLogin={false}
      logoutUrl="/api/auth/logout"
      versionSignature="ABD_LOGS_V1.0"
    />
  );
}

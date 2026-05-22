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
      onLocaleChange={(newLoc) => router.replace(pathname, { locale: newLoc })}
      isAuthenticated={isAuthenticated}
      showLogin={false}
      logoutUrl="/api/auth/logout"
      versionSignature="ABD_LOGS_V1.0"
    />
  );
}

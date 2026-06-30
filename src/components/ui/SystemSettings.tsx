'use client';

/**
 * @purpose Gestiona un componente UI de configuración del sistema que permite a los usuarios cambiar el idioma, el tema y el estado de autenticación.
 * @purpose_en Renders a system settings UI component that allows users to change locale, theme, and authentication status.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:d0ctjk
 * @lastUpdated 2026-06-30T05:49:36.498Z
 */

import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { SystemSettings as SharedSystemSettings } from '@ajabadia/ecosystem-widgets';
import { setLocaleCookie } from '@ajabadia/i18n';

interface SystemSettingsProps {
  isAuthenticated?: boolean;
}

export function SystemSettings({ isAuthenticated = false }: SystemSettingsProps) {
  const t = useTranslations('settings');
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLoc: string) => {
    setLocaleCookie(newLoc);
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`${pathname}${search}`, { locale: newLoc });
  };

  const authUrl = process.env.NEXT_PUBLIC_AUTH_PROVIDER_URL || 'http://localhost:5001';

  const handleLogin = () => {
    window.location.href = `${authUrl}/login`;
  };

  const handleLogout = () => {
    window.location.href = authUrl;
  };

  return (
    <SharedSystemSettings
      locale={locale}
      onLocaleChange={handleLocaleChange}
      theme={theme}
      onThemeChange={setTheme}
      isAuthenticated={isAuthenticated}
      onLogin={handleLogin}
      onLogout={handleLogout}
      versionSignature="ABD_LOGS_V1.0"
    />
  );
}

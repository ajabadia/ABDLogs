'use client';

import { useTranslations } from 'next-intl';
import { LogoutSuccessView } from '@ajabadia/ecosystem-widgets';
import Link from 'next/link';

/**
 * 🚿 Premium Logout Success Farewell Page Container
 * Delegates to the unified ecosystem LogoutSuccessView component.
 */
export default function LogoutSuccessPage() {
  const t = useTranslations('logoutSuccess');
  const common = useTranslations('common');

  const translations = {
    title: t('title'),
    subtitle: t('subtitle'),
    message: t('message'),
    button: t('button'),
    home_button: t('home_button'),
    shield_badge: t('shield_badge'),
    tenantNotFoundTitle: t('tenantNotFoundTitle'),
    tenantNotFoundDesc: t('tenantNotFoundDesc'),
  };

  return (
    <LogoutSuccessView
      appTitle={common('appTitle')}
      translations={translations}
      LinkComponent={Link}
      signInUrl="/admin"
    />
  );
}

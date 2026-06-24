'use client';

/**
 * @purpose Renderiza una página de éxito de salida utilizando el componente `LogoutSuccessView` desde la biblioteca de widgets del ecosistema, delegando traducciones y manejo de rutas.
 * @purpose_en Renders a logout success page using the `LogoutSuccessView` component from the ecosystem widgets library, delegating translations and handling routing.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1h2n64j
 * @lastUpdated 2026-06-23T23:06:14.926Z
 */

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

/**
 * @purpose Gestiona la configuración de solicitudes de internacionalización para la aplicación ABDLogs.
 * @purpose_en Manages internationalization request configuration for the ABDLogs application.
 * @refactorable false
 * @classification Custom Hook
 * @complexity Low
 * @fingerprint exports:0,imports:2,sig:15kwxt7
 * @lastUpdated 2026-06-22T06:33:11.176Z
 */

import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
 
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }
 
  const { locales: allMessages } = await import('@ajabadia/i18n');
  const messages = allMessages[locale as 'es' | 'en'];

  return {
    locale,
    messages
  };
});

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['es', 'en'];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  // Fallback seguro al idioma predeterminado durante prerenderizado estático (evita error en /_not-found)
  if (!locale || !locales.includes(locale)) {
    locale = 'es';
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});

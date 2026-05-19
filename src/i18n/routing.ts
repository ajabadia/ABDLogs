import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'as-needed' // Evita el prefijo en el idioma por defecto si se desea
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

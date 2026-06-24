"use client"

/**
 * @purpose Gestiona los ajustes del tema y los proporciona a la aplicación mediante NextThemesProvider.
 * @purpose_en Manages theme settings and provides them to the application using NextThemesProvider.
 * @refactorable false
 * @classification Context/Provider
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:15s0237
 * @lastUpdated 2026-06-22T06:32:43.573Z
 */

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return;
    orig.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}

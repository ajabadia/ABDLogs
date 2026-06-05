import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 🎯 ABDLogs — Auditoría de Accesibilidad Automatizada (axe-core)
 *
 * Escanea las páginas públicas de ABDLogs
 * y reporta violaciones WCAG 2.2 AA con detalles precisos para corrección.
 */

const BASE_URL = 'http://localhost:5003';

const PAGES = [
  { path: '/es', name: 'Landing pública' },
  { path: '/es/logout-success', name: 'Logout success' },
];

test.describe('🎯 Auditoría de Accesibilidad — ABDLogs', () => {
  for (const { path, name } of PAGES) {
    test(`[A11Y] ${name} (${path})`, async ({ page }, testInfo) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page }).analyze();

      // Log ALL violations with full details
      if (results.violations.length > 0) {
        console.log(`\n❌ ${name} — ${results.violations.length} violación(es):`);
        for (const v of results.violations) {
          console.log(`\n  ── [${v.impact?.toUpperCase() || 'N/A'}] ${v.id}`);
          console.log(`     Ayuda: ${v.help}`);
          console.log(`     URL:   ${v.helpUrl}`);
          for (const node of v.nodes.slice(0, 5)) {
            console.log(`     ▸ Elemento: ${node.html}`);
            console.log(`       Target:   ${node.target.join(', ')}`);
            if (node.failureSummary) {
              console.log(`       Falla:    ${node.failureSummary.split('\\n')[0]}`);
            }
          }
        }
      }

      // Assert
      expect.soft(results.violations.length, `${name}: ${results.violations.length} violación(es)`).toBe(0);
    });
  }
});

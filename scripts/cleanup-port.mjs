#!/usr/bin/env node
/**
 * cleanup-port.mjs
 *
 * Mata cualquier proceso zombie en el puerto especificado.
 * Se ejecuta directamente con Node.js, evitando que bash interprete
 * $_.OwningProcess como variable de shell.
 *
 * Uso:
 *   node cleanup-port.mjs [port]
 *
 * Ejemplo:
 *   node cleanup-port.mjs 3600
 */

import { execSync } from 'child_process';

const port = process.argv[2] || '3600';

try {
  // Usamos shell: 'powershell' para que Node.js ejecute PowerShell
  // directamente, sin que bash pueda expandir $_ como variable.
  execSync(
    `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`,
    { shell: 'powershell', stdio: 'pipe', timeout: 5000 }
  );
} catch {
  // Si falla (ej: no hay conexión en ese puerto o PowerShell no está), no es crítico
}

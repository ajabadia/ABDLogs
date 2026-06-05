/**
 * 🎭 Playwright — Pre-flight Checks (globalSetup)
 *
 * Se ejecuta UNA VEZ antes de todos los tests.
 * Verifica:
 *   1. .env.local existe y tiene variables requeridas
 *   2. MONGODB_URI configurada en .env.local
 *   3. ABDAuth está corriendo (localhost:5001) — warn si no
 *   4. node_modules está presente
 *
 * Si algún check crítico falla, lanza error y los tests no se ejecutan.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as mongoose from 'mongoose';
import { execSync } from 'child_process';

// ── Config ────────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();
const ENV_PATH = path.join(PROJECT_ROOT, '.env.local');
const AUTH_ENV_PATH = path.join(PROJECT_ROOT, '..', 'ABDAuth', '.env.local');

const REQUIRED_VARS = ['AUTH_CLIENT_ID', 'AUTH_CLIENT_SECRET', 'AUTH_JWT_SECRET'];
const AUTH_PORT = 3400;

const CHECK_TIMEOUT = 3000;
const MONGO_CONNECT_TIMEOUT = 10000;

// Node.js minimum version (Next.js 16 requires 18.18+)
const MIN_NODE_MAJOR = 18;
const MIN_NODE_MINOR = 18;

// ── Types ─────────────────────────────────────────────────────────────────

type EnvVars = Record<string, string>;
type NodeVersion = { major: number; minor: number; patch: number };

// ── Helpers ───────────────────────────────────────────────────────────────

function parseEnvFile(content: string): EnvVars {
  const vars: EnvVars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function loadEnv(): EnvVars {
  try {
    if (!fs.existsSync(ENV_PATH)) return {};
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    return parseEnvFile(content);
  } catch {
    return {};
  }
}

async function checkTcpPort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(CHECK_TIMEOUT);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

function getNodeVersion(): NodeVersion {
  const parts = process.version.slice(1).split('.').map(Number);
  return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
}

function isNodeVersionAtLeast(target: NodeVersion): boolean {
  const current = getNodeVersion();
  if (current.major !== target.major) return current.major > target.major;
  if (current.minor !== target.minor) return current.minor > target.minor;
  return current.patch >= target.patch;
}

async function checkMongoConnection(uri: string): Promise<{ ok: boolean; error?: string; durationMs: number }> {
  const start = Date.now();
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: MONGO_CONNECT_TIMEOUT,
      connectTimeoutMS: MONGO_CONNECT_TIMEOUT,
    });
    const duration = Date.now() - start;
    await mongoose.disconnect();
    return { ok: true, durationMs: duration };
  } catch (err: any) {
    const duration = Date.now() - start;
    return { ok: false, error: err?.message || String(err), durationMs: duration };
  }
}

function checkPassed(label: string): void {
  console.log(`  ✅  ${label}`);
}

function checkFailed(label: string, hint: string): void {
  console.log(`  ❌  ${label}`);
  console.log(`      ${hint}`);
}

function warn(label: string, hint: string): void {
  console.log(`  ⚠️   ${label}`);
  console.log(`      ${hint}`);
}

// ── Main ──────────────────────────────────────────────────────────────────

// ── Port Cleanup ──────────────────────────────────────────────────────

function killPort(port: number): void {
  // Skippear si el runner script ya hizo cleanup
  if (process.env.ABDLOGS_SKIP_PORT_CLEANUP) return;
  try {
    execSync(
      `node scripts/cleanup-port.mjs ${port}`,
      { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: 5000 }
    );
  } catch {
    // Si falla, no es crítico
  }
}

async function globalSetup() {
  // ── Cleanup: matar proceso zombie en puerto 3600 ──
  killPort(3600);

  // Si NO se ejecutó desde scripts/run-e2e.sh, el server puede no estar corriendo
  if (!process.env.ABDLOGS_SKIP_PORT_CLEANUP) {
    console.log('');
    console.log('⚠️  Ejecución directa detectada (sin scripts/run-e2e.sh)');
    console.log('   Asegúrate de que el server ya esté corriendo en localhost:5003');
    console.log('   O usa: bash scripts/run-e2e.sh');
    console.log('');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('🎭  Playwright — Pre-flight Checks');
  console.log('    ABDLogs (localhost:5003)');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  let allCriticalPassed = true;
  const warnings: string[] = [];

  // ── 0. Node.js version ─────────────────────────────────────────
  console.log('── 0. Node.js version ─────────────────────────');

  const nodeVer = getNodeVersion();
  const minVer: NodeVersion = { major: MIN_NODE_MAJOR, minor: MIN_NODE_MINOR, patch: 0 };

  if (isNodeVersionAtLeast(minVer)) {
    checkPassed(`Node.js ${nodeVer.major}.${nodeVer.minor}.${nodeVer.patch} (mínimo ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.0+)`);
  } else {
    checkFailed(
      `Node.js ${nodeVer.major}.${nodeVer.minor}.${nodeVer.patch} es muy antiguo`,
      `Se requiere Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.0+ (Next.js 16).\n` +
      `       Versión actual: ${nodeVer.major}.${nodeVer.minor}.${nodeVer.patch}\n` +
      `       Descarga: https://nodejs.org/`
    );
    allCriticalPassed = false;
  }

  // ── 1. .env.local ─────────────────────────────────────────────────
  console.log('── 1. Environment ────────────────────────────');

  const env = loadEnv();

  if (fs.existsSync(ENV_PATH)) {
    checkPassed('.env.local encontrado');
  } else {
    checkFailed('.env.local', 'Crea ABDLogs/.env.local');
    allCriticalPassed = false;
  }

  const missing = REQUIRED_VARS.filter(v => !env[v]);
  if (missing.length === 0) {
    checkPassed(`Variables requeridas: ${REQUIRED_VARS.join(', ')}`);
  } else {
    checkFailed(
      `Faltan: ${missing.join(', ')}`,
      `Agrégalas a ABDLogs/.env.local (sin comillas, sin espacios alrededor de =)`
    );
    allCriticalPassed = false;
  }

  // ── 2. MongoDB ──────────────────────────────────────────────────
  console.log('── 2. MongoDB ─────────────────────────────────');
  const mongoUri = env['MONGODB_URI'];

  if (mongoUri) {
    const maskedUri = mongoUri.replace(/\/\/[^@]+@/, '//***:***@');
    console.log(`  📡  Probando conexión a: ${maskedUri}`);

    const result = await checkMongoConnection(mongoUri);

    if (result.ok) {
      checkPassed(`Conexión exitosa (${result.durationMs}ms)`);
    } else {
      checkFailed(
        'Conexión fallida',
        `No se pudo conectar a MongoDB Atlas.\n` +
        `       Tiempo: ${result.durationMs}ms\n` +
        `       Error: ${result.error || 'desconocido'}\n` +
        `       Verifica que:\n` +
        `       • La URI en .env.local sea correcta\n` +
        `       • La IP actual esté en la whitelist de MongoDB Atlas\n` +
        `       • Las credenciales sean válidas\n` +
        `       • El cluster esté activo (no paused/down)`
      );
      allCriticalPassed = false;
    }
  } else {
    checkFailed(
      'MONGODB_URI no configurada',
      'Define MONGODB_URI en .env.local (ej: mongodb+srv://user:pass@cluster.mongodb.net/)'
    );
    allCriticalPassed = false;
  }

  // ── 3. ABDAuth (optional — warn only) ───────────────────────────
  console.log('── 3. ABDAuth ──────────────────────────────────');

  const authEnvExists = fs.existsSync(AUTH_ENV_PATH);
  if (authEnvExists) {
    checkPassed('ABDAuth/.env.local encontrado');
  } else {
    warn('ABDAuth/.env.local no encontrado', 'Crea ABDAuth/.env.local (necesario para arrancar ABDAuth)');
    warnings.push('ABDAuth/.env.local no encontrado — ABDAuth podría no arrancar correctamente');
  }

  // TCP en vez de HTTP para evitar falsos negativos con rutas Next.js
  const authReachable = await checkTcpPort('localhost', AUTH_PORT);
  if (authReachable) {
    checkPassed(`ABDAuth reachable en localhost:${AUTH_PORT}`);
  } else {
    warn(
      `ABDAuth (localhost:${AUTH_PORT}) no responde`,
      `Los tests de rutas públicas funcionarán.\n` +
      `       Los tests de rutas admin fallarán si no hay sesión.\n` +
      `       Para tests admin completos, corre: cd ABDAuth && pnpm dev`
    );
    warnings.push(`ABDAuth no está corriendo en :${AUTH_PORT}. Tests admin requieren ABDAuth.`);
  }

  // ── 4. Dependencias npm ──────────────────────────────────────
  console.log('── 4. Dependencias ───────────────────────────────');
  const nodeModulesExist = fs.existsSync(path.join(PROJECT_ROOT, 'node_modules'));
  if (nodeModulesExist) {
    checkPassed('node_modules encontrado');
  } else {
    checkFailed('node_modules no encontrado', 'Ejecuta pnpm install en ABDLogs/');
    allCriticalPassed = false;
  }

  // ── Resumen ──────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════');

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (no bloqueantes):');
    for (const w of warnings) {
      console.log(`   • ${w}`);
    }
    console.log('');
  }

  if (allCriticalPassed) {
    console.log('✅  TODOS LOS CHECKS CRÍTICOS PASARON');
    console.log('    Iniciando servidor y tests...');
  } else {
    console.log('❌  CHECKS CRÍTICOS FALLIDOS');
    console.log('    Corrige los errores de arriba y vuelve a intentar.');
    console.log('');
    throw new Error('Pre-flight checks failed. See above for details.');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('');
}

export default globalSetup;

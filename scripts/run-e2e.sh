#!/usr/bin/env bash
#
# run-e2e.sh — Run ABDLogs E2E tests
#
# cmd.exe está roto en este sistema, por lo que el webServer de Playwright
# (que usa shell: true → cmd.exe en Windows) no puede arrancar el dev server.
#
# Este script:
#   1. Limpia el puerto 3600 (mata procesos zombie)
#   2. Arranca el dev server de Next.js directamente (node, no pnpm)
#   3. Espera a que el server esté ready
#   4. Ejecuta los tests E2E de Playwright (CLI directa, no pnpm exec)
#   5. Mata el server al finalizar

set -e

cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo "=== Step 1: Cleanup port 3600 ==="
node scripts/cleanup-port.mjs 3600

echo "=== Step 2: Start Next.js dev server ==="
node node_modules/next/dist/bin/next dev -p 3600 --webpack &>/tmp/server3600.log &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Asegurar que el server se mate incluso si el usuario hace Ctrl+C
cleanup() {
  echo ""
  echo "=== Cleanup: Stopping server (PID $SERVER_PID) ==="
  kill $SERVER_PID 2>/dev/null
  echo "Server stopped."
}
trap cleanup EXIT INT TERM

echo "=== Step 3: Wait for server to be ready ==="
for i in $(seq 1 45); do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3600 2>/dev/null || echo "000")
  if echo "$HTTP_CODE" | grep -qE '2|3'; then
    echo "SERVER_READY after ${i}s (HTTP $HTTP_CODE)"
    break
  fi
  if [ $i -eq 45 ]; then
    echo "SERVER_TIMEOUT after 45s"
    cat /tmp/server3600.log
    kill $SERVER_PID 2>/dev/null
    exit 1
  fi
  sleep 2
done

echo "=== Step 4: Run Playwright E2E tests ==="
# Indicar a globalSetup.ts que NO mate el puerto (el server ya está corriendo)
export ABDLOGS_SKIP_PORT_CLEANUP=true
timeout 600 node node_modules/@playwright/test/cli.js test --reporter=list --retries 0 --workers 1 2>&1
TEST_EXIT=$?

echo "=== Step 5: Cleanup server ==="
kill $SERVER_PID 2>/dev/null

if [ $TEST_EXIT -eq 0 ]; then
  echo "=== ALL TESTS PASSED ==="
else
  echo "=== TESTS FAILED (exit: $TEST_EXIT) ==="
fi

exit $TEST_EXIT

import mongoose from 'mongoose';
const { MongoClient } = mongoose.mongo;
import { loadEnvFile } from 'node:process';
import path from 'node:path';

// Cargar variables de entorno
try {
  loadEnvFile(path.resolve(process.cwd(), '.env.local'));
  console.log('[ENV] Variables de entorno cargadas correctamente.');
} catch (err) {
  console.warn('[ENV] No se pudo cargar .env.local de forma automática:', err.message);
}

const authUri = process.env.MONGODB_AUTH_URI;
const logsUri = process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI;
const destUri = process.env.MONGODB_URI || logsUri;

if (!authUri) {
  console.error('[ERROR] MONGODB_AUTH_URI no está definido en el entorno.');
  process.exit(1);
}
if (!destUri) {
  console.error('[ERROR] MONGODB_URI/MONGODB_LOGS_URI no está definido en el entorno.');
  process.exit(1);
}

function mapSecurityEventToEntityType(event) {
  const ev = String(event).toUpperCase();
  if (ev.startsWith('TENANT')) return 'TENANT';
  if (ev.startsWith('SSO')) return 'SSO';
  if (ev.startsWith('MFA') || ev.startsWith('LOGIN') || ev.startsWith('LOGOUT') || ev.startsWith('PASSWORD') || ev.startsWith('USER')) {
    return 'USER';
  }
  return 'SYSTEM';
}

async function runMigration() {
  let authClient, logsClient;
  
  try {
    console.log('\n--- INICIANDO PROCESO DE MIGRACIÓN ---');
    console.log(`[CONEXIÓN] Origen Auth: ${authUri.split('@')[1] || authUri}`);
    console.log(`[CONEXIÓN] Destino Logs: ${destUri.split('@')[1] || destUri}`);

    // Conectar clientes
    authClient = await MongoClient.connect(authUri);
    logsClient = await MongoClient.connect(destUri);
    
    const dbAuth = authClient.db('ABDElevators-Auth');
    const dbLogs = logsClient.db('ABDElevators-Logs');

    const collectionAccessLogs = dbLogs.collection('access_logs');
    const collectionAuthOps = dbAuth.collection('audit_auth_ops');
    const collectionCentralLogs = dbLogs.collection('central_audit_logs');

    console.log('[BD] Conexiones establecidas correctamente.');

    // 1. Migrar logs de Seguridad (access_logs)
    console.log('\n--- 1/2 MIGRANDO ACCESS LOGS (SEGURIDAD) ---');
    const accessLogsCount = await collectionAccessLogs.countDocuments();
    console.log(`[ACCESS LOGS] Encontrados ${accessLogsCount} documentos.`);

    if (accessLogsCount > 0) {
      const cursor = collectionAccessLogs.find({});
      const batch = [];
      let migratedCount = 0;

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const mappedDoc = {
          appId: 'auth',
          tenantId: doc.tenantId || 'SYSTEM',
          action: doc.event || 'UNKNOWN_SECURITY_EVENT',
          entityType: mapSecurityEventToEntityType(doc.event),
          entityId: doc.actorId || 'SYSTEM',
          userId: doc.actorId || 'SYSTEM',
          userEmail: doc.actorEmail || 'system@abdlogs.local',
          changedFields: {
            status: doc.status || 'INFO',
            ...(doc.metadata || {})
          },
          ipAddress: doc.ip || undefined,
          userAgent: doc.userAgent || undefined,
          createdAt: doc.timestamp || doc.createdAt || new Date()
        };
        batch.push(mappedDoc);

        if (batch.length >= 100) {
          await collectionCentralLogs.insertMany(batch);
          migratedCount += batch.length;
          console.log(`   Migrados ${migratedCount}/${accessLogsCount}...`);
          batch.length = 0;
        }
      }

      if (batch.length > 0) {
        await collectionCentralLogs.insertMany(batch);
        migratedCount += batch.length;
        console.log(`   Migrados ${migratedCount}/${accessLogsCount} finalizado.`);
      }
    }

    // 2. Migrar logs operacionales (audit_auth_ops)
    console.log('\n--- 2/2 MIGRANDO AUDIT AUTH OPS (OPERACIONES) ---');
    const authOpsCount = await collectionAuthOps.countDocuments();
    console.log(`[AUDIT AUTH OPS] Encontrados ${authOpsCount} documentos.`);

    if (authOpsCount > 0) {
      const cursor = collectionAuthOps.find({});
      const batch = [];
      let migratedCount = 0;

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const mappedDoc = {
          appId: 'auth',
          tenantId: doc.tenantId || 'SYSTEM',
          action: doc.action || 'UNKNOWN_OPERATION',
          entityType: doc.entityType || 'SYSTEM',
          entityId: doc.entityId || 'SYSTEM',
          userId: doc.userId || 'SYSTEM',
          userEmail: doc.userEmail || 'system@abdlogs.local',
          changedFields: {
            ...(doc.changedFields || {}),
            ...(doc.previousState ? { previousState: doc.previousState } : {})
          },
          ipAddress: doc.ipAddress || undefined,
          userAgent: doc.userAgent || undefined,
          createdAt: doc.createdAt || new Date()
        };
        batch.push(mappedDoc);

        if (batch.length >= 100) {
          await collectionCentralLogs.insertMany(batch);
          migratedCount += batch.length;
          console.log(`   Migrados ${migratedCount}/${authOpsCount}...`);
          batch.length = 0;
        }
      }

      if (batch.length > 0) {
        await collectionCentralLogs.insertMany(batch);
        migratedCount += batch.length;
        console.log(`   Migrados ${migratedCount}/${authOpsCount} finalizado.`);
      }
    }

    console.log('\n🎉 ¡PROCESO DE MIGRACIÓN COMPLETADO CON ÉXITO! 🎉\n');

  } catch (error) {
    console.error('[CRITICAL MIGRATION ERROR]', error);
  } finally {
    if (authClient) await authClient.close();
    if (logsClient) await logsClient.close();
    console.log('[CONEXIÓN] Conexiones cerradas.');
  }
}

runMigration();

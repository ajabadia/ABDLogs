import mongoose, { Connection, Schema, Model } from 'mongoose';
import { AsyncLocalStorage } from 'async_hooks';
import { getIndustrialSession } from '@abd/satellite-sdk';

export interface TenantContext {
  tenantId: string;
  dbPrefix: string;
  isolationStrategy: string; // 'DATABASE_PER_TENANT' | 'COLLECTION_PREFIX'
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Helper to resolve the MongoDB URI for a specific tenant database.
 */
export function resolveTenantUri(baseUri: string, dbName: string): string {
  const protocolMatch = baseUri.match(/^mongodb(?:\+srv)?:\/\//);
  if (!protocolMatch) {
    throw new Error('Invalid MONGODB_URI protocol');
  }
  const protocol = protocolMatch[0];
  const remaining = baseUri.substring(protocol.length);
  
  const qIndex = remaining.indexOf('?');
  const hostAndDb = qIndex === -1 ? remaining : remaining.substring(0, qIndex);
  const options = qIndex === -1 ? '' : remaining.substring(qIndex);
  
  const slashIndex = hostAndDb.lastIndexOf('/');
  
  if (slashIndex === -1) {
    return `${protocol}${hostAndDb}/${dbName}${options}`;
  } else {
    const hostPart = hostAndDb.substring(0, slashIndex);
    return `${protocol}${hostPart}/${dbName}${options}`;
  }
}

// Global cache for tenant connections to survive Hot Module Replacement (HMR)
interface TenantConnectionCache {
  [key: string]: Connection;
}

const globalWithTenantConnections = global as typeof globalThis & {
  tenantConnections?: TenantConnectionCache;
};

if (!globalWithTenantConnections.tenantConnections) {
  globalWithTenantConnections.tenantConnections = {};
}

const connectionPool = globalWithTenantConnections.tenantConnections;

/**
 * Gets or creates a cached Mongoose Connection for a tenant.
 */
export function getTenantConnection(dbPrefix: string, isolationStrategy: string): Connection {
  const cacheKey = isolationStrategy === 'DATABASE_PER_TENANT'
    ? `DB_PER_TENANT:${dbPrefix}`
    : `COLL_PREFIX:${dbPrefix}`;
    
  if (connectionPool[cacheKey]) {
    return connectionPool[cacheKey];
  }
  
  const baseUri = process.env.MONGODB_URI || "";
  if (!baseUri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  
  let targetUri = baseUri;
  if (isolationStrategy === 'DATABASE_PER_TENANT') {
    const dbName = `abd_tenant_${dbPrefix}`;
    targetUri = resolveTenantUri(baseUri, dbName);
  }
  
  console.log(`[MultiTenant] Creating connection for ${cacheKey} (Strategy: ${isolationStrategy})`);
  
  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };
  
  const conn = mongoose.createConnection(targetUri, opts);
  
  conn.on('connected', () => {
    console.log(`[MultiTenant] Connection established for ${cacheKey}`);
  });
  conn.on('error', (err) => {
    console.error(`[MultiTenant] Connection error for ${cacheKey}:`, err);
  });
  
  connectionPool[cacheKey] = conn;
  return conn;
}

/**
 * Helper to await a mongoose Connection to be ready.
 */
export async function ensureConnectionReady(conn: Connection): Promise<Connection> {
  if (conn.readyState === 1) {
    return conn;
  }
  if (conn.readyState === 2) {
    await new Promise<void>((resolve, reject) => {
      const onConnected = () => {
        conn.removeListener('error', onError);
        resolve();
      };
      const onError = (err: Error) => {
        conn.removeListener('connected', onConnected);
        reject(err);
      };
      conn.once('connected', onConnected);
      conn.once('error', onError);
    });
    return conn;
  }
  await conn.asPromise();
  return conn;
}

/**
 * Runs the callback in the context of the active tenant.
 */
export async function withTenantContext<T>(
  callback: () => Promise<T>,
  explicitContext?: TenantContext
): Promise<T> {
  const activeStore = tenantStorage.getStore();
  if (activeStore) {
    return callback();
  }
  
  if (explicitContext) {
    return tenantStorage.run(explicitContext, callback);
  }
  
  try {
    const session = await getIndustrialSession();
    if (session?.authenticated && session.user?.tenantId) {
      const context: TenantContext = {
        tenantId: session.user.tenantId,
        dbPrefix: session.user.dbPrefix,
        isolationStrategy: session.user.isolationStrategy || 'COLLECTION_PREFIX',
      };
      return tenantStorage.run(context, callback);
    }
  } catch (err) {
    console.warn('[TenantContext] Failed to get session or cookies:', err);
  }
  
  return callback();
}

/**
 * Compiles a model on a given connection, preventing duplicate compilations.
 */
function compileModelOnConnection<T>(
  conn: Connection,
  modelName: string,
  schema: Schema<T>,
  collectionName?: string
): Model<T> {
  if (conn.models[modelName]) {
    return conn.models[modelName] as Model<T>;
  }
  return conn.model<T>(modelName, schema, collectionName);
}

/**
 * Resolves the tenant-specific compiled model for a given modelName and schema.
 */
function getModelForTenant<T>(
  dbPrefix: string,
  isolationStrategy: string,
  modelName: string,
  schema: Schema<T>,
  defaultCollectionName: string
): Model<T> {
  const conn = getTenantConnection(dbPrefix, isolationStrategy);
  
  let collectionName = defaultCollectionName;
  if (isolationStrategy === 'COLLECTION_PREFIX') {
    collectionName = `${dbPrefix}_${defaultCollectionName}`;
  }
  
  return compileModelOnConnection(conn, modelName, schema, collectionName);
}

/**
 * Creates a Proxy over a Mongoose model that dynamically forwards operations 
 * to the tenant-specific model based on the active AsyncLocalStorage context.
 */
export function getTenantModel<T>(
  modelName: string,
  schema: Schema<T>
): Model<T> {
  // Ensure default model is compiled on the default connection
  const defaultModel = mongoose.models[modelName] as Model<T> || mongoose.model<T>(modelName, schema);
  const defaultCollectionName = defaultModel.collection.name;

  return new Proxy(defaultModel, {
    get(target, prop, receiver) {
      // If we are looking for a property and a tenant context is active, delegate to the tenant-specific model.
      const store = tenantStorage.getStore();
      if (!store) {
        return Reflect.get(target, prop, receiver);
      }

      const tenantModel = getModelForTenant(
        store.dbPrefix,
        store.isolationStrategy,
        modelName,
        schema,
        defaultCollectionName
      );
      
      const value = Reflect.get(tenantModel, prop);
      if (typeof value === 'function') {
        return value.bind(tenantModel);
      }
      return value;
    },
    
    construct(target, args, newTarget) {
      const store = tenantStorage.getStore();
      if (!store) {
        return Reflect.construct(target, args, newTarget);
      }

      const tenantModel = getModelForTenant(
        store.dbPrefix,
        store.isolationStrategy,
        modelName,
        schema,
        defaultCollectionName
      );
      return Reflect.construct(tenantModel as unknown as new (...args: unknown[]) => unknown, args, newTarget);
    }
  }) as unknown as Model<T>;
}

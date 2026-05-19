import mongoose, { Connection } from 'mongoose';

const MONGODB_LOGS_URI = process.env.MONGODB_LOGS_URI || '';

if (!MONGODB_LOGS_URI) {
  throw new Error(
    'Please define the MONGODB_LOGS_URI environment variable inside .env.local'
  );
}

interface MongooseLogsCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

const cached: MongooseLogsCache = (global as { mongooseLogs?: MongooseLogsCache }).mongooseLogs || { conn: null, promise: null };

if (!(global as { mongooseLogs?: MongooseLogsCache }).mongooseLogs) {
  (global as { mongooseLogs?: MongooseLogsCache }).mongooseLogs = cached;
}

export async function connectLogsDB(): Promise<Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: 'ABDElevators-Logs', // ⚡ Estandarizar conexión a la BD centralizada de Logs
    };

    // Usar mongoose.createConnection para evitar colisiones con la conexión por defecto
    cached.promise = Promise.resolve(mongoose.createConnection(MONGODB_LOGS_URI, opts));
    console.log('✅ Secondary Mongoose connected successfully to ABDElevators-Logs');
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

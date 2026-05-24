import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@/lib/session';
import mongoose from 'mongoose';

export const revalidate = 0; // Evitar el cacheado estático de la API

const globalWithMongoose = global as typeof globalThis & {
  authConnPromise?: Promise<mongoose.Connection>;
};

const TenantSchema = new mongoose.Schema({ tenantId: String, name: String, active: Boolean }, { collection: 'tenants' });

async function getAuthConnection() {
  if (globalWithMongoose.authConnPromise) {
    return globalWithMongoose.authConnPromise;
  }
  
  const authUri = process.env.MONGODB_AUTH_URI;
  if (!authUri) throw new Error("MONGODB_AUTH_URI no definido");
  
  const fullUri = authUri.endsWith('/') 
    ? `${authUri}ABDElevators-Auth?retryWrites=true&w=majority`
    : `${authUri}/ABDElevators-Auth?retryWrites=true&w=majority`;
    
  globalWithMongoose.authConnPromise = mongoose.createConnection(fullUri, { maxPoolSize: 5 }).asPromise();
  return globalWithMongoose.authConnPromise;
}

export async function GET() {
  try {
    // 🛡️ Verificar acceso con rol mínimo ADMIN
    const user = await ensureIndustrialAccess('ADMIN');
    
    // Solo SUPER_ADMIN puede ver todos los tenants
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const conn = await getAuthConnection();
    const TenantModel = conn.models.Tenant || conn.model('Tenant', TenantSchema);
    
    const rawTenants = await TenantModel.find().lean();
    const tenants = (rawTenants as unknown as { tenantId: string; name?: string; active?: boolean }[]).map((t) => ({
      tenantId: t.tenantId,
      name: t.name || t.tenantId,
      active: t.active !== false,
    }));

    return NextResponse.json(tenants);
  } catch (error: unknown) {
    console.error('[API_GET_TENANTS_ERROR]', error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';

export async function POST(request: NextRequest) {
  // 🛡️ Seguridad Inter-servicio
  const authHeader = request.headers.get('Authorization');
  const systemToken = process.env.LOGS_SECRET_TOKEN || 'shared-system-token-2026';

  if (!authHeader || authHeader !== `Bearer ${systemToken}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED_SERVICE_REQUEST' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await connectToDatabase();
    
    const newLog = await AuditLog.create(body);
    return NextResponse.json({ success: true, id: newLog._id }, { status: 201 });
  } catch (error) {
    console.error('[INGEST_LOG_ERROR]', error);
    return NextResponse.json({ error: 'FAILED_TO_INGEST_LOG' }, { status: 500 });
  }
}

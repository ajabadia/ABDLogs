import { Schema, models, model } from 'mongoose';
import { getTenantModel } from '../lib/database/tenant-model';

export interface IAuditLog {
  appId: string;                        // Aplicación origen: 'auth', 'quiz', 'gobernanza'
  tenantId: string;                     // ID de la organización o 'SYSTEM' para operaciones globales
  action: string;                       // Ej: 'USER_LOGIN', 'SSO_HANDSHAKE_GRANTED', 'EXAM_CREATED'
  entityType: 'USER' | 'TENANT' | 'SSO' | 'EXAM' | 'CONFIG' | 'SYSTEM' | 'SPACE' | 'BRANDING';
  entityId: string;                     // ID de la entidad afectada
  userId: string;                       // ID del operador (actor)
  userEmail: string;                    // Email del operador
  changedFields: Record<string, unknown>; // Metadatos dinámicos del evento
  previousState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  previousHash?: string;                // Enlace inmutable al bloque de auditoría anterior
  hash?: string;                        // Sello criptográfico SHA-256 de este bloque
}

const AuditLogSchema = new Schema<IAuditLog>({
  appId: { type: String, required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  changedFields: { type: Schema.Types.Mixed, default: {} },
  previousState: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
  previousHash: { type: String, index: true },
  hash: { type: String, index: true },
});

// Índice compuesto para telemetría rápida por organización y tiempo
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });

export const AuditLog = models.AuditLog || model<IAuditLog>('AuditLog', AuditLogSchema, 'central_audit_logs');

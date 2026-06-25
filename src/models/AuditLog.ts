/**
 * @purpose Gestiona el esquema y modelo para registros de auditoria en una base de datos MongoDB, incluyendo campos para detalles de aplicación, acciones de usuario, información de entidad y metadatos.
 * @purpose_en Defines the schema and model for audit logs in a MongoDB database, including fields for application details, user actions, entity information, and metadata.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:1kz9dsl
 * @lastUpdated 2026-06-24T10:31:29.109Z
 */

import { Schema, models, model } from 'mongoose';
import { getTenantModel } from '@ajabadia/satellite-sdk/db';

export interface IAuditLog {
  appId: string;                        // Aplicación origen: 'auth', 'quiz', 'gobernanza'
  tenantId: string;                     // ID de la organización o 'SYSTEM' para operaciones globales
  action: string;                       // Ej: 'USER_LOGIN', 'SSO_HANDSHAKE_GRANTED', 'EXAM_CREATED'
  entityType: 'USER' | 'TENANT' | 'SSO' | 'EXAM' | 'CONFIG' | 'SYSTEM' | 'SPACE' | 'BRANDING' | 'COURSE' | 'ASSIGNMENT';
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

// Índice único para evitar colisiones/bifurcaciones en la cadena criptográfica
// Permite que logs antiguos (sin previousHash) sigan existiendo sin chocar, pero fuerza unicidad si existe
AuditLogSchema.index(
  { tenantId: 1, previousHash: 1 }, 
  { unique: true, partialFilterExpression: { previousHash: { $exists: true, $type: "string" } } }
);

export const AuditLog = models.AuditLog || model<IAuditLog>('AuditLog', AuditLogSchema, 'central_audit_logs');

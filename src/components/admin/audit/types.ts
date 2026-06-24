/**
 * @purpose Gestiona la estructura para registros de auditoría.
 * @purpose_en Defines the structure for audit log entries.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:1,imports:0,sig:8g8ljh
 * @lastUpdated 2026-06-22T06:32:01.751Z
 */

export interface AuditLog {
  _id?: string;
  appId: string;
  tenantId: string;
  action: string;
  entityType: 'USER' | 'TENANT' | 'SSO' | 'EXAM' | 'CONFIG' | 'SYSTEM';
  entityId: string;
  userId: string;
  userEmail: string;
  changedFields: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
}

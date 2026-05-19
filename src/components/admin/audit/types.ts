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

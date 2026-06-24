/**
 * @purpose Gestiona el modelo de datos y la estructura de la base de datos para registros anormales utilizando Mongoose, incluyendo campos como tenantId, tipo, gravedad, estado y fechas.
 * @purpose_en Defines the data model and schema for anomaly records using Mongoose, including fields like tenantId, type, severity, status, and timestamps.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:5,imports:1,sig:pdqwmx
 * @lastUpdated 2026-06-22T06:33:44.860Z
 */

import { Schema, models, model } from 'mongoose';

export type AnomalyType = 'BRUTE_FORCE' | 'MASS_DELETION' | 'OFF_HOURS' | 'NEW_IP';
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AnomalyStatus = 'OPEN' | 'DISMISSED' | 'RESOLVED';

export interface IAnomalyRecord {
  _id?: string;
  tenantId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  userId?: string;
  ipAddress?: string;
  appId?: string;
  description: string;
  count: number;
  detectedAt: Date;
  dismissedAt?: Date;
  resolvedAt?: Date;
  relatedLogIds: string[];
}

const AnomalyRecordSchema = new Schema<IAnomalyRecord>({
  tenantId:      { type: String, required: true, index: true },
  type:          { type: String, enum: ['BRUTE_FORCE', 'MASS_DELETION', 'OFF_HOURS', 'NEW_IP'], required: true },
  severity:      { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
  status:        { type: String, enum: ['OPEN', 'DISMISSED', 'RESOLVED'], default: 'OPEN' },
  userId:        { type: String },
  ipAddress:     { type: String },
  appId:         { type: String },
  description:   { type: String, required: true },
  count:         { type: Number, required: true },
  detectedAt:    { type: Date, default: Date.now, index: true },
  dismissedAt:   { type: Date },
  resolvedAt:    { type: Date },
  relatedLogIds: [{ type: String }],
});

// Compound indexes for efficient querying
AnomalyRecordSchema.index({ tenantId: 1, status: 1, detectedAt: -1 });
AnomalyRecordSchema.index({ tenantId: 1, type: 1, detectedAt: -1 });

// Cooldown deduplication: avoid re-creating the same anomaly within 30 min
AnomalyRecordSchema.index(
  { tenantId: 1, type: 1, userId: 1, ipAddress: 1, detectedAt: 1 },
  {
    partialFilterExpression: { status: 'OPEN' },
    name: 'anomaly_cooldown_idx',
  }
);

export const AnomalyRecord = models.AnomalyRecord || model<IAnomalyRecord>('AnomalyRecord', AnomalyRecordSchema);

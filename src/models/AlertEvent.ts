/**
 * @purpose Gestiona un esquema y modelo de Mongoose para eventos de alerta, incluyendo propiedades como tenantId, thresholdId, severidad, estado, mensaje y fechas.
 * @purpose_en Defines a Mongoose schema and model for alert events, including properties like tenantId, thresholdId, severity, status, message, and timestamps.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:3,imports:2,sig:1vygxc8
 * @lastUpdated 2026-06-22T06:33:33.047Z
 */

import { Schema, models, model } from 'mongoose';
import type { AlertSeverity } from './AlertThreshold';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface IAlertEvent {
  _id?: string;
  tenantId: string;
  thresholdId: string;           // Reference to the AlertThreshold that triggered
  thresholdName: string;         // Denormalized name for quick display
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;               // Human-readable alert message
  appId?: string;                // The app that triggered the alert
  matchCount: number;            // How many matching logs in the window
  windowMinutes: number;         // The evaluation window
  matchingLogIds: string[];      // References to the logs that matched
  metadata?: Record<string, unknown>;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

const AlertEventSchema = new Schema<IAlertEvent>({
  tenantId: { type: String, required: true, index: true },
  thresholdId: { type: String, required: true, index: true },
  thresholdName: { type: String, required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], required: true },
  status: { type: String, enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'], default: 'ACTIVE' },
  message: { type: String, required: true },
  appId: { type: String },
  matchCount: { type: Number, required: true },
  windowMinutes: { type: Number, required: true },
  matchingLogIds: [{ type: String }],
  metadata: { type: Schema.Types.Mixed },
  acknowledgedBy: { type: String },
  acknowledgedAt: { type: Date },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
});

AlertEventSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
AlertEventSchema.index({ tenantId: 1, severity: 1, createdAt: -1 });

export const AlertEvent = models.AlertEvent || model<IAlertEvent>('AlertEvent', AlertEventSchema);

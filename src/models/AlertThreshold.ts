/**
 * @purpose Gestiona un esquema de Mongoose y modelo para los umbrales de alertas en la aplicación ABDSLogs.
 * @purpose_en Defines a Mongoose schema and model for alert thresholds in the ABDSLogs application.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:4,imports:1,sig:hh7kth
 * @lastUpdated 2026-06-22T06:33:37.947Z
 */

import { Schema, models, model } from 'mongoose';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type ThresholdOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';

export interface IAlertThreshold {
  _id?: string | { toString(): string };
  tenantId: string;
  name: string;
  description?: string;
  enabled: boolean;
  appId?: string;                     // Optional: filter by source app
  field: string;                      // The log field to watch (e.g., 'action', 'entityType', 'userId')
  operator: ThresholdOperator;        // Comparison operator
  value: string;                      // Value to compare against
  windowMinutes: number;              // Time window for counting occurrences
  threshold: number;                  // How many occurrences trigger the alert
  severity: AlertSeverity;
  cooldownMinutes: number;            // Min time between repeated alerts
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AlertThresholdSchema = new Schema<IAlertThreshold>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  enabled: { type: Boolean, default: true },
  appId: { type: String },
  field: { type: String, required: true },
  operator: { type: String, enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'], required: true },
  value: { type: String, required: true },
  windowMinutes: { type: Number, required: true, default: 5 },
  threshold: { type: Number, required: true, default: 10 },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'WARNING' },
  cooldownMinutes: { type: Number, default: 15 },
  lastTriggeredAt: { type: Date },
}, { timestamps: true });

AlertThresholdSchema.index({ tenantId: 1, enabled: 1 });
AlertThresholdSchema.index({ tenantId: 1, field: 1, value: 1 });

export const AlertThreshold = models.AlertThreshold || model<IAlertThreshold>('AlertThreshold', AlertThresholdSchema);

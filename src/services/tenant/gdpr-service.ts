/**
 * @purpose Gestiona cumplimiento de GDPR para exportar y anonimizar datos de inquilinos.
 * @purpose_en Manages GDPR compliance data export and anonymization for tenants.
 * @refactorable true (contains multiple distinct functionalities)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:10b50pz
 * @lastUpdated 2026-06-26T10:00:30.149Z
 */

import crypto from 'crypto';
import AdmZip from 'adm-zip';
import { AuditLog } from '../../models/AuditLog';
import { AlertEvent } from '../../models/AlertEvent';
import { AlertThreshold } from '../../models/AlertThreshold';
import { AnomalyRecord } from '../../models/AnomalyRecord';

export class GDPRService {
  /**
   * Generates a full data export for a tenant as a ZIP buffer.
   * If a password is provided, the inner JSON is encrypted using AES-256-CBC.
   */
  static async exportTenantData(tenantId: string, password?: string): Promise<Buffer> {
    // 1. Fetch all tenant compliance assets
    const logs = await AuditLog.find({ tenantId }).sort({ createdAt: -1 });
    const alerts = await AlertEvent.find({ tenantId }).sort({ createdAt: -1 });
    const thresholds = await AlertThreshold.find({ tenantId }).sort({ createdAt: -1 });

    const exportPayload = {
      tenantId,
      exportedAt: new Date().toISOString(),
      logs,
      alerts,
      thresholds,
    };

    const payloadString = JSON.stringify(exportPayload, null, 2);
    const zip = new AdmZip();

    if (password && password.trim().length > 0) {
      // 2. Encrypt with AES-256-CBC
      const key = crypto.createHash('sha256').update(password).digest();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(payloadString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const encryptedPayload = {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
      };

      zip.addFile(
        'tenant_data.enc',
        Buffer.from(JSON.stringify(encryptedPayload, null, 2))
      );

      const readme = `ABDLogs GDPR Compliance Data Export (ENCRYPTED)
==============================================
Tenant ID: ${tenantId}
Export Date: ${new Date().toISOString()}

This archive contains sensitive audit and telemetry data encrypted with AES-256-CBC.

How to decrypt this file:
Use the following Node.js script to extract your JSON dump:

\`\`\`javascript
const crypto = require('crypto');
const fs = require('fs');

const password = 'YOUR_PASSWORD';
const rawEncrypted = JSON.parse(fs.readFileSync('tenant_data.enc', 'utf8'));

const key = crypto.createHash('sha256').update(password).digest();
const iv = Buffer.from(rawEncrypted.iv, 'hex');
const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

let decrypted = decipher.update(rawEncrypted.encryptedData, 'hex', 'utf8');
decrypted += decipher.final('utf8');

fs.writeFileSync('tenant_data.json', decrypted, 'utf8');
console.log('Decryption operation completed successfully');
\`\`\`
`;
      zip.addFile('README.txt', Buffer.from(readme));
    } else {
      // Unencrypted export
      zip.addFile('tenant_data.json', Buffer.from(payloadString));
      const readme = `ABDLogs GDPR Compliance Data Export (UNENCRYPTED)
================================================
Tenant ID: ${tenantId}
Export Date: ${new Date().toISOString()}

Contents:
- tenant_data.json: contains logs, alerts, and thresholds in plain text.
`;
      zip.addFile('README.txt', Buffer.from(readme));
    }

    return zip.toBuffer();
  }

  /**
   * Generates a per-user data export for GDPR portability.
   */
  static async exportUserData(tenantId: string, userId: string, email?: string): Promise<Buffer> {
    const query: Record<string, unknown> = { tenantId };
    if (email) {
      query.$or = [{ userId }, { userEmail: email }];
    } else {
      query.userId = userId;
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).lean();
    const alerts = await AlertEvent.find({ tenantId, $or: [{ userId }, { triggeredBy: userId }] }).sort({ createdAt: -1 }).lean();
    const anomalies = await AnomalyRecord.find({ tenantId, userId }).sort({ createdAt: -1 }).lean();

    const exportPayload = {
      tenantId,
      userId,
      exportedAt: new Date().toISOString(),
      logs,
      alerts,
      anomalies,
    };

    const payloadString = JSON.stringify(exportPayload, null, 2);
    const zip = new AdmZip();
    zip.addFile('user_data.json', Buffer.from(payloadString));
    zip.addFile('README.txt', Buffer.from([
      'ABDLogs GDPR Data Export',
      '==============================================',
      `Tenant ID: ${tenantId}`,
      `User ID: ${userId}`,
      `Export Date: ${new Date().toISOString()}`,
      '',
      'Contents:',
      '- user_data.json: audit logs, alerts, and anomaly records related to this user.',
      '',
      'This file contains your personal data as stored in the ABDLogs system.',
    ].join('\n')));

    return zip.toBuffer();
  }

  /**
   * Anonymizes operator identifiers (userId, userEmail, ipAddress) in logs to satisfy the GDPR Right to be Forgotten.
   * This retains the log entry and keeps hashes intact for cryptographically chained audit logs (SOC2).
   */
  static async anonymizeLogs(
    tenantId: string,
    targetUser: string,
    targetIp?: string
  ): Promise<{ affectedCount: number }> {
    const query: Record<string, unknown> = { tenantId };

    if (targetUser && targetIp) {
      query.$or = [
        { userId: targetUser },
        { userEmail: targetUser },
        { ipAddress: targetIp }
      ];
    } else if (targetUser) {
      query.$or = [
        { userId: targetUser },
        { userEmail: targetUser }
      ];
    } else if (targetIp) {
      query.ipAddress = targetIp;
    } else {
      throw new Error('At least user identifier or IP address must be provided for erasure');
    }

    const result = await AuditLog.updateMany(query, {
      $set: {
        userId: '[GDPR_ERASED]',
        userEmail: '[GDPR_ERASED]',
        ipAddress: '[GDPR_ERASED]'
      }
    });

    return { affectedCount: result.modifiedCount };
  }
}

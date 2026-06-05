import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import { GDPRService } from './gdpr-service';
import { AuditLog } from '../../models/AuditLog';
import { AlertEvent } from '../../models/AlertEvent';
import { AlertThreshold } from '../../models/AlertThreshold';

vi.mock('../../models/AuditLog', () => ({
  AuditLog: {
    find: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../../models/AlertEvent', () => ({
  AlertEvent: {
    find: vi.fn(),
  },
}));

vi.mock('../../models/AlertThreshold', () => ({
  AlertThreshold: {
    find: vi.fn(),
  },
}));

describe('GDPRService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportTenantData', () => {
    it('should generate an unencrypted ZIP when no password is provided', async () => {
      const mockLogs = [{ userId: 'user-1', tenantId: 'tenant-1', action: 'LOGIN' }];
      const mockAlerts = [{ tenantId: 'tenant-1', message: 'CPU high' }];
      const mockThresholds = [{ tenantId: 'tenant-1', name: 'Threshold 1' }];

      const mockLogsSort = vi.fn().mockResolvedValue(mockLogs);
      const mockAlertsSort = vi.fn().mockResolvedValue(mockAlerts);
      const mockThresholdsSort = vi.fn().mockResolvedValue(mockThresholds);

      vi.spyOn(AuditLog, 'find').mockReturnValue({ sort: mockLogsSort } as unknown as ReturnType<typeof AuditLog.find>);
      vi.spyOn(AlertEvent, 'find').mockReturnValue({ sort: mockAlertsSort } as unknown as ReturnType<typeof AlertEvent.find>);
      vi.spyOn(AlertThreshold, 'find').mockReturnValue({ sort: mockThresholdsSort } as unknown as ReturnType<typeof AlertThreshold.find>);

      const buffer = await GDPRService.exportTenantData('tenant-1');
      expect(buffer).toBeInstanceOf(Buffer);

      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();
      
      const fileNames = zipEntries.map(e => e.entryName);
      expect(fileNames).toContain('tenant_data.json');
      expect(fileNames).toContain('README.txt');

      const dataJson = JSON.parse(zip.readAsText('tenant_data.json'));
      expect(dataJson.tenantId).toBe('tenant-1');
      expect(dataJson.logs).toHaveLength(1);
      expect(dataJson.alerts).toHaveLength(1);
      expect(dataJson.thresholds).toHaveLength(1);
    });

    it('should generate an encrypted ZIP with AES-256-CBC when a password is provided', async () => {
      const mockLogs = [{ userId: 'user-1', tenantId: 'tenant-1', action: 'LOGIN' }];
      const mockAlerts: Record<string, unknown>[] = [];
      const mockThresholds: Record<string, unknown>[] = [];

      const mockLogsSort = vi.fn().mockResolvedValue(mockLogs);
      const mockAlertsSort = vi.fn().mockResolvedValue(mockAlerts);
      const mockThresholdsSort = vi.fn().mockResolvedValue(mockThresholds);

      vi.spyOn(AuditLog, 'find').mockReturnValue({ sort: mockLogsSort } as unknown as ReturnType<typeof AuditLog.find>);
      vi.spyOn(AlertEvent, 'find').mockReturnValue({ sort: mockAlertsSort } as unknown as ReturnType<typeof AlertEvent.find>);
      vi.spyOn(AlertThreshold, 'find').mockReturnValue({ sort: mockThresholdsSort } as unknown as ReturnType<typeof AlertThreshold.find>);

      const password = 'super-secret-password';
      const buffer = await GDPRService.exportTenantData('tenant-1', password);
      
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();
      const fileNames = zipEntries.map(e => e.entryName);

      expect(fileNames).toContain('tenant_data.enc');
      expect(fileNames).toContain('README.txt');

      // Test manual decryption to verify encryption works correctly
      const encText = zip.readAsText('tenant_data.enc');
      const parsedEnc = JSON.parse(encText);
      expect(parsedEnc.iv).toBeDefined();
      expect(parsedEnc.encryptedData).toBeDefined();

      const key = crypto.createHash('sha256').update(password).digest();
      const iv = Buffer.from(parsedEnc.iv, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

      let decrypted = decipher.update(parsedEnc.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const decryptedJson = JSON.parse(decrypted);
      expect(decryptedJson.tenantId).toBe('tenant-1');
      expect(decryptedJson.logs[0].userId).toBe('user-1');
    });
  });

  describe('anonymizeLogs', () => {
    it('should anonymize logs based on target user', async () => {
      vi.spyOn(AuditLog, 'updateMany').mockResolvedValue({ modifiedCount: 5 } as unknown as Awaited<ReturnType<typeof AuditLog.updateMany>>);

      const result = await GDPRService.anonymizeLogs('tenant-1', 'operator-xyz');
      expect(result.affectedCount).toBe(5);
      expect(AuditLog.updateMany).toHaveBeenCalledWith(
        {
          tenantId: 'tenant-1',
          $or: [
            { userId: 'operator-xyz' },
            { userEmail: 'operator-xyz' }
          ]
        },
        {
          $set: {
            userId: '[GDPR_ERASED]',
            userEmail: '[GDPR_ERASED]',
            ipAddress: '[GDPR_ERASED]'
          }
        }
      );
    });

    it('should anonymize logs based on target IP', async () => {
      vi.spyOn(AuditLog, 'updateMany').mockResolvedValue({ modifiedCount: 2 } as unknown as Awaited<ReturnType<typeof AuditLog.updateMany>>);

      const result = await GDPRService.anonymizeLogs('tenant-1', '', '1.1.1.1');
      expect(result.affectedCount).toBe(2);
      expect(AuditLog.updateMany).toHaveBeenCalledWith(
        {
          tenantId: 'tenant-1',
          ipAddress: '1.1.1.1'
        },
        {
          $set: {
            userId: '[GDPR_ERASED]',
            userEmail: '[GDPR_ERASED]',
            ipAddress: '[GDPR_ERASED]'
          }
        }
      );
    });
  });
});

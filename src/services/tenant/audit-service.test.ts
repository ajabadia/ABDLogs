import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.MONGODB_URI = 'mongodb://test:27017/test';
  process.env.LOGS_SECRET_TOKEN = 'test-token';
  process.env.LOGS_SERVICE_URL = 'http://localhost:5003/api/logs';
});

vi.mock('@ajabadia/satellite-sdk/db', async () => ({
  connectDB: vi.fn(async () => {}),
}));

vi.mock('@ajabadia/satellite-sdk/utils', async () => {
  const crypto = await import('crypto');
  const stringify = (await import('fast-json-stable-stringify')).default;
  return {
    computeBlockHash: vi.fn((payload, previousHash, timestamp) => {
      const payloadString = stringify(payload);
      const entropy = timestamp
        ? `${previousHash}${payloadString}${timestamp}`
        : `${previousHash}${payloadString}`;
      return crypto.createHash('sha256').update(entropy).digest('hex');
    }),
  };
});

import { AuditService } from './audit-service';
import { computeBlockHash } from '@ajabadia/satellite-sdk/utils';

// Helper type for mocked Mongoose query chain
type MockQuery = { sort: ReturnType<typeof vi.fn> };

// Mock Mongoose AuditLog model by declaring helper classes and mocks inside the factory.
// This prevents hoisting reference errors by initializing mocks at factory instantiation time.
vi.mock('@/models/AuditLog', () => {
  const mockFind = vi.fn();
  const mockFindOne = vi.fn();
  const mockSave = vi.fn();

  class MockAuditLogDoc {
    createdAt: Date;
    hash?: string;
    previousHash?: string;
    action: string;
    tenantId: string;
    save = mockSave;

    constructor(data: Record<string, unknown>) {
      this.createdAt = (data.createdAt as Date) || new Date();
      this.hash = data.hash as string | undefined;
      this.previousHash = data.previousHash as string | undefined;
      this.action = (data.action as string) || 'TEST_ACTION';
      this.tenantId = (data.tenantId as string) || 'SYSTEM';
      Object.assign(this, data);
    }

    toObject() {
      const obj = { ...this };
      delete (obj as Record<string, unknown>).save;
      delete (obj as Record<string, unknown>).toObject;
      return obj;
    }
  }

  class MockAuditLog extends MockAuditLogDoc {
    static find = mockFind;
    static findOne = mockFindOne;
  }

  return {
    AuditLog: MockAuditLog,
    mockFind,
    mockFindOne,
    mockSave,
  };
});

// Import the mocked module and extract the runtime mock references
import * as mockMod from '@/models/AuditLog';
const { AuditLog, mockFind, mockFindOne, mockSave } = mockMod as unknown as {
  AuditLog: new (data: Record<string, unknown>) => {
    createdAt: Date;
    hash?: string;
    previousHash?: string;
    action: string;
    tenantId: string;
    save: ReturnType<typeof vi.fn>;
    toObject(): Record<string, unknown>;
  };
  mockFind: ReturnType<typeof vi.fn>;
  mockFindOne: ReturnType<typeof vi.fn>;
  mockSave: ReturnType<typeof vi.fn>;
};

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyTenantChain', () => {
    it('should return isValid: true when there are no logs for a tenant', async () => {
      const mockSort = vi.fn().mockResolvedValue([]);
      mockFind.mockReturnValue({ sort: mockSort } as unknown as MockQuery);

      const result = await AuditService.verifyTenantChain('tenant-empty');

      expect(result).toEqual({
        isValid: true,
        invalidLogsCount: 0,
        errorDetails: [],
      });
      expect(mockFind).toHaveBeenCalledWith({ tenantId: 'tenant-empty' });
    });

    it('should return isValid: true for a valid cryptographically chained sequence', async () => {
      const tenantId = 't1';
      const createdAt1 = new Date(1716500000000);
      const createdAt2 = new Date(1716501000000);

      // Genesis Block
      const doc1 = new AuditLog({
        tenantId,
        action: 'ACTION_1',
        appId: 'app',
        createdAt: createdAt1,
        previousHash: `GENESIS_BLOCK_${tenantId}`,
      });
      const obj1 = doc1.toObject();
      const { hash: _h1, previousHash: _ph1, _id: _id1, __v: _v1, createdAt: _c1, ...cleanPayload1 } = obj1;
      doc1.hash = computeBlockHash(cleanPayload1, doc1.previousHash!, createdAt1.getTime());

      // Second Block
      const doc2 = new AuditLog({
        tenantId,
        action: 'ACTION_2',
        appId: 'app',
        createdAt: createdAt2,
        previousHash: doc1.hash,
      });
      const obj2 = doc2.toObject();
      const { hash: _h2, previousHash: _ph2, _id: _id2, __v: _v2, createdAt: _c2, ...cleanPayload2 } = obj2;
      doc2.hash = computeBlockHash(cleanPayload2, doc2.previousHash!, createdAt2.getTime());

      const mockSort = vi.fn().mockResolvedValue([doc1, doc2]);
      mockFind.mockReturnValue({ sort: mockSort } as unknown as MockQuery);

      const result = await AuditService.verifyTenantChain(tenantId);

      expect(result.isValid).toBe(true);
      expect(result.invalidLogsCount).toBe(0);
      expect(result.errorDetails).toHaveLength(0);
    });

    it('should detect a broken chain when previousHash does not match the preceding block hash', async () => {
      const tenantId = 't1';
      const createdAt1 = new Date(1716500000000);
      const createdAt2 = new Date(1716501000000);

      const doc1 = new AuditLog({
        tenantId,
        action: 'ACTION_1',
        appId: 'app',
        createdAt: createdAt1,
        previousHash: `GENESIS_BLOCK_${tenantId}`,
      });
      const obj1 = doc1.toObject();
      const { hash: _h1, previousHash: _ph1, _id: _id1, __v: _v1, createdAt: _c1, ...cleanPayload1 } = obj1;
      doc1.hash = computeBlockHash(cleanPayload1, doc1.previousHash!, createdAt1.getTime());

      const doc2 = new AuditLog({
        tenantId,
        action: 'ACTION_2',
        appId: 'app',
        createdAt: createdAt2,
        previousHash: 'mismatched_prev_hash', // Broken!
      });
      const obj2 = doc2.toObject();
      const { hash: _h2, previousHash: _ph2, _id: _id2, __v: _v2, createdAt: _c2, ...cleanPayload2 } = obj2;
      doc2.hash = computeBlockHash(cleanPayload2, doc2.previousHash!, createdAt2.getTime());

      const mockSort = vi.fn().mockResolvedValue([doc1, doc2]);
      mockFind.mockReturnValue({ sort: mockSort } as unknown as MockQuery);

      const result = await AuditService.verifyTenantChain(tenantId);

      expect(result.isValid).toBe(false);
      expect(result.invalidLogsCount).toBe(1);
      expect(result.errorDetails[0]).toContain('Chain broken at');
    });

    it('should detect when data in a block has been tampered with', async () => {
      const tenantId = 't1';
      const createdAt = new Date(1716500000000);
      const doc = new AuditLog({
        tenantId,
        action: 'ORIGINAL_ACTION',
        appId: 'app',
        createdAt,
        previousHash: `GENESIS_BLOCK_${tenantId}`,
      });
      const obj = doc.toObject();
      const { hash: _h, previousHash: _ph, _id, __v, createdAt: _c, ...cleanPayload } = obj;
      doc.hash = computeBlockHash(cleanPayload, doc.previousHash!, createdAt.getTime());

      // Tamper with the document properties after hash was calculated
      doc.action = 'TAMPERED_ACTION';

      const mockSort = vi.fn().mockResolvedValue([doc]);
      mockFind.mockReturnValue({ sort: mockSort } as unknown as MockQuery);

      const result = await AuditService.verifyTenantChain(tenantId);

      expect(result.isValid).toBe(false);
      expect(result.invalidLogsCount).toBe(1);
      expect(result.errorDetails[0]).toContain('Data has been tampered with.');
    });
  });

  describe('logEvent', () => {
    it('should create genesis block if no prior logs exist', async () => {
      const tenantId = 'tenant-new';
      const eventParams = { tenantId, action: 'INITIAL_EVENT', appId: 'app' };

      const mockSort = vi.fn().mockResolvedValue(null);
      mockFindOne.mockReturnValue({ sort: mockSort } as unknown as MockQuery);
      mockSave.mockResolvedValue({});

      await AuditService.logEvent(eventParams);

      expect(mockFindOne).toHaveBeenCalledWith({ tenantId });
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should chain correctly using the hash of the last log as previousHash', async () => {
      const tenantId = 'tenant-active';
      const eventParams = { tenantId, action: 'NEW_EVENT', appId: 'app' };

      const lastLogDoc = new AuditLog({
        tenantId,
        action: 'PRIOR_EVENT',
        hash: 'last_stored_hash_xyz',
      });

      const mockSort = vi.fn().mockResolvedValue(lastLogDoc);
      mockFindOne.mockReturnValue({ sort: mockSort } as unknown as MockQuery);
      mockSave.mockResolvedValue({});

      await AuditService.logEvent(eventParams);

      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should retry insertion upon unique constraint collision error (code 11000)', async () => {
      const tenantId = 'tenant-retry';
      const eventParams = { tenantId, action: 'COLLISION_EVENT', appId: 'app' };

      const mockSort = vi.fn().mockResolvedValue(null);
      mockFindOne.mockReturnValue({ sort: mockSort } as unknown as MockQuery);

      const mongoError = new Error('Unique constraint collision');
      Object.assign(mongoError, { code: 11000 });
      mockSave
        .mockRejectedValueOnce(mongoError)
        .mockResolvedValueOnce({});

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await AuditService.logEvent(eventParams);

      expect(mockSave).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Hash collision detected for tenant tenant-retry')
      );

      warnSpy.mockRestore();
    });
  });
});

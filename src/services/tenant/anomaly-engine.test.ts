import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnomalyEngine } from './anomaly-engine';
import { AuditLog } from '../../models/AuditLog';
import { AnomalyRecord } from '../../models/AnomalyRecord';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@ajabadia/satellite-sdk/db', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../models/AuditLog', () => ({
  AuditLog: {
    aggregate: vi.fn(),
    find: vi.fn(),
    distinct: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../models/AnomalyRecord', () => ({
  AnomalyRecord: {
    find: vi.fn(),
    findOne: vi.fn(),
    insertMany: vi.fn(),
    updateOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TENANT = 'tenant-test';

const makeLeanChain = (results: unknown[]) => {
  const chain = {
    sort: vi.fn().mockImplementation(() => chain),
    limit: vi.fn().mockImplementation(() => chain),
    select: vi.fn().mockImplementation(() => chain),
    lean: vi.fn().mockResolvedValue(results),
  };
  return chain;
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AnomalyEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no cooldown-blocking anomaly exists
    vi.mocked(AnomalyRecord.findOne).mockResolvedValue(null);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T02:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── runFullScan ────────────────────────────────────────────────────────────

  describe('runFullScan', () => {
    it('returns empty array when no anomalies are detected', async () => {
      vi.mocked(AuditLog.aggregate).mockResolvedValue([]);
      vi.mocked(AuditLog.find).mockReturnValue(makeLeanChain([]) as unknown as ReturnType<typeof AuditLog.find>);
      vi.mocked(AuditLog.countDocuments).mockResolvedValue(0);

      const result = await AnomalyEngine.runFullScan(TENANT);
      expect(result).toHaveLength(0);
    });

    it('creates AnomalyRecord when brute force is detected', async () => {
      // Simulate actor A has a massive spike above mean+3σ
      vi.mocked(AuditLog.aggregate)
        .mockResolvedValueOnce([
          { _id: { userId: 'hacker', ipAddress: '1.2.3.4' }, count: 20, logIds: ['l1', 'l2'] },
          { _id: { userId: 'user-a', ipAddress: '5.6.7.8' }, count: 1, logIds: ['l3'] },
          { _id: { userId: 'user-b', ipAddress: '9.0.1.2' }, count: 1, logIds: ['l4'] },
          { _id: { userId: 'user-c', ipAddress: '9.0.1.3' }, count: 1, logIds: ['l5'] },
          { _id: { userId: 'user-d', ipAddress: '9.0.1.4' }, count: 1, logIds: ['l6'] },
          { _id: { userId: 'user-e', ipAddress: '9.0.1.5' }, count: 1, logIds: ['l7'] },
          { _id: { userId: 'user-f', ipAddress: '9.0.1.6' }, count: 1, logIds: ['l8'] },
          { _id: { userId: 'user-g', ipAddress: '9.0.1.7' }, count: 1, logIds: ['l9'] },
          { _id: { userId: 'user-h', ipAddress: '9.0.1.8' }, count: 1, logIds: ['l10'] },
          { _id: { userId: 'user-i', ipAddress: '9.0.1.9' }, count: 1, logIds: ['l11'] },
        ])
        // detectMassiveDeletion returns nothing
        .mockResolvedValueOnce([])
      ;

      // detectOffHours & detectNewIp — no logins in current window
      vi.mocked(AuditLog.find).mockReturnValue(makeLeanChain([]) as unknown as ReturnType<typeof AuditLog.find>);
      vi.mocked(AuditLog.countDocuments).mockResolvedValue(0);

      const insertedDoc = {
        _id: { toString: () => 'anomaly-1' },
        toObject: () => ({ _id: { toString: () => 'anomaly-1' }, type: 'BRUTE_FORCE' }),
      };
      vi.mocked(AnomalyRecord.insertMany).mockResolvedValue([insertedDoc] as unknown as Awaited<ReturnType<typeof AnomalyRecord.insertMany>>);

      const result = await AnomalyEngine.runFullScan(TENANT);
      expect(AnomalyRecord.insertMany).toHaveBeenCalledOnce();
      const inserted = vi.mocked(AnomalyRecord.insertMany).mock.calls[0][0] as unknown[];
      expect(inserted).toHaveLength(1);
      expect((inserted[0] as Record<string, unknown>).type).toBe('BRUTE_FORCE');
      expect(result).toHaveLength(1);
    });

    it('respects cooldown — does not re-insert if OPEN anomaly exists within 30 min', async () => {
      vi.mocked(AuditLog.aggregate).mockResolvedValueOnce([
        { _id: { userId: 'hacker', ipAddress: '1.2.3.4' }, count: 50, logIds: ['l1'] },
      ]).mockResolvedValue([]);

      vi.mocked(AuditLog.find).mockReturnValue(makeLeanChain([]) as unknown as ReturnType<typeof AuditLog.find>);
      vi.mocked(AuditLog.countDocuments).mockResolvedValue(0);

      // Cooldown active for this user+ip
      vi.mocked(AnomalyRecord.findOne).mockResolvedValue({
        _id: 'existing',
        status: 'OPEN',
      } as unknown as Awaited<ReturnType<typeof AnomalyRecord.findOne>>);

      const result = await AnomalyEngine.runFullScan(TENANT);
      expect(AnomalyRecord.insertMany).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });

  // ── detectMassiveDeletion ──────────────────────────────────────────────────

  describe('detectMassiveDeletion', () => {
    it('does not flag tenants below the statistical threshold', async () => {
      // Low counts — no spike
      vi.mocked(AuditLog.aggregate)
        .mockResolvedValueOnce([]) // brute force
        .mockResolvedValueOnce([
          { _id: TENANT, count: 3, logIds: ['x1'] },
          { _id: 'other', count: 2, logIds: ['x2'] },
        ]);

      vi.mocked(AuditLog.find).mockReturnValue(makeLeanChain([]) as unknown as ReturnType<typeof AuditLog.find>);
      vi.mocked(AuditLog.countDocuments).mockResolvedValue(0);
      vi.mocked(AnomalyRecord.insertMany).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof AnomalyRecord.insertMany>>);

      const result = await AnomalyEngine.runFullScan(TENANT);
      expect(result).toHaveLength(0);
    });
  });

  // ── detectOffHoursAccess ───────────────────────────────────────────────────

  describe('detectOffHoursAccess', () => {
    it('does not flag off-hours access if the IP is already known', async () => {
      // All detectors return no results
      vi.mocked(AuditLog.aggregate).mockResolvedValue([]);

      vi.mocked(AuditLog.find)
        .mockReturnValueOnce(makeLeanChain([
          { _id: { toString: () => 'log-1' }, userId: 'user-a', ipAddress: '10.0.0.1', appId: 'quiz', tenantId: TENANT },
        ]) as unknown as ReturnType<typeof AuditLog.find>)
        // Second call for newIP detector
        .mockReturnValue(makeLeanChain([]) as unknown as ReturnType<typeof AuditLog.find>);

      // Known IP — returns count > 0
      vi.mocked(AuditLog.distinct).mockResolvedValue(['10.0.0.1']);
      vi.mocked(AuditLog.countDocuments).mockResolvedValue(5);
      vi.mocked(AnomalyRecord.insertMany).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof AnomalyRecord.insertMany>>);

      const result = await AnomalyEngine.runFullScan(TENANT);
      expect(result).toHaveLength(0);
    });
  });

  // ── detectNewIpAnomaly ─────────────────────────────────────────────────────

  describe('detectNewIpAnomaly', () => {
    it('flags new IP login and creates an anomaly record', async () => {
      vi.mocked(AuditLog.aggregate).mockResolvedValue([]);

      // detectOffHours: returns no logins (off-hours window mocked as not active by time)
      // detectNewIp: one login with a brand-new IP
      vi.mocked(AuditLog.find)
        .mockReturnValueOnce(makeLeanChain([]) as unknown as ReturnType<typeof AuditLog.find>) // off-hours
        .mockReturnValueOnce(makeLeanChain([
          { _id: { toString: () => 'log-99' }, userId: 'user-z', ipAddress: '99.99.99.99', appId: 'auth', tenantId: TENANT },
        ]) as unknown as ReturnType<typeof AuditLog.find>); // new IP

      // Historic count = 0 → brand new IP
      vi.mocked(AuditLog.countDocuments).mockResolvedValue(0);

      const insertedDoc = {
        _id: { toString: () => 'anomaly-99' },
        toObject: () => ({ _id: { toString: () => 'anomaly-99' }, type: 'NEW_IP' }),
      };
      vi.mocked(AnomalyRecord.insertMany).mockResolvedValue([insertedDoc] as unknown as Awaited<ReturnType<typeof AnomalyRecord.insertMany>>);

      const result = await AnomalyEngine.runFullScan(TENANT);
      expect(result).toHaveLength(1);
      const firstResult = (result[0] as unknown) as Record<string, unknown>;
      expect(firstResult.type).toBe('NEW_IP');
    });
  });

  // ── getAnomalies ──────────────────────────────────────────────────────────

  describe('getAnomalies', () => {
    it('returns open anomalies for the tenant', async () => {
      const mockRecord = { _id: { toString: () => 'rec-1' }, type: 'BRUTE_FORCE', status: 'OPEN' };
      vi.mocked(AnomalyRecord.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockRecord]),
      } as unknown as ReturnType<typeof AnomalyRecord.find>);

      const result = await AnomalyEngine.getAnomalies(TENANT);
      expect(result).toHaveLength(1);
      expect((result[0] as unknown as Record<string, unknown>).type).toBe('BRUTE_FORCE');
    });
  });

  // ── dismissAnomaly ─────────────────────────────────────────────────────────

  describe('dismissAnomaly', () => {
    it('returns true when the anomaly is dismissed successfully', async () => {
      vi.mocked(AnomalyRecord.updateOne).mockResolvedValue({ modifiedCount: 1 } as unknown as Awaited<ReturnType<typeof AnomalyRecord.updateOne>>);

      const ok = await AnomalyEngine.dismissAnomaly('anomaly-1', TENANT);
      expect(ok).toBe(true);
      expect(AnomalyRecord.updateOne).toHaveBeenCalledWith(
        { _id: 'anomaly-1', tenantId: TENANT },
        expect.objectContaining({ $set: expect.objectContaining({ status: 'DISMISSED' }) })
      );
    });

    it('returns false when the anomaly is not found', async () => {
      vi.mocked(AnomalyRecord.updateOne).mockResolvedValue({ modifiedCount: 0 } as unknown as Awaited<ReturnType<typeof AnomalyRecord.updateOne>>);

      const ok = await AnomalyEngine.dismissAnomaly('not-exist', TENANT);
      expect(ok).toBe(false);
    });
  });

  // ── buildSoc2Report ────────────────────────────────────────────────────────

  describe('buildSoc2Report', () => {
    it('returns a valid SOC2 report structure', async () => {
      vi.mocked(AuditLog.countDocuments).mockResolvedValue(500);
      vi.mocked(AuditLog.aggregate)
        .mockResolvedValueOnce([{ _id: 'auth', count: 300 }, { _id: 'quiz', count: 200 }]) // byAppId
        .mockResolvedValueOnce([{ _id: '10.0.0.1', count: 50 }]); // topIps

      vi.mocked(AuditLog.find).mockReturnValue(makeLeanChain([]) as unknown as ReturnType<typeof AuditLog.find>);
      vi.mocked(AnomalyRecord.countDocuments)
        .mockResolvedValueOnce(3) // open
        .mockResolvedValueOnce(10) // resolved
        .mockResolvedValueOnce(2); // dismissed

      const report = await AnomalyEngine.buildSoc2Report(TENANT, 30);

      expect(report.tenantId).toBe(TENANT);
      expect(report.periodDays).toBe(30);
      expect(report.certification).toBe('SOC2-ERA11-COMPLIANT');
      expect((report.logs as Record<string, unknown>).total).toBe(500);
      expect((report.threats as Record<string, unknown>).open).toBe(3);
      expect((report.threats as Record<string, unknown>).total).toBe(15);
    });
  });
});

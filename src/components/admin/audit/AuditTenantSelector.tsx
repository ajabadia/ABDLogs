'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Database } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TenantInfo {
  tenantId: string;
  name: string;
}

interface AuditTenantSelectorProps {
  currentTenantId: string;
  allTenants: TenantInfo[];
  locale: string;
}

export function AuditTenantSelector({
  currentTenantId,
  allTenants,
  locale,
}: AuditTenantSelectorProps) {
  const router = useRouter();
  const t = useTranslations('admin');

  if (!allTenants || allTenants.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-secondary/20 border border-border rounded-xl max-w-md">
      <label className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-2 font-mono">
        <Database size={12} aria-hidden="true" />
        {t('selectedOrganization')}
      </label>
      <select
        value={currentTenantId}
        onChange={(e) => router.push(`/${locale}/admin/audit?tenantId=${e.target.value}`)}
        className="w-full bg-background border border-border hover:border-primary/40 text-foreground rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer font-bold font-mono"
        aria-label={t('selectedOrganization')}
      >
        {allTenants.map((ten) => (
          <option key={ten.tenantId} value={ten.tenantId} className="bg-card text-foreground">
            {ten.name} ({ten.tenantId})
          </option>
        ))}
      </select>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { TenantSelector as SharedTenantSelector, type TenantOption } from "@abd/ecosystem-widgets";

interface TenantApiResponse {
  tenantId: string;
  name?: string;
  active?: boolean;
}

interface SessionUser {
  id?: string;
  email?: string;
  role?: string;
  tenantId?: string;
}

interface TenantSelectorProps {
  sessionUser?: SessionUser;
}

export function TenantSelector({ sessionUser }: TenantSelectorProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [superAdminTenants, setSuperAdminTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const userRole = sessionUser?.role || "USER";
  const defaultTenantId = sessionUser?.tenantId || "";
  const activeTenantId = searchParams.get("tenantId") || defaultTenantId;

  // Compute tenants list: for non-SUPER_ADMIN users derive it directly without setState
  const tenants = useMemo<TenantOption[]>(() => {
    if (userRole !== 'SUPER_ADMIN') {
      if (!defaultTenantId) return [];
      return [{
        tenantId: defaultTenantId,
        name: defaultTenantId === 'SYSTEM' ? 'Sistema Global' : `Org: ${defaultTenantId}`
      }];
    }
    return superAdminTenants;
  }, [userRole, defaultTenantId, superAdminTenants]);

  // Fetch all tenants only for SUPER_ADMIN
  useEffect(() => {
    if (userRole !== "SUPER_ADMIN") return;

    const fetchAllTenants = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/tenants");
        if (res.ok) {
          const data: TenantApiResponse[] = await res.json();
          const options: TenantOption[] = data.map((t) => ({
            tenantId: t.tenantId,
            name: t.name || t.tenantId,
            active: t.active,
          }));
          setSuperAdminTenants(options);
        }
      } catch (error) {
        console.error("[TENANT_SELECTOR_FETCH_ERROR]", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTenants();
  }, [userRole]);

  const handleTenantChange = (newTenantId: string) => {
    // 1. Set the cookie immediately on client side
    document.cookie = `active_tenant_id=${newTenantId}; path=/; max-age=2592000; SameSite=Lax`;

    // 2. Perform native window navigation to trigger layout rerender and clean context switch
    const current = new URLSearchParams(window.location.search);
    current.set("tenantId", newTenantId);
    const query = current.toString() ? `?${current.toString()}` : "";
    window.location.href = `${window.location.pathname}${query}`;
  };

  if (!sessionUser) return null;

  return (
    <SharedTenantSelector
      activeTenantId={activeTenantId}
      tenants={tenants}
      onTenantChange={handleTenantChange}
      userRole={userRole}
      isLoading={isLoading}
    />
  );
}

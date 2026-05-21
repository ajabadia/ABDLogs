'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { TenantSelector as SharedTenantSelector, type TenantOption } from "@abd/styles";

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

  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const userRole = sessionUser?.role || "USER";
  const defaultTenantId = sessionUser?.tenantId || "";
  const activeTenantId = searchParams.get("tenantId") || defaultTenantId;

  // Fetch tenants if user is SUPER_ADMIN
  useEffect(() => {
    if (userRole !== "SUPER_ADMIN") {
      // Standard admins / users are bound to their single tenant
      if (defaultTenantId) {
        setTenants([{ tenantId: defaultTenantId, name: defaultTenantId === 'SYSTEM' ? 'Sistema Global' : `Org: ${defaultTenantId}` }]);
      }
      return;
    }

    const fetchAllTenants = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/tenants");
        if (res.ok) {
          const data = await res.json();
          // Map API response to TenantOption
          const options: TenantOption[] = data.map((t: any) => ({
            tenantId: t.tenantId,
            name: t.name || t.tenantId,
            active: t.active,
          }));
          setTenants(options);
        }
      } catch (error) {
        console.error("[TENANT_SELECTOR_FETCH_ERROR]", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTenants();
  }, [userRole, defaultTenantId]);

  const handleTenantChange = (newTenantId: string) => {
    // Update tenantId query parameter while preserving existing ones
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("tenantId", newTenantId);
    
    const search = current.toString();
    const query = search ? `?${search}` : "";
    
    router.push(`${pathname}${query}`);
  };

  // If user is not logged in, do not render the selector
  if (!sessionUser) return null;

  return (
    <SharedTenantSelector
      activeTenantId={activeTenantId}
      tenants={tenants}
      onTenantChange={handleTenantChange}
      userRole={userRole}
      isLoading={isLoading}
      translations={{
        title: "Organización",
        searchPlaceholder: "Buscar...",
        noTenantsFound: "Sin resultados",
        activeTenantBadge: "Organización Activa",
        selectTenant: "Seleccionar organización",
      }}
    />
  );
}

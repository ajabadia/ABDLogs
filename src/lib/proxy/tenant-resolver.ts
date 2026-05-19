export interface TenantBrandingTheme {
  primary: string;
  secondary?: string;
  background?: string;
  rounded?: boolean;
  radius?: string;
}

export interface TenantInfo {
  active: boolean;
  tenantId: string;
  name: string;
  dbPrefix: string;
  isolationStrategy: string;
  branding: {
    logoUrl?: string | null;
    theme?: TenantBrandingTheme;
  } | null;
}

/**
 * 🏢 Helper to extract tenant subdomain from host header
 */
export function getTenantSubdomain(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(':')[0].toLowerCase();
  
  // Prevent extracting subdomain if accessing the main base domains
  if (
    hostname === 'abd-tenant-gobernance.vercel.app' || 
    hostname === 'localhost' || 
    hostname === '127.0.0.1'
  ) {
    return null;
  }

  const parts = hostname.split('.');
  
  // Specific handler for Vercel deployment subdomains (e.g., tenant.abd-tenant-gobernance.vercel.app -> parts.length === 4)
  if (hostname.endsWith('.vercel.app')) {
    if (parts.length > 3) {
      return parts[0];
    }
    return null;
  }
  
  // Standard production custom domains (e.g., tenant.abdelevators.com -> parts.length === 3)
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (subdomain === 'www') return null;
    return subdomain;
  }
  
  // Standard local subdomains (e.g., tenant.localhost -> parts.length === 2)
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }
  
  return null;
}

/**
 * 🛰️ Resolves tenant metadata from Central Identity Provider
 */
export async function resolveTenantFromSubdomain(subdomain: string): Promise<TenantInfo | null> {
  try {
    const providerUrl = process.env.AUTH_PROVIDER_URL || 'https://abd-auth.vercel.app';
    const verifyTenantUrl = `${providerUrl}/api/auth/tenant/info?subdomain=${subdomain}`;
    
    const res = await fetch(verifyTenantUrl, { 
      next: { revalidate: 60 } 
    } as RequestInit & { next?: { revalidate: number } });
    
    if (res.ok) {
      return await res.json() as TenantInfo;
    }
  } catch (err) {
    console.error('[PROXY_TENANT_VERIFICATION_ERROR]', err);
  }
  
  return null;
}

import { headers } from 'next/headers';
import { getTenantSubdomain } from '@abd/satellite-sdk';

export interface TenantBranding {
  logoUrl?: string | null;
  theme?: {
    primary: string;
    secondary?: string;
    background?: string;
    rounded?: boolean;
    radius?: string;
  } | null;
}

export async function resolveTenantBranding(): Promise<TenantBranding | null> {
  const headersList = await headers();
  const host = headersList.get('host');
  const subdomain = getTenantSubdomain(host);
  if (!subdomain) return null;

  try {
    const providerUrl = process.env.AUTH_PROVIDER_URL || 'https://abd-auth.vercel.app';
    const res = await fetch(`${providerUrl}/api/auth/tenant/info?subdomain=${subdomain}`, {
      next: { revalidate: 3600 }
    });
    
    if (res.ok) {
      const data = await res.json() as { branding: TenantBranding | null };
      return data.branding;
    }
  } catch (err) {
    console.error('[TENANT_BRANDING_RESOLUTION_ERROR]', err);
  }
  return null;
}

import { getIndustrialSession } from '@/lib/session';
import { UserIdentity as SharedUserIdentity } from '@abd/styles';
import Link from 'next/link';

/**
 * 👤 UserIdentity Component
 * Server Component wrapper that fetches session data and delegates the UI to the centralized @abd/styles package.
 */
export async function UserIdentity() {
  const session = await getIndustrialSession();

  if (!session.authenticated || !session.user) {
    return null;
  }

  const { user } = session;
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  return (
    <SharedUserIdentity
      name={`${user.name} ${user.surname || ''}`}
      email={user.email}
      isAdmin={isAdmin}
      adminHref="/admin"
      logoutHref="/api/auth/logout"
      LinkComponent={Link}
    />
  );
}

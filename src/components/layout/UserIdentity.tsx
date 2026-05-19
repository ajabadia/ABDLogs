import { getIndustrialSession } from '@/lib/session';
import { User, LogOut, ShieldCheck, Settings } from 'lucide-react';
import Link from 'next/link';

/**
 * 👤 UserIdentity Component
 * Displays the authenticated user profile and management actions.
 */
export async function UserIdentity() {
  const session = await getIndustrialSession();

  if (!session.authenticated || !session.user) {
    return null;
  }

  const { user } = session;
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  return (
    <div className="flex items-center gap-4 p-1 pl-4 bg-card border border-border rounded-md backdrop-blur-sm group transition-all hover:border-primary/20">
      <div className="flex flex-col items-end gap-0.5 py-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground font-bold">
          {user.name} {user.surname}
        </span>
        <div className="flex items-center gap-1.5">
          {isAdmin && <ShieldCheck className="w-3 h-3 text-primary/60" />}
          <span className="text-[9px] font-mono uppercase tracking-[0.1em] text-muted-foreground/60">
            {user.email}
          </span>
        </div>
      </div>

      <div className="h-8 w-[1px] bg-border mx-1" />

      <div className="flex items-center">
        {isAdmin && (
          <Link 
            href="/admin" 
            className="p-2 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border-r border-border"
            title="Admin Governance Portal"
          >
            <Settings className="w-4 h-4" />
          </Link>
        )}
        
        <Link 
          href="/api/auth/logout" 
          prefetch={false}
          className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

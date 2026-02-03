import type { ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import RequireAuth from '@/components/RequireAuth';

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const isAdmin = useQuery(api.admin.isAdmin);

  return (
    <RequireAuth redirectTo="/admin/login">
      {isAdmin === undefined ? (
        <div className="min-h-screen flex items-center justify-center bg-[#F6F2EE] text-[#111]">
          Loading...
        </div>
      ) : isAdmin ? (
        <>{children}</>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-[#F6F2EE] text-[#111]">
          Access denied.
        </div>
      )}
    </RequireAuth>
  );
}

import type { ReactNode } from 'react';
import { Navigate, useLocation } from '@remix-run/react';
import { useConvexAuth } from 'convex/react';

export default function RequireAuth({
  children,
  redirectTo,
}: {
  children: ReactNode;
  redirectTo: string;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F2EE] text-[#111]">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

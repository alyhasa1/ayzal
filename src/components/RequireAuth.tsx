import type { ReactNode } from 'react';
import { Navigate, useLocation } from '@remix-run/react';
import { useConvexAuth } from 'convex/react';
import BrandLoader from '@/components/BrandLoader';

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
    return <BrandLoader label="Checking your account..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

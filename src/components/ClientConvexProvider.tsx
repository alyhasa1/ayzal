import type { ReactNode } from "react";
import { useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ClientOnly } from "remix-utils/client-only";

function ConvexProviderInner({ children }: { children: ReactNode }) {
  const client = useMemo(
    () => new ConvexReactClient(window.ENV.CONVEX_URL),
    []
  );

  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
}

export default function ClientConvexProvider({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <ClientOnly fallback={fallback}>{() => <ConvexProviderInner>{children}</ConvexProviderInner>}</ClientOnly>
  );
}

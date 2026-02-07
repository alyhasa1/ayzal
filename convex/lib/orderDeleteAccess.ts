const ROLE_RANK: Record<string, number> = {
  owner: 500,
  super_admin: 400,
  admin: 300,
  manager: 200,
  staff: 100,
};

export const PRIVILEGED_ORDER_DELETE_ROLES = new Set(["owner", "super_admin"]);

export interface OrderDeleteAccessResult {
  allowed: boolean;
  reason?: string;
  currentRole: string;
  highestConfiguredRole: string;
  requiresPrivilegedRole: boolean;
}

export function normalizeAdminRole(value?: string) {
  return (value ?? "admin").trim().toLowerCase();
}

export function getAdminRoleRank(role?: string) {
  return ROLE_RANK[normalizeAdminRole(role)] ?? 0;
}

export function canDeleteOrdersForRole(
  currentRole: string | undefined,
  configuredRoles: Array<string | undefined>
): OrderDeleteAccessResult {
  const normalizedCurrentRole = normalizeAdminRole(currentRole);
  const normalizedConfiguredRoles = (configuredRoles.length > 0
    ? configuredRoles
    : [normalizedCurrentRole]
  ).map((role) => normalizeAdminRole(role));

  const hasPrivilegedRoleConfigured = normalizedConfiguredRoles.some((role) =>
    PRIVILEGED_ORDER_DELETE_ROLES.has(role)
  );

  if (hasPrivilegedRoleConfigured) {
    const allowed = PRIVILEGED_ORDER_DELETE_ROLES.has(normalizedCurrentRole);
    return {
      allowed,
      reason: allowed ? undefined : "Only owner or super_admin can delete orders.",
      currentRole: normalizedCurrentRole,
      highestConfiguredRole: normalizedConfiguredRoles.includes("owner")
        ? "owner"
        : "super_admin",
      requiresPrivilegedRole: true,
    };
  }

  let highestConfiguredRole = normalizedConfiguredRoles[0] ?? normalizedCurrentRole;
  let highestConfiguredRank = getAdminRoleRank(highestConfiguredRole);

  for (const role of normalizedConfiguredRoles.slice(1)) {
    const rank = getAdminRoleRank(role);
    if (rank > highestConfiguredRank) {
      highestConfiguredRank = rank;
      highestConfiguredRole = role;
    }
  }

  const allowed = getAdminRoleRank(normalizedCurrentRole) === highestConfiguredRank;
  return {
    allowed,
    reason: allowed
      ? undefined
      : "Only the highest configured admin role can delete orders.",
    currentRole: normalizedCurrentRole,
    highestConfiguredRole,
    requiresPrivilegedRole: false,
  };
}

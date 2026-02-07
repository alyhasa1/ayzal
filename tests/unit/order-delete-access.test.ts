import { describe, expect, it } from "vitest";
import { canDeleteOrdersForRole } from "../../convex/lib/orderDeleteAccess";

describe("order delete role access", () => {
  it("requires owner or super_admin when a privileged role is configured", () => {
    const adminAccess = canDeleteOrdersForRole("admin", ["admin", "super_admin"]);
    const ownerAccess = canDeleteOrdersForRole("owner", ["admin", "super_admin"]);

    expect(adminAccess.allowed).toBe(false);
    expect(adminAccess.reason).toBe("Only owner or super_admin can delete orders.");
    expect(ownerAccess.allowed).toBe(true);
  });

  it("falls back to the highest configured role when no privileged role exists", () => {
    const adminAccess = canDeleteOrdersForRole("admin", ["manager", "admin"]);
    const managerAccess = canDeleteOrdersForRole("manager", ["manager", "admin"]);

    expect(adminAccess.allowed).toBe(true);
    expect(managerAccess.allowed).toBe(false);
    expect(managerAccess.reason).toBe("Only the highest configured admin role can delete orders.");
  });

  it("allows top non-standard role when it is the highest configured", () => {
    const managerAccess = canDeleteOrdersForRole("manager", ["staff", "manager"]);
    const staffAccess = canDeleteOrdersForRole("staff", ["staff", "manager"]);

    expect(managerAccess.allowed).toBe(true);
    expect(staffAccess.allowed).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { formatAuthErrorMessage, formatOrderLinkErrorMessage } from "../../src/lib/authErrors";

describe("auth error messaging", () => {
  it("converts raw convex sign-in wrapper errors to friendly copy", () => {
    const message = formatAuthErrorMessage(
      new Error("[CONVEX A(auth:signIn)] [Request ID: abc123] Server Error Called by client"),
      { mode: "signIn", audience: "customer" }
    );
    expect(message).toBe("We could not sign you in. Please check your details and try again.");
  });

  it("maps invalid credentials to a clear message", () => {
    const message = formatAuthErrorMessage(new Error("Invalid credentials"), {
      mode: "signIn",
      audience: "customer",
    });
    expect(message).toBe("Invalid email or password. Please try again.");
  });

  it("maps duplicate account sign-up errors to sign-in guidance", () => {
    const message = formatAuthErrorMessage(new Error("Account already exists"), {
      mode: "signUp",
      audience: "customer",
    });
    expect(message).toBe("An account with this email already exists. Please sign in instead.");
  });

  it("maps admin unauthorized errors to admin-specific guidance", () => {
    const message = formatAuthErrorMessage(new Error("Forbidden"), {
      mode: "signIn",
      audience: "admin",
    });
    expect(message).toBe(
      "You do not have admin access. Please use an authorized admin account."
    );
  });

  it("maps order-linking mismatch errors to checkout-email guidance", () => {
    const message = formatOrderLinkErrorMessage(
      new Error("Order email does not match the signed-in account")
    );
    expect(message).toBe(
      "This order is linked to a different email. Please sign in with the same email used at checkout."
    );
  });
});

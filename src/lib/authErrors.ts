export type AuthFlowMode = "signIn" | "signUp";
export type AuthAudience = "customer" | "admin";

function readErrorText(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (typeof err !== "object") return "";

  const candidate = err as any;
  const values = [
    candidate.message,
    candidate.shortMessage,
    candidate.error,
    candidate.data?.message,
    candidate.data?.shortMessage,
    candidate.cause?.message,
  ];
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function cleanTechnicalNoise(raw: string): string {
  return raw
    .replace(/\[CONVEX [^\]]+\]\s*/gi, "")
    .replace(/\[Request ID:[^\]]+\]\s*/gi, "")
    .replace(/Server Error Called by client/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

export function formatAuthErrorMessage(
  err: unknown,
  {
    mode,
    audience = "customer",
  }: {
    mode: AuthFlowMode;
    audience?: AuthAudience;
  }
): string {
  const cleaned = cleanTechnicalNoise(readErrorText(err));
  const message = cleaned.toLowerCase();

  if (
    includesAny(message, [
      "toomanyfailedattempts",
      "too many failed attempts",
      "too many requests",
      "rate limit",
      "temporarily blocked",
    ])
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (
    includesAny(message, [
      "network",
      "failed to fetch",
      "timeout",
      "connection",
      "offline",
    ])
  ) {
    return "Connection issue. Please check your internet and try again.";
  }

  if (includesAny(message, ["invalid email", "email is required", "email format"])) {
    return "Please enter a valid email address.";
  }

  if (
    includesAny(message, [
      "password is required",
      "password too short",
      "weak password",
      "password must",
      "password length",
    ])
  ) {
    return "Please use a stronger password (at least 8 characters).";
  }

  if (
    includesAny(message, [
      "account already exists",
      "already registered",
      "email already exists",
      "duplicate",
      "already in use",
    ])
  ) {
    return "An account with this email already exists. Please sign in instead.";
  }

  if (
    includesAny(message, [
      "invalidsecret",
      "invalid credentials",
      "wrong password",
      "incorrect password",
      "password mismatch",
    ])
  ) {
    return "Invalid email or password. Please try again.";
  }

  if (
    includesAny(message, [
      "invalidaccountid",
      "account not found",
      "user not found",
      "no account",
      "does not exist",
    ])
  ) {
    if (mode === "signIn") {
      return "No account found for this email. Please create an account first.";
    }
    return "This email is not ready for sign in yet. Please create your account.";
  }

  if (includesAny(message, ["unauthorized", "forbidden", "permission"])) {
    if (audience === "admin") {
      return "You do not have admin access. Please use an authorized admin account.";
    }
    return "You are not authorized for this action. Please sign in and try again.";
  }

  if (!message) {
    return mode === "signUp"
      ? "We could not create your account right now. Please try again."
      : "We could not sign you in. Please check your details and try again.";
  }

  return mode === "signUp"
    ? "We could not create your account right now. Please try again."
    : "We could not sign you in. Please check your details and try again.";
}

export function formatOrderLinkErrorMessage(err: unknown): string {
  const cleaned = cleanTechnicalNoise(readErrorText(err));
  const message = cleaned.toLowerCase();

  if (
    includesAny(message, [
      "order email does not match",
      "checkout email does not match",
      "belongs to another account",
    ])
  ) {
    return "This order is linked to a different email. Please sign in with the same email used at checkout.";
  }

  if (includesAny(message, ["session token does not match", "unauthorized"])) {
    return "We could not verify this order in your current session.";
  }

  if (includesAny(message, ["order not found"])) {
    return "We could not find that order.";
  }

  return "Account created, but we could not auto-link this order yet. You can still track it from Track Order.";
}

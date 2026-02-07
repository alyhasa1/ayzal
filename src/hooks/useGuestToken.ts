import { useEffect, useState } from "react";

const STORAGE_KEY = "ayz_guest_token";

function createToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function useGuestToken() {
  const [guestToken, setGuestToken] = useState<string>("");

  useEffect(() => {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      setGuestToken(existing);
      return;
    }
    const token = createToken();
    window.localStorage.setItem(STORAGE_KEY, token);
    setGuestToken(token);
  }, []);

  return guestToken;
}

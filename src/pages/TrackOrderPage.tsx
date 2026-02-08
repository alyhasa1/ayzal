import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useGuestToken } from "@/hooks/useGuestToken";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import OrderTimeline, { StatusBadge } from "@/components/OrderTimeline";

const ACCESS_TOKEN_STORAGE_KEY = "ayz_track_access_token";

function readStoredToken(orderNumber: string) {
  if (typeof window === "undefined") return "";
  const key = `${ACCESS_TOKEN_STORAGE_KEY}:${orderNumber.trim().toUpperCase()}`;
  return window.localStorage.getItem(key) ?? "";
}

function storeToken(orderNumber: string, token: string) {
  if (typeof window === "undefined") return;
  const key = `${ACCESS_TOKEN_STORAGE_KEY}:${orderNumber.trim().toUpperCase()}`;
  window.localStorage.setItem(key, token);
}

export default function TrackOrderPage() {
  const guestToken = useGuestToken();
  const requestCode = useMutation(api.orderTracking.requestCode);
  const verifyCode = useMutation(api.orderTracking.verifyCode);

  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [challenge, setChallenge] = useState<{
    challenge_id: string;
    expires_at: number;
    channel: string;
    destination_masked: string;
    debug_code?: string;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber.trim()) {
      setAccessToken("");
      return;
    }
    setAccessToken(readStoredToken(orderNumber));
  }, [orderNumber]);

  const orderQueryArgs = useMemo(() => {
    const normalizedOrder = orderNumber.trim();
    if (!normalizedOrder || !accessToken) return "skip" as const;
    return {
      order_number: normalizedOrder,
      access_token: accessToken,
      guest_token: guestToken || undefined,
    };
  }, [orderNumber, accessToken, guestToken]);

  const order = useQuery(api.orderTracking.getVerifiedOrder, orderQueryArgs);

  return (
    <div className="min-h-screen bg-[#F6F2EE] px-6 py-20">
      <div className="max-w-1xl mx-auto space-y-6">
        <div className="bg-white border border-[#111]/10 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Order Tracking</p>
            <h1 className="font-display text-xl mt-1">Track Your Order</h1>
            <p className="text-sm text-[#6E6E6E] mt-2">
              Verify with your order email or phone to view the latest timeline.
            </p>
          </div>

          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setStatus(null);
              setIsSending(true);
              try {
                const result = await requestCode({
                  order_number: orderNumber.trim(),
                  contact_email: email.trim() || undefined,
                  contact_phone: phone.trim() || undefined,
                });
                setChallenge({
                  challenge_id: String(result.challenge_id),
                  expires_at: result.expires_at,
                  channel: result.channel,
                  destination_masked: result.destination_masked,
                  debug_code: result.debug_code,
                });
                setCode("");
                setAccessToken("");
                setStatus(
                  `Verification code sent to ${result.destination_masked}. Expires in 10 minutes.`
                );
              } catch (error: any) {
                setStatus(error?.message ?? "Unable to send verification code");
              } finally {
                setIsSending(false);
              }
            }}
          >
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
                Order Number
              </label>
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full border border-[#111]/10 px-3 py-2"
                placeholder="AYZ-260206-XXXXX"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#111]/10 px-3 py-2"
                  required={!phone}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-[#111]/10 px-3 py-2"
                  required={!email}
                />
              </div>
            </div>

            <button className="btn-primary w-full" type="submit" disabled={isSending}>
              {isSending ? "Sending code..." : "Send Verification Code"}
            </button>
          </form>

          {challenge ? (
            <form
              className="space-y-3 border-t border-[#111]/10 pt-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!challenge) return;
                setStatus(null);
                setIsVerifying(true);
                try {
                  const result = await verifyCode({
                    challenge_id: challenge.challenge_id as any,
                    code: code.trim(),
                    guest_token: guestToken || undefined,
                  });
                  setAccessToken(result.access_token);
                  storeToken(orderNumber, result.access_token);
                  setStatus("Verification successful. Loading your order...");
                } catch (error: any) {
                  setStatus(error?.message ?? "Unable to verify code");
                } finally {
                  setIsVerifying(false);
                }
              }}
            >
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">
                Enter verification code
              </p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-[#111]/10 px-3 py-2"
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
                required
              />
              {challenge.debug_code ? (
                <p className="text-xs text-[#6E6E6E]">
                  Dev code: <span className="font-medium text-[#111]">{challenge.debug_code}</span>
                </p>
              ) : null}
              <button className="btn-primary w-full" type="submit" disabled={isVerifying}>
                {isVerifying ? "Verifying..." : "Verify & Track"}
              </button>
            </form>
          ) : null}

          {status ? (
            <p className="text-sm border border-[#111]/10 bg-[#111]/5 px-3 py-2">{status}</p>
          ) : null}
        </div>

        {accessToken && order === undefined ? (
          <div className="bg-white border border-[#111]/10 p-6 text-sm text-[#6E6E6E]">
            Loading order...
          </div>
        ) : null}

        {accessToken && order === null ? (
          <div className="bg-white border border-[#111]/10 p-6 text-sm text-red-500">
            Verification expired or order not found. Request a new code.
          </div>
        ) : null}

        {order ? (
          <div className="bg-white border border-[#111]/10 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl">{formatOrderNumber(order)}</h2>
              <StatusBadge status={order.status} />
            </div>
            <div className="space-y-2">
              {order.items.map((item: any) => (
                <div key={item._id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.product_name}</p>
                    <p className="text-xs text-[#6E6E6E]">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm">{formatPrice(item.line_total)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-[#111]/10 pt-2">
                <span className="text-sm">Total</span>
                <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
              </div>
            </div>

            {(order.tracking_number || order.tracking_url || order.tracking_carrier) && (
              <div className="border border-[#D4A05A]/40 bg-[#D4A05A]/10 p-4 text-sm">
                <p className="font-medium">
                  {order.tracking_carrier ? `${order.tracking_carrier} ` : ""}Tracking
                </p>
                {order.tracking_number ? <p>#{order.tracking_number}</p> : null}
                {order.tracking_url ? (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#111] underline"
                  >
                    Open tracking link
                  </a>
                ) : null}
              </div>
            )}

            <div className="border border-[#111]/10 p-4">
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E] mb-2">Timeline</p>
              <OrderTimeline events={order.status_events} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

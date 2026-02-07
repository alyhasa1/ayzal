import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from '@remix-run/react';
import { useConvexAuth, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';
import { formatAuthErrorMessage, formatOrderLinkErrorMessage } from '@/lib/authErrors';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function sanitizeRedirectPath(value: string | null, fallback: string) {
  if (!value) return fallback;
  if (value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }
  return fallback;
}

export default function AccountLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [claimingOrder, setClaimingOrder] = useState(false);
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const claimGuestOrder = useMutation(api.orders.claimGuestOrder);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initializedFromParams = useRef(false);
  const handledPostAuth = useRef(false);

  const checkoutEmail = normalizeEmail(searchParams.get('checkout_email') ?? '');
  const checkoutModeParam = searchParams.get('mode');
  const checkoutMode =
    checkoutModeParam === 'signIn' || checkoutModeParam === 'signUp'
      ? checkoutModeParam
      : null;
  const orderId = searchParams.get('order_id');
  const guestToken = searchParams.get('guest_token');

  useEffect(() => {
    if (initializedFromParams.current) return;
    if (checkoutEmail) {
      setEmail(checkoutEmail);
    }
    if (checkoutMode) {
      setMode(checkoutMode);
    }
    initializedFromParams.current = true;
  }, [checkoutEmail, checkoutMode]);

  useEffect(() => {
    if (!isAuthenticated || handledPostAuth.current) return;
    handledPostAuth.current = true;

    const state = location.state as { from?: { pathname?: string } } | null;
    const fallbackRedirect = state?.from?.pathname || '/account/orders';
    const redirectTo = sanitizeRedirectPath(searchParams.get('redirect'), fallbackRedirect);

    const linkOrder = async () => {
      if (!orderId || !guestToken || !checkoutEmail) {
        navigate(redirectTo);
        return;
      }

      setClaimingOrder(true);
      try {
        await claimGuestOrder({
          order_id: orderId as any,
          guest_token: guestToken,
          contact_email: checkoutEmail,
        });
      } catch (err: unknown) {
        setError(formatOrderLinkErrorMessage(err));
      } finally {
        setClaimingOrder(false);
        navigate(redirectTo);
      }
    };

    void linkOrder();
  }, [
    isAuthenticated,
    location.state,
    navigate,
    searchParams,
    claimGuestOrder,
    orderId,
    guestToken,
    checkoutEmail,
  ]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      await signIn('password', {
        flow: mode,
        email: normalizedEmail,
        password,
      });
    } catch (err: unknown) {
      setError(formatAuthErrorMessage(err, { mode, audience: 'customer' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F2EE] text-[#111] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-[#111]/10 p-8">
        <div className="mb-8 text-center">
          <div className="font-display text-2xl tracking-[0.3em]">AYZAL</div>
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E] mt-2">Customer Account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {checkoutEmail ? (
            <p className="text-xs text-[#6E6E6E]">
              Sign in or create account with your checkout email to view your new order.
            </p>
          ) : null}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border border-[#111]/10 px-4 py-3 text-sm focus:outline-none focus:border-[#D4A05A]"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-[#111]/10 px-4 py-3 text-sm focus:outline-none focus:border-[#D4A05A]"
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || claimingOrder}
            className="w-full btn-primary mt-2"
          >
            {loading
              ? 'Please wait...'
              : claimingOrder
                ? 'Linking your order...'
                : mode === 'signIn'
                  ? 'Sign In'
                  : 'Create Account'}
          </button>
        </form>
        <button
          className="mt-6 text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
          disabled={loading || claimingOrder}
          onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
        >
          {mode === 'signIn' ? 'Create an account' : 'Use existing account'}
        </button>
      </div>
    </div>
  );
}

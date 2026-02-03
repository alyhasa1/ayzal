import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConvexAuth } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';

export default function AccountLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = (location.state as any)?.from?.pathname || '/account/orders';
      navigate(redirectTo);
    }
  }, [isAuthenticated, location.state, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn('password', {
        flow: mode,
        email,
        password,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Unable to sign in');
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
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border border-[#111]/10 px-4 py-3 text-sm focus:outline-none focus:border-[#D4A05A]"
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
            disabled={loading}
            className="w-full btn-primary mt-2"
          >
            {loading ? 'Please wait...' : mode === 'signIn' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <button
          className="mt-6 text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
          onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
        >
          {mode === 'signIn' ? 'Create an account' : 'Use existing account'}
        </button>
      </div>
    </div>
  );
}

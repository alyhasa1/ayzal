import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { useConvexAuth } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function formatAuthError(err: unknown) {
  const message = (err as { message?: string } | null)?.message ?? '';
  if (
    message.includes('InvalidAccountId') ||
    message.includes('InvalidSecret') ||
    message.includes('Invalid credentials')
  ) {
    return 'Invalid email or password.';
  }
  if (message.includes('TooManyFailedAttempts')) {
    return 'Too many failed attempts. Please try again later.';
  }
  return message || 'Unable to sign in';
}

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

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
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8">
        <div className="mb-8 text-center">
          <div className="font-display text-2xl tracking-[0.3em]">AYZAL</div>
          <p className="text-xs uppercase tracking-widest text-white/60 mt-2">Admin Access</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-[#D4A05A]"
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
            className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-[#D4A05A]"
            required
          />
          {error && <p className="text-xs text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-2"
          >
            {loading ? 'Please wait...' : mode === 'signIn' ? 'Sign In' : 'Create Admin Account'}
          </button>
        </form>
        <button
          className="mt-6 text-xs uppercase tracking-widest text-white/60 hover:text-white"
          onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
        >
          {mode === 'signIn' ? 'Create an account' : 'Use existing account'}
        </button>
      </div>
    </div>
  );
}

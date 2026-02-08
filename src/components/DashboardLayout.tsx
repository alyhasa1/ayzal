import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from '@remix-run/react';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface DashboardLayoutProps {
  title: string;
  navItems: NavItem[];
  children: ReactNode;
}

export default function DashboardLayout({ title, navItems, children }: DashboardLayoutProps) {
  const { signOut } = useAuthActions();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();
  const isAccountRoute = location.pathname.startsWith('/account');

  useEffect(() => {
    if (!isNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isNavOpen]);

  return (
    <div className={`min-h-screen bg-[#F6F2EE] text-[#111] ${isAccountRoute ? 'pt-16 lg:pt-20' : ''}`}>
      <div className="flex min-h-screen">
        {isNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsNavOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-xl border-r border-[#111]/10 flex flex-col">
              <div className="px-6 py-6 border-b border-[#111]/10 flex items-start justify-between gap-4">
                <div>
                  <Link to="/" className="font-display text-xl font-bold tracking-[0.25em] hover:text-[#D4A05A] transition-colors">
                    AYZAL
                  </Link>
                  <p className="text-xs text-[#6E6E6E] mt-2 uppercase tracking-widest">{title}</p>
                </div>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="p-2 -mr-2 text-[#6E6E6E] hover:text-[#111]"
                  onClick={() => setIsNavOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsNavOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'bg-[#111] text-white'
                          : 'text-[#6E6E6E] hover:text-[#111]'
                      }`
                    }
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="px-6 py-4 border-t border-[#111]/10">
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        )}

        <aside className="hidden md:flex w-64 bg-white/80 border-r border-[#111]/10 flex-col">
          <div className="px-6 py-6 border-b border-[#111]/10">
            <Link to="/" className="font-display text-xl font-bold tracking-[0.25em] hover:text-[#D4A05A] transition-colors">
              AYZAL
            </Link>
            <p className="text-xs text-[#6E6E6E] mt-2 uppercase tracking-widest">{title}</p>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
                    isActive ? 'bg-[#111] text-white' : 'text-[#6E6E6E] hover:text-[#111]'
                  }`
                }
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="px-6 py-4 border-t border-[#111]/10">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="flex items-center justify-between px-6 lg:px-10 py-5 border-b border-[#111]/10 bg-white/70">
            <div className="md:hidden flex items-center gap-3">
              <button
                type="button"
                aria-label="Open menu"
                className="p-2 -ml-2 text-[#6E6E6E] hover:text-[#111]"
                onClick={() => setIsNavOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link to="/" className="font-display text-lg font-bold tracking-[0.25em] hover:text-[#D4A05A] transition-colors">
                AYZAL
              </Link>
            </div>
            <h1 className="font-display text-lg md:text-xl font-semibold tracking-wider uppercase">{title}</h1>
            <button
              type="button"
              onClick={() => signOut()}
              className="md:hidden text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
            >
              Sign out
            </button>
          </header>
          <main className="px-6 lg:px-10 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

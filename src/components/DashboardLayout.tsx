import type { ReactNode } from 'react';
import { NavLink } from '@remix-run/react';
import { LogOut } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';

interface NavItem {
  label: string;
  href: string;
}

interface DashboardLayoutProps {
  title: string;
  navItems: NavItem[];
  children: ReactNode;
}

export default function DashboardLayout({ title, navItems, children }: DashboardLayoutProps) {
  const { signOut } = useAuthActions();

  return (
    <div className="min-h-screen bg-[#F6F2EE] text-[#111]">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-64 bg-white/80 border-r border-[#111]/10 flex-col">
          <div className="px-6 py-6 border-b border-[#111]/10">
            <div className="font-display text-xl font-bold tracking-[0.25em]">AYZAL</div>
            <p className="text-xs text-[#6E6E6E] mt-2 uppercase tracking-widest">{title}</p>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
                    isActive ? 'bg-[#111] text-white' : 'text-[#6E6E6E] hover:text-[#111]'
                  }`
                }
              >
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
            <div className="md:hidden font-display text-lg font-bold tracking-[0.25em]">AYZAL</div>
            <h1 className="font-display text-lg md:text-xl font-semibold tracking-wider uppercase">{title}</h1>
            <button
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

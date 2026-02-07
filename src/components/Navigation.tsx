import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from '@remix-run/react';
import { Menu, Search, ShoppingBag, X, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface NavigationProps {
  onMenuOpen: () => void;
}

export default function Navigation({ onMenuOpen }: NavigationProps) {
  const popularSearches = ['lawn suits', 'eid edits', 'bridal', 'new arrivals'];
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { totalItems, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're on product page (for nav styling)
  const isProductPage = location.pathname.startsWith('/product/');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine text color based on page and scroll
  const getTextColor = () => {
    if (isProductPage) {
      return isScrolled ? 'text-[#111]' : 'text-[#111]';
    }
    return isScrolled ? 'text-[#111]' : 'text-white';
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          isScrolled || isProductPage
            ? 'bg-[#F6F2EE]/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left - Menu */}
            <button
              onClick={onMenuOpen}
              className={`p-2 transition-colors ${getTextColor()}`}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* Center - Logo */}
            <button
              onClick={handleLogoClick}
              className={`font-display text-xl lg:text-2xl font-bold tracking-[0.25em] transition-colors ${getTextColor()}`}
            >
              AYZAL
            </button>

            {/* Right - Search & Cart */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/account')}
                className={`p-2 transition-colors ${getTextColor()}`}
                aria-label="Account"
              >
                <User className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`p-2 transition-colors ${getTextColor()}`}
                aria-label="Search"
              >
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className={`p-2 transition-colors relative ${getTextColor()}`}
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4A05A] text-[#0B0F17] text-xs font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      <div
        className={`fixed inset-0 z-[150] transition-all duration-300 ${
          isSearchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsSearchOpen(false)}
        />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-6">
          <form
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              const query = searchQuery.trim();
              if (!query) return;
              setIsSearchOpen(false);
              navigate(`/search?q=${encodeURIComponent(query)}`);
            }}
          >
            <input
              type="text"
              placeholder="Search by style, fabric, color, or SKU"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-transparent border-b-2 border-white/30 text-white text-2xl lg:text-4xl py-4 focus:outline-none focus:border-[#D4A05A] placeholder:text-white/40 font-display tracking-wide"
              autoFocus={isSearchOpen}
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </form>
          <p className="mt-3 text-xs uppercase tracking-widest text-white/60">
            Need help deciding? Start with one of these.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {popularSearches.map((label) => (
              <button
                key={label}
                type="button"
                className="rounded-full border border-white/30 px-3 py-1.5 text-xs uppercase tracking-widest text-white/85 hover:border-[#D4A05A] hover:text-[#D4A05A] transition-colors"
                onClick={() => {
                  setIsSearchOpen(false);
                  navigate(`/search?q=${encodeURIComponent(label)}`);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

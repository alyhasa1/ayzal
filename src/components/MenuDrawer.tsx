import { useMemo } from 'react';
import { useNavigate, useLocation } from '@remix-run/react';
import { X } from 'lucide-react';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: { name: string; slug?: string }[];
}

export default function MenuDrawer({ isOpen, onClose, categories = [] }: MenuDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = useMemo(() => {
    const items = [
      { label: 'Shop All', href: '/#products' },
      { label: 'New Arrivals', href: '/#new-arrivals' },
    ];
    categories.forEach((category) => {
      if (category.slug) {
        items.push({ label: category.name, href: `/category/${category.slug}` });
      }
    });
    items.push({ label: 'Our Story', href: '/#story' });
    items.push({ label: 'Contact', href: '/#contact' });
    return items;
  }, [categories]);

  const handleClick = (href: string) => {
    onClose();
    
    // Check if it's a hash link
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      
      // If we're not on the home page, navigate there first
      if (location.pathname !== '/' && path === '/') {
        navigate('/');
        // Wait for navigation then scroll
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // Already on home page, just scroll
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(href);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`nav-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`menu-drawer ${isOpen ? 'open' : ''}`}>
        <div className="h-full flex flex-col p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="self-end p-2 text-[#111] hover:text-[#D4A05A] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>

          {/* Menu items */}
          <nav className="flex-1 flex flex-col justify-center">
            <ul className="space-y-6">
              {menuItems.map((item, index) => (
                <li
                  key={index}
                  className="transform transition-all duration-500"
                  style={{
                    opacity: isOpen ? 1 : 0,
                    translate: isOpen ? '0' : '-20px',
                    transitionDelay: `${index * 50 + 200}ms`,
                  }}
                >
                  <button
                    onClick={() => handleClick(item.href)}
                    className="font-display text-2xl lg:text-3xl font-semibold text-[#111] hover:text-[#D4A05A] transition-colors tracking-wider uppercase"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer info */}
          <div
            className="border-t border-[#111]/10 pt-6 transition-all duration-500"
            style={{
              opacity: isOpen ? 1 : 0,
              transitionDelay: '500ms',
            }}
          >
            <p className="label-text text-[#6E6E6E] mb-2">Customer Service</p>
            <p className="text-sm text-[#111]">hello@ayzal.pk</p>
            <p className="text-sm text-[#111]">+92 300 1234567</p>
          </div>
        </div>
      </div>
    </>
  );
}

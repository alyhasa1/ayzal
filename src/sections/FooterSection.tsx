import { useRef, useMemo, useState } from 'react';
import gsap from 'gsap';
import { Mail, Phone, MapPin, Instagram, Facebook, ArrowRight, Check } from 'lucide-react';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { ensureScrollTrigger } from '@/lib/gsap';

const defaultLinks = {
  shop: ['New Arrivals', 'Formals', 'Ready-to-Wear', 'Bridal', 'Accessories'],
  help: ['Shipping', 'Returns', 'Size Guide', 'FAQ', 'Contact Us'],
  company: ['About Us', 'Careers', 'Press', 'Sustainability'],
};

export default function FooterSection({ data }: { data?: any }) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const homeData = data?.homeData;

  const settings = useMemo(() => {
    return homeData?.settings ?? {};
  }, [homeData?.settings]);

  const footerLinks = settings.footer_links ?? defaultLinks;
  const brandName = settings.brand_name ?? 'AYZAL';
  const contactEmail = settings.contact_email ?? 'hello@ayzal.pk';
  const contactPhone = settings.contact_phone ?? '+92 300 1234567';
  const contactLocation = settings.contact_location ?? 'Lahore, Pakistan';
  const instagram = settings.social_links?.instagram ?? '#';
  const facebook = settings.social_links?.facebook ?? '#';

  useIsomorphicLayoutEffect(() => {
    ensureScrollTrigger();
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer
      ref={sectionRef}
      id="contact"
      className="relative bg-[#0B0F17] text-[#F6F2EE] py-16 lg:py-20"
    >
      <div ref={contentRef} className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Contact Info */}
          <div>
            <h3 className="font-display text-lg font-semibold tracking-wider uppercase mb-6">
              Get in Touch
            </h3>
            <div className="space-y-4">
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-3 text-[#F6F2EE]/80 hover:text-[#D4A05A] transition-colors"
              >
                <Mail className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-sm">{contactEmail}</span>
              </a>
              <a
                href={`tel:${contactPhone}`}
                className="flex items-center gap-3 text-[#F6F2EE]/80 hover:text-[#D4A05A] transition-colors"
              >
                <Phone className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-sm">{contactPhone}</span>
              </a>
              <div className="flex items-start gap-3 text-[#F6F2EE]/80">
                <MapPin className="w-4 h-4 mt-0.5" strokeWidth={1.5} />
                <span className="text-sm">{contactLocation}</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="label-text text-[#F6F2EE]/60 mb-6">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop?.map((link: string) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-[#F6F2EE]/80 hover:text-[#D4A05A] transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="label-text text-[#F6F2EE]/60 mb-6">Help</h3>
            <ul className="space-y-3">
              {footerLinks.help?.map((link: string) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-[#F6F2EE]/80 hover:text-[#D4A05A] transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-display text-lg font-semibold tracking-wider uppercase mb-6">
              Join the List
            </h3>
            <p className="text-sm text-[#F6F2EE]/60 mb-4">
              Subscribe for early access to new collections and exclusive offers.
            </p>
            {isSubscribed ? (
              <div className="flex items-center gap-2 text-[#D4A05A]">
                <Check className="w-4 h-4" />
                <span className="text-sm">Subscribed!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-[#F6F2EE] placeholder:text-[#F6F2EE]/40 focus:outline-none focus:border-[#D4A05A] text-sm"
                  required
                />
                <button
                  type="submit"
                  className="px-4 bg-[#D4A05A] text-[#0B0F17] hover:bg-[#e0b06a] transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <a
            href="#"
            className="font-display text-xl font-bold tracking-[0.25em] text-[#F6F2EE]"
          >
            {brandName}
          </a>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <a
              href={instagram}
              className="text-[#F6F2EE]/60 hover:text-[#D4A05A] transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" strokeWidth={1.5} />
            </a>
            <a
              href={facebook}
              className="text-[#F6F2EE]/60 hover:text-[#D4A05A] transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" strokeWidth={1.5} />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-[#F6F2EE]/40">
            ? 2026 {brandName} Collections. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

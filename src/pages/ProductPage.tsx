import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import gsap from 'gsap';
import { useCart } from '@/hooks/useCart';
import { useGuestToken } from "@/hooks/useGuestToken";
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types';
import { ensureScrollTrigger } from '@/lib/gsap';
import DiscoveryRail from '@/components/shop/DiscoveryRail';
import { 
  ChevronLeft, 
  ChevronRight, 
  Minus, 
  Plus, 
  ShoppingBag, 
  Truck, 
  Shield, 
  RotateCcw,
  Check,
  Ruler,
  Sparkles,
  Package,
  Heart,
  Star
} from 'lucide-react';

type RecommendationProduct = Pick<
  Product,
  "id" | "slug" | "name" | "image" | "category" | "price"
>;

const RECENT_VIEWED_STORAGE_KEY = "ayzal:recently-viewed";

function isRecommendationProduct(value: unknown): value is RecommendationProduct {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.image === "string" &&
    typeof row.category === "string" &&
    typeof row.price === "number"
  );
}

export default function ProductPage({
  product,
  relatedProducts,
  bestSellerProducts,
  topRatedProducts,
  frequentlyBoughtTogether,
  completeTheLook,
  tagMatchProducts,
  reviews,
  reviewStats,
}: {
  product: Product;
  relatedProducts: RecommendationProduct[];
  bestSellerProducts: RecommendationProduct[];
  topRatedProducts: RecommendationProduct[];
  frequentlyBoughtTogether: RecommendationProduct[];
  completeTheLook: RecommendationProduct[];
  tagMatchProducts: RecommendationProduct[];
  reviews: Array<{
    id: string;
    rating: number;
    title?: string;
    body?: string;
    guestName?: string;
    verifiedPurchase: boolean;
    createdAt: number;
    helpfulCount: number;
  }>;
  reviewStats: {
    count: number;
    average: number;
  };
}) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const guestToken = useGuestToken();
  const addServerCartItem = useMutation(api.cart.addItem);
  const ensureWishlist = useMutation(api.wishlist.getOrCreate);
  const addToWishlist = useMutation(api.wishlist.add);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistSaving, setIsWishlistSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'care'>('description');
  const [recentlyViewed, setRecentlyViewed] = useState<RecommendationProduct[]>([]);
  
  const mainRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const buyBoxRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);
  const [showStickyAtc, setShowStickyAtc] = useState(false);

  useEffect(() => {
    ensureScrollTrigger();
    
    const ctx = gsap.context(() => {
      gsap.fromTo(
        galleryRef.current,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
      
      gsap.fromTo(
        infoRef.current,
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power2.out' }
      );
      
      gsap.fromTo(
        relatedRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: relatedRef.current,
            start: 'top 85%',
          },
        }
      );
    }, mainRef);

    return () => ctx.revert();
  }, [
    product.id,
    product.slug,
    product.name,
    product.image,
    product.category,
    product.price,
  ]);

  // Reset scroll when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImage(0);
    setQuantity(1);
    setIsAdded(false);
  }, [product.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const current: RecommendationProduct = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      category: product.category,
      price: product.price,
    };
    try {
      const raw = window.localStorage.getItem(RECENT_VIEWED_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const existing = Array.isArray(parsed) ? parsed.filter(isRecommendationProduct) : [];
      const next = [current, ...existing.filter((item) => item.id !== current.id)].slice(0, 12);
      window.localStorage.setItem(RECENT_VIEWED_STORAGE_KEY, JSON.stringify(next));
      setRecentlyViewed(next.filter((item) => item.id !== current.id).slice(0, 8));
    } catch {
      setRecentlyViewed([]);
    }
  }, [
    product.id,
    product.slug,
    product.name,
    product.image,
    product.category,
    product.price,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      if (!buyBoxRef.current) return;
      const shouldShow = window.innerWidth < 1024 && buyBoxRef.current.getBoundingClientRect().bottom < 0;
      setShowStickyAtc(shouldShow);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [product.id]);

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, 'Unstitched');
      if (guestToken) {
        void addServerCartItem({
          guest_token: guestToken,
          product_id: product.id as Id<"products">,
          quantity: 1,
        }).catch(() => {
          // Keep local UX responsive; checkout will reconcile if sync fails.
        });
      }
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleSaveToWishlist = async () => {
    if (!guestToken || isWishlistSaving) return;
    setIsWishlistSaving(true);
    try {
      await ensureWishlist({ guest_token: guestToken });
      await addToWishlist({
        guest_token: guestToken,
        product_id: product.id as Id<"products">,
      });
      setIsWishlisted(true);
    } finally {
      setIsWishlistSaving(false);
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const renderRecommendationSection = (title: string, items: RecommendationProduct[]) => {
    if (items.length === 0) return null;
    return (
      <section className="border-t border-[#111]/10 px-6 py-12 lg:px-12">
        <div className="shop-shell">
          <DiscoveryRail
            title={title}
            subtitle="Personalized recommendations based on browsing and purchase behavior."
            items={items.map((item) => ({
              ...item,
              inStock: true,
            }))}
            microcopy="Curated to increase confidence before checkout."
          />
        </div>
      </section>
    );
  };

  return (
    <main ref={mainRef} className="min-h-screen bg-[#F6F2EE]">
      {/* Breadcrumb */}
      <div className="pt-24 pb-4 px-6 lg:px-12 bg-[#F6F2EE]">
        <nav className="flex items-center gap-2 text-sm text-[#6E6E6E]">
          <button onClick={() => navigate('/')} className="hover:text-[#D4A05A] transition-colors">
            Home
          </button>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() =>
              navigate(product.categorySlug ? `/category/${product.categorySlug}` : '/#products')
            }
            className="hover:text-[#D4A05A] transition-colors"
          >
            {product.category}
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#111]">{product.name}</span>
        </nav>
      </div>

      {/* Product Main Section */}
      <section className="px-6 lg:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Image Gallery */}
            <div ref={galleryRef} className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                <img
                  src={images[selectedImage]}
                  alt={`${product.name} - ${product.category} Pakistani Dress`}
                  className="w-full h-full object-cover transition-transform duration-500"
                />
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1">
                  {selectedImage + 1} / {images.length}
                </div>
              </div>
              
              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-24 overflow-hidden border-2 transition-colors ${
                        selectedImage === idx
                          ? 'border-[#D4A05A]'
                          : 'border-transparent hover:border-[#111]/20'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div ref={infoRef} className="lg:pt-8">
              {/* SKU */}
              <p className="label-text text-[#6E6E6E] mb-2">{product.sku}</p>
              
              {/* Name */}
              <h1 className="font-display text-3xl lg:text-4xl font-semibold text-[#111] mb-4">
                {product.name}
              </h1>
              
              {/* Price */}
              <p className="font-display text-2xl text-[#D4A05A] mb-6">
                {formatPrice(product.price)}
              </p>

              {reviewStats.count > 0 ? (
                <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[#111]/10 bg-white px-4 py-2">
                  <div className="inline-flex items-center gap-1 text-[#D4A05A]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`w-4 h-4 ${
                          index < Math.round(reviewStats.average) ? 'fill-current' : ''
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#111]">
                    {reviewStats.average} ({reviewStats.count} review
                    {reviewStats.count === 1 ? '' : 's'})
                  </p>
                </div>
              ) : (
                <p className="text-xs uppercase tracking-widest text-[#6E6E6E] mb-6">
                  Be the first to review this item
                </p>
              )}
              
              {/* Short Description */}
              <p className="text-[#6E6E6E] mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Payment Methods */}
              {product.paymentMethods && product.paymentMethods.filter((method) => method.active).length > 0 && (
                <div className="mb-8">
                  <p className="label-text text-[#6E6E6E] mb-3">Payment Methods</p>
                  <div className="flex flex-wrap gap-2">
                    {product.paymentMethods.filter((method) => method.active).map((method) => (
                      <span key={method.id} className="px-3 py-1 text-xs border border-[#111]/10 bg-white/60">
                        {method.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* What's Included */}
              <div className="bg-white/50 p-6 mb-8">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-[#111] mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  What's Included (Unstitched)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-2 bg-[#D4A05A]/10 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#D4A05A]" viewBox="0 0 64 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 4 L20 12 Q20 16 24 16 L40 16 Q44 16 44 12 L44 4"/>
                        <path d="M20 4 L12 10 L12 28 L20 24"/>
                        <path d="M44 4 L52 10 L52 28 L44 24"/>
                        <path d="M20 24 L20 72 Q20 76 24 76 L40 76 Q44 76 44 72 L44 24"/>
                        <path d="M28 4 Q32 8 36 4"/>
                        <path d="M20 60 L24 60"/>
                        <path d="M44 60 L40 60"/>
                      </svg>
                    </div>
                    <p className="text-xs text-[#6E6E6E]">Kameez</p>
                    <p className="text-sm font-medium text-[#111]">{product.dimensions?.kameez}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-2 bg-[#D4A05A]/10 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#D4A05A]" viewBox="0 0 64 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 12 Q12 8 20 10 L52 18 Q58 20 56 26 L44 62 Q42 68 36 66 L12 58 Q6 56 8 50 L12 38"/>
                        <path d="M16 22 L20 42"/>
                        <path d="M28 26 L32 46"/>
                        <path d="M40 30 L44 50"/>
                        <path d="M10 14 L14 16"/>
                        <path d="M52 20 L54 24"/>
                        <path d="M42 64 L38 62"/>
                      </svg>
                    </div>
                    <p className="text-xs text-[#6E6E6E]">Dupatta</p>
                    <p className="text-sm font-medium text-[#111]">{product.dimensions?.dupatta}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-2 bg-[#D4A05A]/10 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#D4A05A]" viewBox="0 0 64 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 8 L44 8 Q48 8 48 12 L48 16 Q48 20 44 20 L20 20 Q16 20 16 16 L16 12 Q16 8 20 8"/>
                        <path d="M20 20 L16 48 Q14 64 12 72 Q11 76 16 76 L24 76 Q28 76 27 72 L26 48"/>
                        <path d="M44 20 L48 48 Q50 64 52 72 Q53 76 48 76 L40 76 Q36 76 37 72 L38 48"/>
                        <path d="M26 48 L32 40 L38 48"/>
                        <path d="M18 24 L20 32"/>
                        <path d="M46 24 L44 32"/>
                      </svg>
                    </div>
                    <p className="text-xs text-[#6E6E6E]">Shalwar</p>
                    <p className="text-sm font-medium text-[#111]">{product.dimensions?.shalwar}</p>
                  </div>
                </div>
              </div>

              {/* Quantity & Add to Cart */}
              <div ref={buyBoxRef} className="mb-8 space-y-3">
                <div className="trust-line">
                  Fast dispatch promise: most orders leave our warehouse within 24 hours. Address
                  changes are supported before dispatch.
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Quantity */}
                  <div className="flex items-center border border-[#111]/20">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-[#111]/5 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 flex items-center justify-center hover:bg-[#111]/5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 btn-primary flex items-center justify-center gap-3"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-5 h-5" />
                        Added to Bag
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        Add to Bag
                      </>
                    )}
                  </button>

                  {/* Wishlist */}
                  <button
                    onClick={handleSaveToWishlist}
                    disabled={!guestToken || isWishlistSaving}
                    className={`w-12 h-12 border flex items-center justify-center transition-colors ${
                      isWishlisted
                        ? 'border-[#D4A05A] text-[#D4A05A] bg-[#D4A05A]/10'
                        : 'border-[#111]/20 hover:border-[#D4A05A] hover:text-[#D4A05A]'
                    }`}
                    aria-label="Save to wishlist"
                    title={isWishlisted ? 'Saved to wishlist' : 'Save to wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <Truck className="w-5 h-5 mx-auto mb-2 text-[#D4A05A]" />
                  <p className="text-xs text-[#6E6E6E]">Free Delivery Over PKR 15k</p>
                </div>
                <div className="text-center">
                  <Shield className="w-5 h-5 mx-auto mb-2 text-[#D4A05A]" />
                  <p className="text-xs text-[#6E6E6E]">Secure COD Checkout</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-5 h-5 mx-auto mb-2 text-[#D4A05A]" />
                  <p className="text-xs text-[#6E6E6E]">7 Day Easy Returns</p>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="mb-8 border border-[#111]/10 bg-white/70 p-4 space-y-3">
                  <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">
                    Recent Reviews
                  </p>
                  {reviews.slice(0, 2).map((review) => (
                    <div key={review.id} className="border-t border-[#111]/10 pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-center gap-1 text-[#D4A05A] mb-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`w-3 h-3 ${index < review.rating ? 'fill-current' : ''}`}
                          />
                        ))}
                      </div>
                      {review.title ? <p className="text-sm font-medium text-[#111]">{review.title}</p> : null}
                      {review.body ? (
                        <p className="text-sm text-[#6E6E6E] leading-relaxed mt-1">{review.body}</p>
                      ) : null}
                      <p className="text-[11px] uppercase tracking-widest text-[#6E6E6E] mt-2">
                        {review.guestName ?? 'Verified Customer'}
                        {review.verifiedPurchase ? ' - Verified Buyer' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Tabs */}
              <div className="border-t border-[#111]/10 pt-6">
                <div className="flex gap-6 mb-6">
                  {(['description', 'details', 'care'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-sm font-medium uppercase tracking-wider pb-2 border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-[#D4A05A] text-[#111]'
                          : 'border-transparent text-[#6E6E6E] hover:text-[#111]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                
                <div className="text-sm text-[#6E6E6E] leading-relaxed">
                  {activeTab === 'description' && (
                    <div className="space-y-4">
                      <p>{product.description}</p>
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 mt-0.5 text-[#D4A05A]" />
                        <span><strong>Work:</strong> {product.work}</span>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'details' && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 mt-0.5 text-[#D4A05A]" />
                        <span><strong>Fabric:</strong> {product.fabric}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Ruler className="w-4 h-4 mt-0.5 text-[#D4A05A]" />
                        <div>
                          <strong>Dimensions:</strong>
                          <ul className="mt-2 space-y-1 ml-4">
                            {product.includes?.map((item, idx) => (
                              <li key={idx}>- {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'care' && (
                    <div className="space-y-2">
                      <p className="font-medium text-[#111] mb-3">Care Instructions:</p>
                      <ul className="space-y-2">
                        {product.care?.map((instruction, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 text-[#D4A05A]" />
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <div ref={relatedRef}>
          {renderRecommendationSection("You May Also Like", relatedProducts)}
        </div>
      ) : null}
      {renderRecommendationSection("Frequently Bought Together", frequentlyBoughtTogether)}
      {renderRecommendationSection("Complete The Look", completeTheLook)}
      {renderRecommendationSection("Style Matches", tagMatchProducts)}
      {renderRecommendationSection("Best Sellers Right Now", bestSellerProducts)}
      {renderRecommendationSection("Top Rated Picks", topRatedProducts)}
      {renderRecommendationSection("Recently Viewed", recentlyViewed)}

      {showStickyAtc ? (
        <div className="fixed inset-x-0 bottom-0 z-[120] bg-white border-t border-[#111]/10 p-3 shadow-2xl lg:hidden">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E] truncate">{product.name}</p>
              <p className="font-display text-lg text-[#111]">{formatPrice(product.price)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              className="btn-primary px-5 py-2.5 text-xs whitespace-nowrap"
            >
              {isAdded ? "Added" : "Add to Bag"}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

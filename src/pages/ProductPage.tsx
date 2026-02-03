import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/format';
import { mapProduct } from '@/lib/mappers';
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
  Heart
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productRaw = useQuery(api.products.getById, id ? { id: id as Id<'products'> } : 'skip');
  const product = productRaw ? mapProduct(productRaw) : null;
  const relatedRaw = useQuery(
    api.products.listRelated,
    productRaw ? { productId: productRaw._id as Id<'products'> } : 'skip'
  );
  const relatedProducts = (relatedRaw ?? []).map(mapProduct);
  const { addToCart } = useCart();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'care'>('description');
  
  const mainRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!product) return;
    
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
  }, [product]);

  // Reset scroll when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImage(0);
    setQuantity(1);
    setIsAdded(false);
  }, [id]);

  if (productRaw === undefined) {
    return (
      <div className="min-h-screen bg-[#F6F2EE] flex items-center justify-center">
        <div className="text-center text-sm text-[#6E6E6E]">Loading product...</div>
      </div>
    );
  }

  if (productRaw === null) {
    return (
      <div className="min-h-screen bg-[#F6F2EE] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl text-[#111] mb-4">Product Not Found</h1>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, 'Unstitched');
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
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
          <button onClick={() => navigate('/#products')} className="hover:text-[#D4A05A] transition-colors">
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
                  alt={product.name}
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
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
                <button className="w-12 h-12 border border-[#111]/20 flex items-center justify-center hover:border-[#D4A05A] hover:text-[#D4A05A] transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <Truck className="w-5 h-5 mx-auto mb-2 text-[#D4A05A]" />
                  <p className="text-xs text-[#6E6E6E]">Free Delivery</p>
                </div>
                <div className="text-center">
                  <Shield className="w-5 h-5 mx-auto mb-2 text-[#D4A05A]" />
                  <p className="text-xs text-[#6E6E6E]">Authentic Quality</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-5 h-5 mx-auto mb-2 text-[#D4A05A]" />
                  <p className="text-xs text-[#6E6E6E]">Easy Returns</p>
                </div>
              </div>

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
                              <li key={idx}>? {item}</li>
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

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section ref={relatedRef} className="px-6 lg:px-12 py-16 border-t border-[#111]/10">
          <div className="max-w-7xl mx-auto">
            <h2 className="headline-lg text-2xl text-[#111] mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <button
                  key={related.id}
                  onClick={() => navigate(`/product/${related.id}`)}
                  className="text-left group"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
                    <img
                      src={related.image}
                      alt={related.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-medium text-sm text-[#111] mb-1 group-hover:text-[#D4A05A] transition-colors">
                    {related.name}
                  </h3>
                  <p className="text-sm text-[#6E6E6E]">{formatPrice(related.price)}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

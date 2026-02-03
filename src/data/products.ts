import type { Product, Testimonial, PressQuote } from '@/types';

export const products: Product[] = [
  {
    id: '1',
    name: "Crimson Summer Meadow",
    price: 18500,
    image: "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
    images: [
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg"
    ],
    category: "Formals",
    description: "An elegant crimson unstitched suit featuring intricate floral embroidery on the kameez front and sleeves. The rich crimson hue paired with delicate gold threadwork creates a timeless piece perfect for summer celebrations and Eid gatherings.",
    fabric: "Premium Lawn (Kameez), Soft Cotton (Shalwar), Chiffon (Dupatta)",
    work: "Hand-embroidered neckline, floral motifs on front panel, sequin detailing on dupatta",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Dry clean only", "Do not bleach", "Iron on low heat", "Store in cool, dry place"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-CRM-001"
  },
  {
    id: '2',
    name: "Ivory Silk Elegance",
    price: 22000,
    image: "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
    images: [
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg"
    ],
    category: "Formals",
    description: "Pure elegance in pristine ivory silk. This unstitched suit features delicate pearl embellishments and subtle gold zari work, making it the perfect choice for nikkah ceremonies and formal dinners.",
    fabric: "Pure Silk (Kameez), Silk Blend (Shalwar), Organza (Dupatta)",
    work: "Pearl detailing on neckline, zari border on dupatta, subtle embroidery",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Dry clean only", "Handle with care", "Steam iron recommended", "Avoid direct sunlight"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-IVY-002"
  },
  {
    id: '3',
    name: "Rose Garden Embroidery",
    price: 16500,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
    images: [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg"
    ],
    category: "Ready-to-Wear",
    description: "A beautiful rose-toned unstitched suit adorned with traditional floral embroidery patterns. The soft pink shade combined with intricate resham work creates a feminine and graceful look.",
    fabric: "Premium Lawn (Kameez), Cotton (Shalwar), Chiffon (Dupatta)",
    work: "Resham embroidery on front and sleeves, lace detailing on dupatta",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Dry clean recommended", "Hand wash in cold water", "Do not wring", "Iron on medium heat"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-ROS-003"
  },
  {
    id: '4',
    name: "Midnight Blue Luxury",
    price: 24500,
    image: "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg",
    images: [
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg"
    ],
    category: "Formals",
    description: "Sophisticated midnight blue unstitched suit featuring heavy embroidery with silver threadwork. Perfect for evening events and winter weddings, this piece exudes luxury and elegance.",
    fabric: "Velvet (Kameez), Velvet (Shalwar), Silk (Dupatta)",
    work: "Heavy silver zardozi work, crystal embellishments, embroidered borders",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Professional dry clean only", "Do not iron directly on embroidery", "Store with moth repellent", "Keep away from moisture"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-MID-004"
  },
  {
    id: '5',
    name: "Sage Green Organza",
    price: 19500,
    image: "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
    images: [
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg",
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s"
    ],
    category: "Ready-to-Wear",
    description: "Light and airy sage green unstitched suit in premium organza fabric. The subtle sheen and delicate embroidery make it perfect for daytime events and summer soirées.",
    fabric: "Organza (Kameez), Cotton Silk (Shalwar), Organza (Dupatta)",
    work: "Thread embroidery, sequin scatter, lace trim on dupatta",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Dry clean only", "Handle gently", "Steam iron on low", "Avoid hanging for long periods"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-SAG-005"
  },
  {
    id: '6',
    name: "Golden Zari Heritage",
    price: 28500,
    image: "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
    images: [
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg"
    ],
    category: "Bridal",
    description: "A stunning bridal unstitched suit featuring intricate golden zari work on rich maroon fabric. This heritage piece is perfect for mehndi functions and wedding festivities.",
    fabric: "Banarasi Silk (Kameez), Silk (Shalwar), Banarasi Silk (Dupatta)",
    work: "Heavy golden zari weaving, traditional motifs, embellished borders",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Professional dry clean only", "Store in garment bag", "Avoid perfume directly on fabric", "Handle with clean hands"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-GOL-006"
  },
  {
    id: '7',
    name: "Pearl White Bridal",
    price: 45000,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
    images: [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg",
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg"
    ],
    category: "Bridal",
    description: "Exquisite pearl white bridal unstitched suit with heavy crystal and pearl embellishments. The perfect choice for nikkah or barat, this piece creates an ethereal bridal look.",
    fabric: "Pure Silk (Kameez), Silk (Shalwar), Net (Dupatta)",
    work: "Crystal and pearl handwork, silver zardozi, heavily embellished dupatta",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Professional bridal dry clean only", "Store in acid-free tissue", "Handle with utmost care", "Keep away from direct light when storing"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-PRL-007"
  },
  {
    id: '8',
    name: "Lilac Dream Chiffon",
    price: 15500,
    image: "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg",
    images: [
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg",
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s"
    ],
    category: "Ready-to-Wear",
    description: "Soft lilac unstitched suit in flowing chiffon fabric. The delicate color paired with subtle embroidery creates a dreamy, feminine look perfect for daytime events.",
    fabric: "Chiffon (Kameez), Cotton (Shalwar), Chiffon (Dupatta)",
    work: "Delicate thread embroidery, beadwork on neckline, ruffled dupatta edges",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Dry clean recommended", "Hand wash gently", "Do not twist", "Iron on low heat"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-LIL-008"
  },
  {
    id: '9',
    name: "Emerald Velvet Royale",
    price: 32000,
    image: "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
    images: [
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064"
    ],
    category: "Formals",
    description: "Rich emerald green velvet unstitched suit with gold zardozi work. The luxurious velvet fabric combined with intricate embroidery makes this perfect for winter weddings and formal gatherings.",
    fabric: "Premium Velvet (Kameez), Velvet (Shalwar), Silk (Dupatta)",
    work: "Gold zardozi embroidery, stone work, heavy borders",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Professional dry clean only", "Brush gently to maintain pile", "Store flat or rolled", "Keep away from heat sources"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-EME-009"
  },
  {
    id: '10',
    name: "Coral Peach Charm",
    price: 14500,
    image: "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
    images: [
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s"
    ],
    category: "Ready-to-Wear",
    description: "Beautiful coral peach unstitched suit in soft cotton fabric. The warm, flattering shade with delicate white embroidery creates a fresh and vibrant look.",
    fabric: "Premium Cotton (Kameez), Cotton (Shalwar), Cotton Net (Dupatta)",
    work: "White thread embroidery, mirror work accents, lace detailing",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Machine wash gentle", "Wash with similar colors", "Iron on medium heat", "Tumble dry low"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-COR-010"
  },
  {
    id: '11',
    name: "Black Gold Majesty",
    price: 26500,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
    images: [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg"
    ],
    category: "Formals",
    description: "Majestic black unstitched suit with elaborate gold embroidery. This statement piece combines traditional craftsmanship with contemporary elegance for unforgettable evening wear.",
    fabric: "Georgette (Kameez), Silk (Shalwar), Chiffon (Dupatta)",
    work: "Heavy gold dabka work, sequin detailing, embroidered motifs",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Dry clean only", "Do not rub embroidery", "Steam iron", "Store carefully to avoid snags"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-BLK-011"
  },
  {
    id: '12',
    name: "Turquoise Blue Breeze",
    price: 17500,
    image: "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg",
    images: [
      "https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s",
      "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg"
    ],
    category: "Ready-to-Wear",
    description: "Refreshing turquoise blue unstitched suit in breathable lawn fabric. Perfect for hot summer days, this piece features delicate white embroidery for a cool, crisp look.",
    fabric: "Premium Lawn (Kameez), Cotton (Shalwar), Lawn (Dupatta)",
    work: "White thread embroidery, cutwork details, printed dupatta",
    includes: ["Unstitched Kameez (3.0 meters)", "Dupatta (2.5 meters)", "Shalwar (2.5 meters)"],
    dimensions: {
      kameez: "3.0 meters",
      dupatta: "2.5 meters",
      shalwar: "2.5 meters"
    },
    care: ["Machine wash cold", "Wash separately first time", "Iron on medium", "Dry in shade"],
    sizes: ["Unstitched - One Size Fits All"],
    inStock: true,
    sku: "AYZ-TUR-012"
  }
];

export const testimonials: Testimonial[] = [
  {
    id: '13',
    text: "The fabric quality is exceptional. My tailor was impressed with the finishing.",
    author: "Amina R."
  },
  {
    id: '14',
    text: "Beautiful embroidery and the unstitched suit gives me the perfect fit.",
    author: "Sara K."
  },
  {
    id: '15',
    text: "Delivery was quick, and the packaging was beautiful. Will order again!",
    author: "Noor F."
  }
];

export const pressQuotes: PressQuote[] = [
  {
    id: '16',
    text: "Ayzal is redefining modern Pakistani pret with quality unstitched suits.",
    source: "Fashion Journal"
  },
  {
    id: '17',
    text: "Premium fabrics, exquisite craftsmanship, and timeless designs.",
    source: "Luxe Edit"
  }
];

export const formatPrice = (price: number): string => {
  return `Rs. ${price.toLocaleString('en-PK')}`;
};

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getRelatedProducts = (currentId: string, category: string): Product[] => {
  return products
    .filter(p => p.id !== currentId && p.category === category)
    .slice(0, 4);
};



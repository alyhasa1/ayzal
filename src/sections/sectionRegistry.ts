import type { ComponentType } from "react";
import HeroSection from "@/sections/HeroSection";
import CollectionSection from "@/sections/CollectionSection";
import SignatureSection from "@/sections/SignatureSection";
import SpotlightSection from "@/sections/SpotlightSection";
import NewArrivalsSection from "@/sections/NewArrivalsSection";
import StorySection from "@/sections/StorySection";
import CategorySection from "@/sections/CategorySection";
import StyleTipSection from "@/sections/StyleTipSection";
import TestimonialsSection from "@/sections/TestimonialsSection";
import CampaignSection from "@/sections/CampaignSection";
import MembershipSection from "@/sections/MembershipSection";
import AllProductsSection from "@/sections/AllProductsSection";
import FooterSection from "@/sections/FooterSection";

export const sectionRegistry: Record<string, ComponentType<{ data?: any }>> = {
  hero: HeroSection,
  collection: CollectionSection,
  signature: SignatureSection,
  spotlight: SpotlightSection,
  new_arrivals: NewArrivalsSection,
  story: StorySection,
  category: CategorySection,
  style_tip: StyleTipSection,
  testimonials: TestimonialsSection,
  campaign: CampaignSection,
  membership: MembershipSection,
  all_products: AllProductsSection,
  footer: FooterSection,
};

export const defaultSectionOrder = [
  "hero",
  "collection",
  "signature",
  "spotlight",
  "new_arrivals",
  "story",
  "category",
  "style_tip",
  "testimonials",
  "campaign",
  "membership",
  "all_products",
  "footer",
];

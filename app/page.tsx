// Home page - REDESIGNED with Purple-Cyan theme
// Using server component for better performance

import { Hero, CategoryMenu, Incentives, IntroducingSection, Newsletter } from "@/components";
import { ProductsSectionWrapper } from "@/components/ProductsSectionWrapper";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Using separate Hero component */}
      <Hero />

      {/* Existing Components */}
      <CategoryMenu />
      <ProductsSectionWrapper />
      <IntroducingSection />
      <Incentives />
      <Newsletter />
    </div>
  );
}

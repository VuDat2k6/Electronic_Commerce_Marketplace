// Home page - REDESIGNED with Purple-Cyan theme
// Using server component for better performance

import { Hero, CategoryMenu, Incentives, IntroducingSection, Newsletter } from "@/components";
import { ProductsSectionWrapper } from "@/components/ProductsSectionWrapper";

/**
 * Renders the redesigned Purple-Cyan themed home page composed of the hero, category menu, products section wrapper, introducing section, incentives, and newsletter.
 *
 * @returns The React element tree for the home page.
 */
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

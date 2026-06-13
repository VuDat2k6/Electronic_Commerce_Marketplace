// Home page - Premium design with smooth animations
import dynamic from "next/dynamic";
import CategoriesGrid from "@/components/CategoriesGrid";
import ProductsSectionWrapper from "@/components/ProductsSectionWrapper";
import Incentives from "@/components/Incentives";
import HeroSliderSkeleton from "@/components/HeroSliderSkeleton";

// Lazy load HeroSlider with skeleton fallback
const HeroSlider = dynamic(
  () => import("@/components/HeroSlider"),
  {
    loading: () => <HeroSliderSkeleton />,
    ssr: true,
  }
);

/**
 * Renders the home page: hero slider, category grid, products section, and incentives.
 * Footer is rendered globally via layout.tsx; do NOT add it here.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSlider />
      <CategoriesGrid />
      <ProductsSectionWrapper />
      <Incentives />
    </div>
  );
}

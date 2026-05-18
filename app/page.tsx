// Home page - Premium design with smooth animations
import dynamic from 'next/dynamic';
import CategoriesGrid from "@/components/CategoriesGrid";
import ProductsSectionWrapper from "@/components/ProductsSectionWrapper";
import Incentives from "@/components/Incentives";
import Footer from "@/components/Footer";
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
 * Renders the redesigned Purple-Cyan themed home page composed of the hero, category menu, products section wrapper, introducing section, incentives, and newsletter.
 *
 * @returns The React element tree for the home page.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSlider />
      <CategoriesGrid />
      <ProductsSectionWrapper />
      <Incentives />
      <Footer />
    </div>
  );
}

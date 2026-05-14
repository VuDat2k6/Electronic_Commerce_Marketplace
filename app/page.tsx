// Home page - Exactly matching the zip file structure
import HeroSlider from "@/components/HeroSlider";
import CategoriesGrid from "@/components/CategoriesGrid";
import ProductsSectionWrapper from "@/components/ProductsSectionWrapper";
import Incentives from "@/components/Incentives";

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
    </div>
  );
}

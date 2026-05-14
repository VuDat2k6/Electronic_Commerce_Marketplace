// Home page - Exactly matching the zip file structure
import HeroSlider from "@/components/HeroSlider";
import CategoriesGrid from "@/components/CategoriesGrid";
import ProductsSectionWrapper from "@/components/ProductsSectionWrapper";
import Incentives from "@/components/Incentives";

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

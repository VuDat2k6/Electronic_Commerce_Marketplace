// *********************
// Role of the component: Category wrapper that will contain title and category items
// Name of the component: CategoryMenu.tsx
// Developer: Vu Dat
// Version: 1.0
// Component call: <CategoryMenu />
// Input parameters: no input parameters
// Output: section title and category items
// *********************

import React from "react";
import CategoryItem from "./CategoryItem";
import { 
  FaMobile, 
  FaTablet, 
  FaHandPointer, 
  FaCameraRetro, 
  FaStopwatch, 
  FaLaptop, 
  FaDesktop,
  FaPrint,
  FaHeadphones,
  FaHeadset
} from "react-icons/fa";
import { categoryMenuList } from "@/lib/utils";
import Heading from "./Heading";

const iconMap: { [key: string]: React.ReactNode } = {
  "Smart Phones": <FaMobile className="w-12 h-12" />,
  "Tablets": <FaTablet className="w-12 h-12" />,
  "Mouses": <FaHandPointer className="w-12 h-12" />,
  "Cameras": <FaCameraRetro className="w-12 h-12" />,
  "Smart Watches": <FaStopwatch className="w-12 h-12" />,
  "Laptops": <FaLaptop className="w-12 h-12" />,
  "PCs": <FaDesktop className="w-12 h-12" />,
  "Printers": <FaPrint className="w-12 h-12" />,
  "Earbuds": <FaHeadset className="w-12 h-12" />,
  "Head Phones": <FaHeadphones className="w-12 h-12" />,
};

const CategoryMenu = () => {
  return (
    <div className="py-10 bg-blue-500">
      <Heading title="BROWSE CATEGORIES" />
      <div className="max-w-screen-2xl mx-auto py-10 gap-x-5 px-16 max-md:px-10 gap-y-5 grid grid-cols-5 max-lg:grid-cols-3 max-md:grid-cols-2 max-[450px]:grid-cols-1">
        {categoryMenuList.map((item) => (
          <CategoryItem title={item.title} key={item.id} href={item.href}>
            {iconMap[item.title] || <FaMobile className="w-12 h-12" />}
          </CategoryItem>
        ))}
      </div>
    </div>
  );
};

export default CategoryMenu;

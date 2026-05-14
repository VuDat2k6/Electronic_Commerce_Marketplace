// CategoryMenu component - REDESIGNED with Purple theme
"use client";

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
  "Smart Phones": <FaMobile className="w-10 h-10" />,
  "Tablets": <FaTablet className="w-10 h-10" />,
  "Mouses": <FaHandPointer className="w-10 h-10" />,
  "Cameras": <FaCameraRetro className="w-10 h-10" />,
  "Smart Watches": <FaStopwatch className="w-10 h-10" />,
  "Laptops": <FaLaptop className="w-10 h-10" />,
  "PCs": <FaDesktop className="w-10 h-10" />,
  "Printers": <FaPrint className="w-10 h-10" />,
  "Earbuds": <FaHeadset className="w-10 h-10" />,
  "Head Phones": <FaHeadphones className="w-10 h-10" />,
};

const CategoryMenu = () => {
  return (
    <div className="py-12 bg-gradient-to-r from-purple-50 to-cyan-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <Heading title="DANH MỤC SẢN PHẨM" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
          {categoryMenuList.map((item) => (
            <CategoryItem title={item.title} key={item.id} href={item.href}>
              {iconMap[item.title] || <FaMobile className="w-10 h-10" />}
            </CategoryItem>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryMenu;

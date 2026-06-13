// IntroducingSection component - REDESIGNED with Purple-Cyan theme
"use client";

import Link from "next/link";
import React from "react";

const IntroducingSection = () => {
  return (
    <div className="py-20 bg-gradient-to-r from-purple-600 to-cyan-500 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative text-center flex flex-col gap-y-5 items-center max-w-4xl mx-auto px-4">
        <h2 className="text-white text-6xl md:text-7xl lg:text-8xl font-extrabold text-center mb-2 max-md:text-5xl max-[480px]:text-4xl">
          INTRODUCING <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-pink-200">TFDTRONIC</span>
        </h2>
        <div className="space-y-4">
          <p className="text-white/90 text-xl md:text-2xl font-semibold max-md:text-lg">
            Shop the latest high-tech electronics.
          </p>
          <p className="text-white/90 text-xl md:text-2xl font-semibold max-md:text-lg">
            The best devices for tech enthusiasts.
          </p>
          <Link
            href="/shop"
            className="inline-block text-purple-700 bg-white font-bold px-12 py-4 text-xl hover:bg-purple-50 transition-colors rounded-xl shadow-lg hover:shadow-xl mt-6 max-md:text-lg max-md:px-8 max-md:py-3"
          >
            SHOP NOW
          </Link>
        </div>
      </div>
    </div>
  );
};

export default IntroducingSection;

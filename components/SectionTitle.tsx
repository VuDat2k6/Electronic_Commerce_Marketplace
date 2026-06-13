"use client";
// *********************
// Role of the component: Section title that can be used on any page
// Name of the component: SectionTitle.tsx
// Developer: Vu Dat
// Version: 1.1
// Component call: <SectionTitle />
// Input parameters: {title: string; path: string}
// Output: div containing h1 for page title and p for page location path
// *********************

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

const SectionTitle = ({ title, path }: { title: string; path: string }) => {
  const pathParts = path.split(' | ')
    .filter((part) => part.toLowerCase() !== 'home')
    .map((part, index, arr) => {
      const isLast = index === arr.length - 1;
      const href = `/${part.toLowerCase().replace(/\s+/g, '-')}`;
      return { name: part, href, isLast };
    });

  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 pt-20 pb-16 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-white/80 mb-4"
        >
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            Home
          </Link>
          {pathParts.map((part, index) => (
            <React.Fragment key={index}>
              <span className="text-white/50">/</span>
              {part.isLast ? (
                <span className="text-white font-medium">{part.name}</span>
              ) : (
                <Link href={part.href} className="hover:text-white transition-colors">
                  {part.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </motion.nav>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center"
        >
          {title}
        </motion.h1>
      </div>
    </div>
  );
};

export default SectionTitle;
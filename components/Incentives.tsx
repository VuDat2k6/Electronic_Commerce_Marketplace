// Incentives component - REDESIGNED with Purple theme
"use client";

import { incentives } from '@/lib/utils'
import Image from 'next/image'
import React from 'react'
import { Truck, RotateCcw, HeadphonesIcon, Shield, CreditCard, Package } from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  '/free-shipping.png': Truck,
  '/money-back.png': RotateCcw,
  '/support.png': HeadphonesIcon,
  '/guarantee.png': Shield,
  '/secure-payment.png': CreditCard,
  '/fast-delivery.png': Package,
}

const Incentives = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Shop With Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {incentives.map((incentive) => {
            const IconComponent = iconMap[incentive.imageSrc] || Package;
            return (
              <div 
                key={incentive.name} 
                className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-purple-50 transition-colors group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Image 
                    width={32} 
                    height={32} 
                    src={incentive.imageSrc} 
                    alt={incentive.name}
                    className="w-8 h-8"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{incentive.name}</h3>
                <p className="text-sm text-gray-500">{incentive.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Incentives;

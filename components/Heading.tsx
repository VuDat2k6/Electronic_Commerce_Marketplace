// Heading component - REDESIGNED with Purple theme
"use client";

import React from 'react'

const Heading = ({ title } : { title: string }) => {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 inline-block relative">
        {title}
        <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full"></span>
      </h2>
    </div>
  )
}

export default Heading;

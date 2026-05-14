// Heading - Modern design with gradient text
"use client";

import React from 'react'

const Heading = ({ title } : { title: string }) => {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 inline-block relative">
        {title}
      </h2>
      <div className="w-32 h-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-full mx-auto mt-4" />
    </div>
  )
}

export default Heading;

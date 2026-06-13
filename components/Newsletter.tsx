// Newsletter component - REDESIGNED with Purple theme
"use client";

import React, { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';

const Newsletter = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for subscribing with email: ${email}`);
      setEmail('');
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-700 to-purple-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Subscribe to our newsletter
            </h2>
            <p className="text-purple-200 text-lg">
              Get updates on new products and special offers delivered to your inbox.
            </p>
          </div>

          {/* Right: Form */}
          <div>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-purple-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Subscribe
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
            <p className="text-purple-300 text-sm mt-4">
              We respect your privacy. Subscribe to receive updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;

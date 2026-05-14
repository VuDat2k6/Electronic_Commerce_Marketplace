/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // Allow build even with type errors
        ignoreBuildErrors: true,
    },
    eslint: {
        // Allow build even with ESLint errors
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'placehold.co',
            port: ""
          },
          {
            protocol: 'https',
            hostname: 'images.unsplash.com',
            port: ""
          },
          {
            protocol: 'https',
            hostname: 'picsum.photos',
            port: ""
          },
        ],
        // Optimize images
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      },
    env: {
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    },
    // Enable compression
    compress: true,
    // Power by headers for caching
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, s-maxage=60, stale-while-revalidate=300',
            },
          ],
        },
        {
          source: '/_next/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/fonts/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
          ],
        },
      ];
    },
};

export default nextConfig;

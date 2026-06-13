const apiOrigin = (() => {
    try {
        return process.env.NEXT_PUBLIC_API_BASE_URL
            ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).origin
            : "";
    } catch {
        return "";
    }
})();

const socketOrigin = apiOrigin
    ? apiOrigin.replace(/^http:/, "ws:").replace(/^https:/, "wss:")
    : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // Allow build even with type errors (should be disabled in production)
        ignoreBuildErrors: false,
    },
    eslint: {
        // Allow build even with ESLint errors (should be disabled in production)
        ignoreDuringBuilds: false,
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
          {
            protocol: 'https',
            hostname: 'res.cloudinary.com',
            port: ""
          },
        ],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    env: {
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    },
    compress: true,
    
    async headers() {
      return [
        // ============================================================
        // SECURITY HEADERS
        // Applied to all routes
        // ============================================================
        {
          source: '/(.*)',
          headers: [
            // Prevent clickjacking
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            // Prevent MIME type sniffing
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            // XSS protection (legacy browsers)
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            // Referrer policy
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            // Permissions policy - restrict browser features
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            },
            // Content Security Policy
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: blob: https:",
                `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}${socketOrigin ? ` ${socketOrigin}` : ""}`,
                "frame-ancestors 'none'",
                "form-action 'self'",
                "base-uri 'self'",
                "object-src 'none'",
              ].join('; '),
            },
            // Strict Transport Security (HSTS) - enforce HTTPS
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains',
            },
          ],
        },
        
        // ============================================================
        // CACHE HEADERS FOR STATIC ASSETS
        // ============================================================
        {
          source: '/api/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, must-revalidate',
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
        
        // ============================================================
        // API SPECIFIC HEADERS
        // ============================================================
        {
          source: '/api/auth/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, must-revalidate',
            },
          ],
        },
      ];
    },
};

export default nextConfig;

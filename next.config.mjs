/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Add other experimental flags here if/when you need them
  },
  images: {
    remotePatterns: [
      // Supabase Storage: logos bucket for tenant + careersite logos
      {
        protocol: "https",
        hostname: "ojkyjcuicyejhkrtkasy.supabase.co",
        pathname: "/storage/v1/object/public/logos/**",
      },

      // Notion file/CDN hosts
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "images.notion.so",
      },
      {
        protocol: "https",
        hostname: "www.notion.so",
      },

      // Common stock image/CDN (optional)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;

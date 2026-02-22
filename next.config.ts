import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove serverActions.bodySizeLimit — it does NOT apply to Route Handlers (API routes).
  // Route Handler body size is controlled by the platform (Vercel: 4.5MB Hobby / 50MB Pro).
  // Individual routes export `maxDuration` for timeout control.
};

export default nextConfig;

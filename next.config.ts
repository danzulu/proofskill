import type { NextConfig } from "next";

const privateNoStore = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      { source: "/dashboard/:path*", headers: privateNoStore },
      { source: "/assessment/:path*", headers: privateNoStore },
      { source: "/results/:path*", headers: privateNoStore },
      { source: "/api/sessions/:path*", headers: privateNoStore },
    ];
  },
};

export default nextConfig;


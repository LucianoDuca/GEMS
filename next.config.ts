import type { NextConfig } from "next";

// Sin cacheComponents: cada página lee la sesión y datos de salud en el momento,
// nada sensible queda cacheado entre usuarios.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;

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
  experimental: {
    // El importador manda el historial completo de las planillas en una sola acción.
    serverActions: { bodySizeLimit: "10mb" },
  },
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;

import type { MetadataRoute } from "next";

// Permite "Agregar a la pantalla de inicio": se abre como una app, sin barra del navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GEMS Gestión",
    short_name: "GEMS",
    description: "Clientes, fichas de salud, sesiones y caja de tu centro de estética.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8fb",
    theme_color: "#a65287",
    lang: "es-AR",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icono-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

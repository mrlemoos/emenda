import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Emenda",
    short_name: "Emenda",
    description: "Veja para onde foi o dinheiro das emendas parlamentares.",
    start_url: "/",
    display: "standalone",
    background_color: brand.paper,
    theme_color: brand.paper,
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/icon1", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

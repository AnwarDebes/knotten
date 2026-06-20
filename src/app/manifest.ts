import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Knotten ved Sniksfjorden",
    short_name: "Knotten",
    description: "Energismart boligomrade pa Rodberg, Lindesnes.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b2236",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Bouton « N » des outils de Next.js masqué (développement seulement) : les erreurs restent affichées.
  devIndicators: false,
  // Pas encore de page d'accueil : la racine mène à la connexion (307, non mis en cache).
  redirects: async () => [
    { source: "/", destination: "/connexion", permanent: false },
  ],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

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
  experimental: {
    // Pièces justificatives des droits aux congés : 5 fichiers de 2 Mo au plus par envoi (vérifié par l'action).
    serverActions: { bodySizeLimit: "12mb" },
  },
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

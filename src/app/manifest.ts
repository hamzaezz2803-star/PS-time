import type { MetadataRoute } from "next";
import { CHEMIN_POINTAGE_EMPLOYE, COULEURS_PERSONNALISEES_PAR_DEFAUT } from "@/lib/constantes";
import { TEXTES_APPLICATION } from "@/lib/textes/application";

/**
 * Application installable (« Ajouter à l'écran d'accueil ») : icône PS Time, plein écran, ouverte
 * directement sur Mon pointage. Sans session, l'employé passe d'abord par la connexion ; un
 * administrateur est renvoyé vers son tableau de bord.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: CHEMIN_POINTAGE_EMPLOYE,
    name: TEXTES_APPLICATION.nom,
    short_name: TEXTES_APPLICATION.nomCourt,
    description: TEXTES_APPLICATION.description,
    lang: "fr",
    start_url: CHEMIN_POINTAGE_EMPLOYE,
    scope: "/",
    display: "standalone",
    background_color: COULEURS_PERSONNALISEES_PAR_DEFAUT.fond,
    theme_color: COULEURS_PERSONNALISEES_PAR_DEFAUT.primaire,
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Marge de sécurité : Android découpe l'icône en rond ou en carré arrondi.
      { src: "/icones/icone-masquable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

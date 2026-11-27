import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { COULEURS_PERSONNALISEES_PAR_DEFAUT } from "@/lib/constantes";
import { TEXTES_APPLICATION } from "@/lib/textes/application";
import { Atkinson_Hyperlegible_Next, Hanken_Grotesk, Inter, Source_Sans_3 } from "next/font/google";
import { lireApparence } from "@/lib/donnees/apparence";
import { variablesCouleurs } from "@/lib/metier/couleurs";
import "./globals.css";

// Polices au choix du super administrateur (licence OFL), chargées localement par next/font.
// Une seule est affichée à la fois ; seule celle d'origine est préchargée.
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin", "latin-ext"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], preload: false });
const sourceSans = Source_Sans_3({ variable: "--font-source-sans", subsets: ["latin", "latin-ext"], preload: false });
// Pas de valeurs d'ajustement connues pour Atkinson : repli explicite sur la police du système
// (sans `fallback`, Turbopack les cherche quand même et affiche un avertissement à chaque compilation).
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin", "latin-ext"],
  preload: false,
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});
const VARIABLES_POLICES = [hanken, inter, sourceSans, atkinson].map((police) => police.variable).join(" ");

export const metadata: Metadata = {
  title: { default: TEXTES_APPLICATION.nom, template: `%s | ${TEXTES_APPLICATION.nom}` },
  description: TEXTES_APPLICATION.description,
  // iPhone : « Ajouter à l'écran d'accueil » ouvre l'application en plein écran (le manifeste sert les autres appareils).
  appleWebApp: { capable: true, title: TEXTES_APPLICATION.nomCourt, statusBarStyle: "default" },
};

/** Couleur de la barre du navigateur et de l'application installée. */
export const viewport: Viewport = { themeColor: COULEURS_PERSONNALISEES_PAR_DEFAUT.primaire };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Apparence de l'installation, lue par globals.css (data-theme, data-police, data-taille,
  // data-menu, data-densite, data-impression).
  // Thème personnalisé : ses couleurs (#rrggbb vérifiées) remplacent celles de globals.css.
  const { theme, police, taille, couleurs, menu, densite, impression } = await lireApparence();
  const style = theme === "personnalise" ? (variablesCouleurs(couleurs) as CSSProperties) : undefined;
  return (
    <html lang="fr" data-theme={theme} data-police={police} data-taille={taille} data-menu={menu} data-densite={densite} data-impression={impression} style={style} className={`${VARIABLES_POLICES} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

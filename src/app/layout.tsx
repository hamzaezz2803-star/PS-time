import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Hanken_Grotesk, Inter, Source_Sans_3 } from "next/font/google";
import { lireApparence } from "@/lib/donnees/apparence";
import "./globals.css";

// Polices au choix du super administrateur (licence OFL), chargées localement par next/font.
// Une seule est affichée à la fois ; seule celle d'origine est préchargée.
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin", "latin-ext"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], preload: false });
const sourceSans = Source_Sans_3({ variable: "--font-source-sans", subsets: ["latin", "latin-ext"], preload: false });
// Pas de valeurs d'ajustement connues pour Atkinson : repli simple sur la police du système.
const atkinson = Atkinson_Hyperlegible_Next({ variable: "--font-atkinson", subsets: ["latin", "latin-ext"], preload: false, adjustFontFallback: false });
const VARIABLES_POLICES = [hanken, inter, sourceSans, atkinson].map((police) => police.variable).join(" ");

export const metadata: Metadata = {
  title: { default: "PS Time", template: "%s | PS Time" },
  description: "Application de pointage des équipes : arrivées, pauses et heures travaillées.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Thème et police de l'installation, lus par globals.css (data-theme, data-police).
  const { theme, police } = await lireApparence();
  return (
    <html lang="fr" data-theme={theme} data-police={police} className={`${VARIABLES_POLICES} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

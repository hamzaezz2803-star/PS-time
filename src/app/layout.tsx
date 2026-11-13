import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Une seule famille (licence OFL), chargée localement par next/font.
const policeTexte = Hanken_Grotesk({
  variable: "--font-texte",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: { default: "PS Time", template: "%s | PS Time" },
  description: "Application de pointage des équipes : arrivées, pauses et heures travaillées.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${policeTexte.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

import Image from "next/image";
import { LogoEntreprise } from "@/components/entreprise/logo-entreprise";
import { lireLogoAffiche } from "@/lib/donnees/entreprise";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { BordNuage } from "./bord-nuage";
import { Ondulations } from "./ondulations";
import { OrbiteIcones } from "./orbite-icones";

/** Petits points lumineux du panneau (décor). Positions en pourcentage. */
const POINTS: { haut: number; gauche: number; taillePx: number }[] = [
  { haut: 8, gauche: 12, taillePx: 4 },
  { haut: 14, gauche: 70, taillePx: 3 },
  { haut: 30, gauche: 6, taillePx: 3 },
  { haut: 46, gauche: 82, taillePx: 4 },
  { haut: 62, gauche: 10, taillePx: 3 },
  { haut: 72, gauche: 60, taillePx: 3 },
];

/**
 * Partie gauche de la carte de connexion : logo, icônes du pointage en orbite et accroche,
 * fermée par un bord en nuage. Bandeau compact sur téléphone. Le logo de l'entreprise, s'il existe,
 * est placé sous celui de PS Time.
 */
export async function PanneauMarque() {
  const logo = await lireLogoAffiche();
  return (
    <aside className="relative isolate overflow-hidden bg-marine pb-16 text-white lg:flex lg:flex-col lg:pb-0 lg:pe-16">
      {/* Grands disques discrets en arrière-plan, comme des planètes. */}
      <span
        className="absolute -start-16 -top-16 -z-10 size-56 rounded-full bg-primaire/60"
        aria-hidden="true"
      />
      <span
        className="absolute -bottom-10 start-1/3 -z-10 hidden size-40 rounded-full bg-accent/20 lg:block"
        aria-hidden="true"
      />
      {POINTS.map((point) => (
        <span
          key={`${point.haut}-${point.gauche}`}
          className="absolute -z-10 hidden rounded-full bg-white/50 lg:block"
          style={{
            top: `${point.haut}%`,
            left: `${point.gauche}%`,
            width: point.taillePx,
            height: point.taillePx,
          }}
          aria-hidden="true"
        />
      ))}

      {/* Téléphone et tablette : bandeau compact. */}
      <div className="flex items-center gap-4 px-6 pt-8 sm:px-10 lg:hidden">
        <Image
          src="/logo-ps-time.webp"
          alt={TEXTES_CONNEXION.altLogo}
          width={1155}
          height={1163}
          priority
          sizes="64px"
          className="size-16 shrink-0"
        />
        <div>
          <p className="text-xl font-semibold leading-tight">{TEXTES_CONNEXION.bienvenue}</p>
          <p className="mt-1 text-sm text-white/85">{TEXTES_CONNEXION.accroche}</p>
        </div>
      </div>
      <div className="px-6 pt-4 sm:px-10 lg:hidden empty:hidden">
        <LogoEntreprise logo={logo} className="h-14 max-w-48 px-3 py-2" />
      </div>

      {/* Ordinateur : logo au centre des icônes en orbite. */}
      <div className="relative hidden min-h-0 flex-1 items-center justify-center lg:flex">
        <div className="absolute inset-0 scale-[0.6] xl:scale-[0.7]">
          <Ondulations />
          <OrbiteIcones />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Image
            src="/logo-ps-time.webp"
            alt={TEXTES_CONNEXION.altLogo}
            width={1155}
            height={1163}
            priority
            sizes="128px"
            className="size-28 xl:size-32"
          />
          <LogoEntreprise logo={logo} className="h-16 max-w-52 px-3 py-2 shadow-flottant" />
        </div>
      </div>

      <div className="relative z-10 hidden px-10 pb-10 lg:block">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">
          {TEXTES_CONNEXION.bienvenue}
        </p>
        <p className="mt-2 max-w-sm text-3xl font-semibold leading-tight">
          {TEXTES_CONNEXION.accroche}
        </p>
        <p className="mt-3 max-w-sm text-base text-white/85">
          {TEXTES_CONNEXION.phraseAppui}
        </p>
      </div>

      <div className="lg:hidden">
        <BordNuage sens="horizontal" />
      </div>
      <div className="hidden lg:block">
        <BordNuage sens="vertical" />
      </div>
    </aside>
  );
}

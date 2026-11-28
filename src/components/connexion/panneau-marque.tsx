import Image from "next/image";
import { LogoEntreprise } from "@/components/entreprise/logo-entreprise";
import { DateDuJour } from "@/components/ui/date-du-jour";
import { HorlogePalettes } from "@/components/ui/horloge-palettes";
import { lireLogoAffiche } from "@/lib/donnees/entreprise";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { Cadran } from "./cadran";

function LogoPsTime({ className, sizes }: { className: string; sizes: string }) {
  return <Image src="/logo-ps-time.webp" alt={TEXTES_CONNEXION.altLogo} width={1155} height={1163} priority sizes={sizes} className={className} />;
}

/**
 * Partie gauche de la carte de connexion : logo PS Time et, dessous, celui de l'entreprise s'il
 * existe ; sur ordinateur, l'heure de Casablanca en palettes sur un cadran gradué, puis l'accroche.
 * Bandeau compact sur téléphone et tablette.
 */
export async function PanneauMarque() {
  const logo = await lireLogoAffiche();
  return (
    <aside className="relative isolate overflow-hidden bg-marine text-white">
      {/* Téléphone et tablette : bandeau compact. */}
      <div className="flex flex-col gap-4 px-6 py-6 sm:px-10 lg:hidden">
        <div className="flex items-center gap-4">
          <LogoPsTime sizes="56px" className="size-14 shrink-0" />
          <div>
            <p className="text-xl font-semibold leading-tight">{TEXTES_CONNEXION.bienvenue}</p>
            <p className="mt-1 text-sm text-white/85">{TEXTES_CONNEXION.accroche}</p>
          </div>
        </div>
        <LogoEntreprise logo={logo} className="h-14 max-w-56 self-start px-3 py-2" />
      </div>

      {/* Ordinateur. */}
      <div className="hidden h-full flex-col gap-8 p-10 lg:flex xl:p-12">
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <LogoPsTime sizes="56px" className="size-14 shrink-0" />
            <span className="text-2xl font-bold tracking-tight">{TEXTES_NAVIGATION.nomApplication}</span>
          </div>
          <LogoEntreprise logo={logo} className="h-20 max-w-64 px-4 py-3 shadow-flottant" />
        </div>

        <div className="relative grid min-h-64 flex-1 place-items-center">
          <Cadran className="absolute inset-0 m-auto aspect-square h-full max-h-[24rem] max-w-full" />
          <div className="relative flex flex-col items-center gap-3">
            <HorlogePalettes libelle={TEXTES_CONNEXION.heureCasablanca} teinte="sombre" />
            <p className="text-base font-medium text-white/85">
              <DateDuJour attente="bg-white/10" />
            </p>
          </div>
        </div>

        <div>
          <p className="max-w-sm text-balance text-3xl font-semibold leading-tight">{TEXTES_CONNEXION.accroche}</p>
          <p className="mt-3 max-w-sm text-base text-white/85">{TEXTES_CONNEXION.phraseAppui}</p>
        </div>
      </div>
    </aside>
  );
}

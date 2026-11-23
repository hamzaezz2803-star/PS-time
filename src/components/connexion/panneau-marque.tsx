import Image from "next/image";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { Ondulations } from "./ondulations";
import { OrbiteIcones } from "./orbite-icones";

/** Moitié gauche de l'écran de connexion (ordinateur uniquement). */
export function PanneauMarque() {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col overflow-hidden bg-marine text-white lg:flex lg:w-1/2">
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="absolute inset-0 scale-75 xl:scale-100">
          <Ondulations />
          <OrbiteIcones />
        </div>
        <Image
          src="/logo-ps-time.webp"
          alt={TEXTES_CONNEXION.altLogo}
          width={1155}
          height={1163}
          priority
          sizes="176px"
          className="relative z-10 size-36 xl:size-44"
        />
      </div>

      <div className="relative z-10 px-12 pb-12">
        <p className="max-w-md text-3xl font-semibold leading-tight">
          {TEXTES_CONNEXION.accroche}
        </p>
        <p className="mt-3 max-w-md text-base text-white/85">
          {TEXTES_CONNEXION.phraseAppui}
        </p>
      </div>
    </aside>
  );
}

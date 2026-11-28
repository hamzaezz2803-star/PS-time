import { BookOpen, Calculator, RotateCcw, type LucideIcon } from "lucide-react";
import { TEXTES_COMPTEURS } from "@/lib/textes/compteurs";
import type { FichePackCompteur } from "@/types";

const textes = TEXTES_COMPTEURS.pack;

/** Explication d'un compteur du pack : fonctionnement d'origine, calcul dans PS Time, remise à zéro. */
export function ExplicationPack({ pack }: { pack: FichePackCompteur }) {
  const rubriques: { Icone: LucideIcon; titre: string; texte: string | null }[] = [
    { Icone: BookOpen, titre: textes.fonctionnement, texte: pack.fonctionnement },
    { Icone: Calculator, titre: textes.adaptation, texte: pack.adaptation },
    { Icone: RotateCcw, titre: textes.remiseAZero, texte: pack.remiseAZero },
  ];
  return (
    <dl className="flex flex-col gap-3.5">
      {rubriques
        .filter((rubrique) => rubrique.texte)
        .map(({ Icone, titre, texte }) => (
          <div key={titre} className="flex flex-col gap-1">
            <dt className="flex items-center gap-2 text-sm font-semibold text-marine">
              <Icone className="size-4 shrink-0 text-primaire" aria-hidden="true" />
              {titre}
            </dt>
            <dd className="ms-6 text-sm leading-relaxed text-texte">{texte}</dd>
          </div>
        ))}
    </dl>
  );
}

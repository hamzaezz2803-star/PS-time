"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type PointerEvent } from "react";
import { ChevronDown } from "lucide-react";
import { useMenuDeroulant } from "@/components/ui/utiliser-menu-deroulant";
import type { Droits } from "@/lib/metier/droits";
import { TEXTES_NAVIGATION } from "@/lib/textes/navigation";
import { cn } from "@/lib/utils";
import { estLienActif, menusVisibles, type MenuNavigation } from "./navigation";
import { PanneauMenu } from "./panneau-menu";
import { TiroirNavigation } from "./tiroir-navigation";

// Entrée active : texte en gras et trait sous l'entrée (jamais la couleur seule).
// Le fond de survol est un repère unique qui glisse d'une entrée à l'autre (voir BarreNavigation).
const ENTREE =
  "relative flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm font-medium text-texte-secondaire transition-colors duration-150 hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire";
const ENTREE_ACTIVE =
  "font-semibold text-marine after:absolute after:inset-x-2.5 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-primaire";

// Icônes des menus seulement sur un grand écran et un texte de taille normale ou grande :
// sinon, la barre manquerait de place (mesuré de 1280 à 1920 px).
const ICONE_ENTREE = "hidden size-4 shrink-0 min-[1800px]:not-in-data-[taille=tres_grande]:block";

/** Vrai pour une souris : au doigt, le menu s'ouvre seulement au toucher (sinon il s'ouvrirait puis se refermerait). */
const estSouris = (evenement: PointerEvent) => evenement.pointerType === "mouse";

function MenuDeroulant({ menu, chemin, alignerAFin }: { menu: MenuNavigation; chemin: string; alignerAFin: boolean }) {
  const { estOuvert, ouvrir, basculer, fermer, conteneur } = useMenuDeroulant();
  const sections = menu.sections ?? [];
  const contientPageActive = sections.some((section) => section.liens.some((lien) => estLienActif(lien.href, chemin)));
  const idPanneau = `menu-${menu.libelle}`;
  const Icone = menu.icone;

  return (
    <div
      ref={conteneur}
      className="relative"
      onPointerEnter={(evenement) => estSouris(evenement) && ouvrir()}
      onPointerLeave={(evenement) => estSouris(evenement) && fermer()}
    >
      <button
        type="button"
        onClick={basculer}
        aria-expanded={estOuvert}
        aria-controls={idPanneau}
        className={cn(ENTREE, contientPageActive && ENTREE_ACTIVE, estOuvert && "text-texte")}
      >
        <Icone className={ICONE_ENTREE} aria-hidden="true" />
        {menu.libelle}
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none", estOuvert && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {estOuvert && <PanneauMenu id={idPanneau} sections={sections} chemin={chemin} alignerAFin={alignerAFin} onChoisir={fermer} />}
    </div>
  );
}

/** Menus dans la barre à partir de 1280 px (1536 px avec le texte très grand) ; tiroir en dessous. */
export const MENUS_VISIBLES = "hidden xl:block in-data-[taille=tres_grande]:max-2xl:hidden";
export const TIROIR_VISIBLE = "xl:hidden in-data-[taille=tres_grande]:max-2xl:block";

type Repere = { gauche: number; largeur: number };

/** Barre de navigation (ordinateur) et tiroir (mobile), limités aux pages accordées au compte. */
export function BarreNavigation({ droits }: { droits: Droits }) {
  const chemin = usePathname();
  const menus = menusVisibles(droits);
  const [repere, setRepere] = useState<Repere | null>(null);
  const [estRepereVisible, setEstRepereVisible] = useState(false);

  const survoler = (evenement: PointerEvent<HTMLLIElement>) => {
    if (!estSouris(evenement)) return;
    const entree = evenement.currentTarget;
    setRepere({ gauche: entree.offsetLeft, largeur: entree.offsetWidth });
    setEstRepereVisible(true);
  };

  return (
    <>
      <nav aria-label={TEXTES_NAVIGATION.menuPrincipal} className={MENUS_VISIBLES}>
        <ul className="relative flex items-center gap-0.5" onPointerLeave={() => setEstRepereVisible(false)}>
          {repere && (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute start-0 top-1/2 h-10 rounded-lg bg-primaire/10 transition-[transform,width,opacity] duration-200 ease-out motion-reduce:transition-none",
                estRepereVisible ? "opacity-100" : "opacity-0",
              )}
              style={{ width: repere.largeur, transform: `translate(${repere.gauche}px, -50%)` }}
            />
          )}
          {menus.map((menu, rang) => {
            // Les derniers menus s'ouvrent vers la gauche pour ne pas sortir de l'écran.
            const alignerAFin = rang >= menus.length - 2;
            if (!menu.href) {
              return (
                <li key={menu.libelle} onPointerEnter={survoler}>
                  <MenuDeroulant menu={menu} chemin={chemin} alignerAFin={alignerAFin} />
                </li>
              );
            }
            const estActif = chemin === menu.href;
            const Icone = menu.icone;
            return (
              <li key={menu.libelle} onPointerEnter={survoler}>
                <Link href={menu.href} aria-current={estActif ? "page" : undefined} className={cn(ENTREE, estActif && ENTREE_ACTIVE)}>
                  <Icone className={ICONE_ENTREE} aria-hidden="true" />
                  {menu.libelle}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <TiroirNavigation menus={menus} chemin={chemin} />
    </>
  );
}

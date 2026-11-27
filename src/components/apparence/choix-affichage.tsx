import { ClockAlert, FileBarChart, Users } from "lucide-react";
import { DENSITES, MODES_IMPRESSION, MODES_MENU } from "@/lib/constantes";
import type { Apparence, Densite, ModeImpression, ModeMenu } from "@/lib/metier/apparence";
import { TEXTES_APPARENCE as textes } from "@/lib/textes/apparence";
import { cn } from "@/lib/utils";
import { CarteChoix } from "./carte-choix";
import { Section } from "./section-apparence";

const ICONES_EXEMPLE = [Users, ClockAlert, FileBarChart];

/** Exemple de barre de menus, avec ou sans icônes. */
function ExempleMenus({ mode }: { mode: ModeMenu }) {
  return (
    <span className="flex flex-wrap items-center gap-3 rounded-lg border border-bordure bg-surface px-3 py-2 text-sm font-medium text-texte" aria-hidden="true">
      {textes.exempleMenus.map((libelle, rang) => {
        const Icone = ICONES_EXEMPLE[rang];
        return (
          <span key={libelle} className="flex items-center gap-1.5">
            {mode === "icones" && <Icone className="size-4 text-texte-secondaire" />}
            {libelle}
          </span>
        );
      })}
    </span>
  );
}

/** Exemple de tableau : trois lignes plus ou moins hautes. */
function ExempleDensite({ densite }: { densite: Densite }) {
  return (
    <span className="flex flex-col divide-y divide-bordure rounded-lg border border-bordure bg-surface" aria-hidden="true">
      {[0, 1, 2].map((ligne) => (
        <span key={ligne} className={cn("flex items-center gap-2 px-3", densite === "confortable" ? "py-2.5" : "py-1")}>
          <span className="h-2 w-16 rounded-sm bg-bordure-champ" />
          <span className="h-2 w-10 rounded-sm bg-bordure" />
        </span>
      ))}
    </span>
  );
}

/** Exemple de cases du planning imprimées selon le mode (palette fixe, codes écrits). */
function ExempleImpression({ mode }: { mode: ModeImpression }) {
  const cases = [
    { code: "J8", teinte: "bg-surface text-marine border-bordure" },
    { code: "CA", teinte: "bg-regle-orange-fond text-regle-orange border-regle-orange/40" },
    { code: "MIS", teinte: "bg-regle-turquoise-fond text-regle-turquoise border-regle-turquoise/40" },
  ];
  return (
    <span className={cn("flex gap-1.5 rounded-lg border border-bordure bg-surface p-2", mode === "gris" && "grayscale")} aria-hidden="true">
      {cases.map(({ code, teinte }) => (
        <span key={code} className={cn("flex h-9 flex-1 items-center justify-center rounded border text-sm font-bold", mode === "noir_blanc" ? "border-texte bg-surface text-texte" : teinte)}>
          {code}
        </span>
      ))}
    </span>
  );
}

/** Menus, densité des tableaux et couleurs d'impression (réglages de toute l'installation). */
export function ChoixAffichage({ choix, actuelle, erreurs, onChange }: {
  choix: Apparence;
  actuelle: Apparence;
  erreurs?: Record<string, string>;
  onChange: (partiel: Partial<Apparence>) => void;
}) {
  return (
    <>
      <Section id="menus" titre={textes.titreMenus} aide={textes.aideMenus} erreur={erreurs?.menu}>
        <div className="grid gap-4 sm:grid-cols-2">
          {MODES_MENU.map((menu) => (
            <CarteChoix key={menu} nom="menu" valeur={menu} estChoisi={choix.menu === menu} onChoisir={() => onChange({ menu })} libelle={textes.menus[menu].libelle} detail={textes.menus[menu].detail} estActuel={actuelle.menu === menu}>
              <ExempleMenus mode={menu} />
            </CarteChoix>
          ))}
        </div>
      </Section>

      <Section id="densite" titre={textes.titreDensite} aide={textes.aideDensite} erreur={erreurs?.densite}>
        <div className="grid gap-4 sm:grid-cols-2">
          {DENSITES.map((densite) => (
            <CarteChoix key={densite} nom="densite" valeur={densite} estChoisi={choix.densite === densite} onChoisir={() => onChange({ densite })} libelle={textes.densites[densite].libelle} detail={textes.densites[densite].detail} estActuel={actuelle.densite === densite}>
              <ExempleDensite densite={densite} />
            </CarteChoix>
          ))}
        </div>
      </Section>

      <Section id="impression" titre={textes.titreImpression} aide={textes.aideImpression} erreur={erreurs?.impression}>
        <div className="grid gap-4 sm:grid-cols-3">
          {MODES_IMPRESSION.map((impression) => (
            <CarteChoix key={impression} nom="impression" valeur={impression} estChoisi={choix.impression === impression} onChoisir={() => onChange({ impression })} libelle={textes.impressions[impression].libelle} detail={textes.impressions[impression].detail} estActuel={actuelle.impression === impression}>
              <ExempleImpression mode={impression} />
            </CarteChoix>
          ))}
        </div>
      </Section>
    </>
  );
}

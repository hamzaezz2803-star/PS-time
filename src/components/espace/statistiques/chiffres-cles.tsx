import { CalendarRange, CircleAlert, Clock4, Timer, UserCheck, UserX } from "lucide-react";
import { formaterDuree } from "@/lib/metier/programme";
import { tauxPresence, type BilanJour } from "@/lib/metier/statistiques-presence";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";
import { cn } from "@/lib/utils";
import { Anneau, type PartAnneau } from "./anneau";
import { TuileStatistique } from "./tuile-statistique";

const textes = TEXTES_PRESENCE.statistiques;
const t = textes.tuiles;
type Bilan = Omit<BilanJour, "jour" | "effectif">;

const pourcent = (taux: number | null) => (taux === null ? t.sansDonnee : textes.pourcentage(taux));
const partEnPourcent = (valeur: number, total: number) => (total === 0 ? 0 : Math.round((valeur / total) * 100));

/** Parts d'un bilan (à l'heure, en retard, absents, absences justifiées), pour un anneau et sa légende. */
function partsDuBilan(bilan: Bilan): PartAnneau[] {
  return [
    { cle: "a_l_heure", libelle: textes.statuts.a_l_heure, valeur: bilan.aLHeure, trait: "stroke-graphe-a-l-heure" },
    { cle: "en_retard", libelle: textes.statuts.en_retard, valeur: bilan.enRetard, trait: "stroke-graphe-retard" },
    { cle: "absent", libelle: textes.statuts.absent, valeur: bilan.absents, trait: "stroke-graphe-absent" },
    { cle: "justifie", libelle: textes.statuts.justifie, valeur: bilan.justifies, trait: "stroke-graphe-justifie" },
  ];
}

const PASTILLES: Record<string, string> = {
  a_l_heure: "bg-graphe-a-l-heure",
  en_retard: "bg-graphe-retard",
  absent: "bg-graphe-absent",
  justifie: "bg-graphe-justifie",
};

/** Grande tuile de la période : anneau de répartition, taux au centre, légende chiffrée. */
function TuilePeriode({ cumul, periode }: { cumul: Bilan; periode: number }) {
  const parts = partsDuBilan(cumul);
  const total = parts.reduce((somme, part) => somme + part.valeur, 0);
  const libelles = parts.map((part) => t.partStatut(part.libelle, part.valeur, partEnPourcent(part.valeur, total)));

  return (
    <div className="flex flex-col rounded-xl border border-succes/25 bg-succes/5 p-5 shadow-carte sm:row-span-2">
      <CalendarRange className="mb-5 size-9 shrink-0 stroke-[1.75] text-succes" aria-hidden="true" />
      <span className="text-base font-medium text-texte">{t.tauxPeriode(periode)}</span>
      <span className="text-sm text-texte-secondaire">{t.tauxPeriodeDetail(cumul.absents)}</span>
      <Anneau
        parts={parts}
        libelleAccessible={`${t.tauxPeriode(periode)} : ${pourcent(tauxPresence(cumul))}. ${libelles.join(", ")}`}
        className="mx-auto my-5"
        taille={168}
        centre={
          <>
            <span className="text-3xl font-semibold tracking-tight text-marine tabular-nums">{pourcent(tauxPresence(cumul))}</span>
            <span className="text-sm text-texte-secondaire">{t.dePresence}</span>
          </>
        }
      />
      <ul className="mt-auto grid gap-1.5 text-sm">
        {parts.map((part) => (
          <li key={part.cle} className="flex items-center gap-2 text-texte">
            <span className={cn("size-3 shrink-0 rounded-[3px]", PASTILLES[part.cle])} aria-hidden="true" />
            <span className="flex-1">{part.libelle}</span>
            <span className="font-semibold tabular-nums">{part.valeur}</span>
            <span className="w-11 text-end text-texte-secondaire tabular-nums">{partEnPourcent(part.valeur, total)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Jauge horizontale : heures travaillées sur heures prévues. */
function JaugeHeures({ travaillees, prevues }: { travaillees: number; prevues: number }) {
  const taux = prevues === 0 ? 0 : Math.round((travaillees / prevues) * 100);
  return (
    <div role="img" aria-label={t.jaugeHeures(taux)} className="flex items-center gap-3">
      <span className="h-2.5 flex-1 overflow-hidden rounded-sm bg-surface ring-1 ring-bordure" aria-hidden="true">
        <span className="block h-full rounded-sm bg-primaire" style={{ width: `${Math.min(taux, 100)}%` }} />
      </span>
      <span className="text-sm font-semibold text-marine tabular-nums">{taux} %</span>
    </div>
  );
}

/** Chiffres clés en mosaïque : la période en grand (anneau), puis aujourd'hui et les heures. */
export function ChiffresCles({ aujourdhui, cumul, periode }: { aujourdhui: BilanJour; cumul: Bilan; periode: number }) {
  const tauxJour = tauxPresence(aujourdhui);
  const presents = aujourdhui.aLHeure + aujourdhui.enRetard;

  return (
    <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <TuilePeriode cumul={cumul} periode={periode} />
      <TuileStatistique
        libelle={t.presents}
        valeur={pourcent(tauxJour)}
        detail={t.presentsDetail(presents, presents + aujourdhui.absents)}
        Icone={UserCheck}
        ton="succes"
        visuel={
          <Anneau
            parts={[
              { cle: "presents", libelle: t.presents, valeur: presents, trait: "stroke-graphe-a-l-heure" },
              { cle: "absents", libelle: textes.statuts.absent, valeur: aujourdhui.absents, trait: "stroke-graphe-grille" },
            ]}
            libelleAccessible={`${t.presents} : ${pourcent(tauxJour)}`}
            taille={52}
            epaisseur={7}
          />
        }
      />
      <TuileStatistique libelle={t.retards} valeur={String(aujourdhui.enRetard)} detail={t.retardsDetail(formaterDuree(aujourdhui.minutesRetard))} Icone={CircleAlert} ton="attention" />
      <TuileStatistique libelle={t.absents} valeur={String(aujourdhui.absents)} detail={t.absentsDetail(aujourdhui.attendus, aujourdhui.justifies)} Icone={UserX} ton="erreur" />
      <TuileStatistique
        libelle={t.heuresTravaillees(periode)}
        valeur={formaterDuree(cumul.minutesTravaillees)}
        detail={t.heuresTravailleesDetail(formaterDuree(cumul.minutesPrevues))}
        Icone={Timer}
        ton="primaire"
        visuel={<JaugeHeures travaillees={cumul.minutesTravaillees} prevues={cumul.minutesPrevues} />}
        visuelEnBas
        className="sm:col-span-2"
      />
      <TuileStatistique libelle={t.heuresSup(periode)} valeur={formaterDuree(cumul.minutesSupplementaires)} detail={t.heuresSupDetail(formaterDuree(cumul.minutesRetard))} Icone={Clock4} ton="primaire" />
    </div>
  );
}

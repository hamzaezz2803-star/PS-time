import { Coffee, LogIn, LogOut, Timer, TimerOff, type LucideIcon } from "lucide-react";
import { Pastille } from "@/components/ui/pastille";
import { ETATS_POINTAGE } from "@/lib/constantes";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";

type Etat = (typeof ETATS_POINTAGE)[number];

const ICONES_ETAT: Record<Etat, LucideIcon> = {
  entree: LogIn,
  sortie: LogOut,
  debut_pause: Coffee,
  fin_pause: Coffee,
  debut_heures_sup: Timer,
  fin_heures_sup: TimerOff,
};
const estEtat = (valeur: string): valeur is Etat => (ETATS_POINTAGE as readonly string[]).includes(valeur);

/** État d'un pointage (Entrée, Sortie...) avec son icône ; un état inconnu est affiché tel quel. */
export function PastilleEtat({ etat }: { etat: string }) {
  if (!estEtat(etat)) return <Pastille ton="neutre">{etat}</Pastille>;
  return (
    <Pastille Icone={ICONES_ETAT[etat]} ton={etat === "entree" || etat === "fin_pause" || etat === "debut_heures_sup" ? "info" : "neutre"}>
      {TEXTES_EXCEPTIONS.pointages.etats[etat]}
    </Pastille>
  );
}

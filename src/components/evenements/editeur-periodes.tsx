"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PERIODES_PRISE_MAX } from "@/lib/constantes";
import type { PeriodePrise } from "@/lib/metier/evenements";
import { TEXTES_EVENEMENTS } from "@/lib/textes/evenements";

const { champs, sections } = TEXTES_EVENEMENTS;

/** Une ligne avec un numéro stable, pour que React garde la bonne saisie quand on retire une période. */
type Ligne = PeriodePrise & { cle: number };

/**
 * Périodes de prise : aucune ligne = toute l'année, 4 au plus. Les dates sont envoyées telles
 * quelles (« periodeDebut », « periodeFin ») et revérifiées par le serveur.
 */
export function EditeurPeriodes({ initiales, erreur }: { initiales: PeriodePrise[]; erreur?: string }) {
  const [lignes, setLignes] = useState<Ligne[]>(() => initiales.map((periode, rang) => ({ ...periode, cle: rang })));
  const [prochaineCle, setProchaineCle] = useState(initiales.length);

  const ajouter = () => {
    setLignes((actuelles) => [...actuelles, { debut: "", fin: "", cle: prochaineCle }]);
    setProchaineCle((cle) => cle + 1);
  };
  const retirer = (cle: number) => setLignes((actuelles) => actuelles.filter((ligne) => ligne.cle !== cle));

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby="aide-periodes">
      <legend className="text-base font-semibold text-marine">{sections.periodes}</legend>
      <p id="aide-periodes" className="text-sm text-texte-secondaire">{champs.aidePeriodes}</p>

      {lignes.length > 0 && (
        <ol className="flex flex-col gap-2">
          {lignes.map((ligne, rang) => (
            <li key={ligne.cle} className="flex items-end gap-2 rounded-lg border border-bordure bg-surface p-3">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <ChampFormulaire nom={`periodeDebut-${ligne.cle}`} nomEnvoi="periodeDebut" libelle={`${champs.debut} (${rang + 1})`} type="date" defaultValue={ligne.debut} className="tabular-nums" />
                <ChampFormulaire nom={`periodeFin-${ligne.cle}`} nomEnvoi="periodeFin" libelle={`${champs.fin} (${rang + 1})`} type="date" defaultValue={ligne.fin} className="tabular-nums" />
              </div>
              <BoutonIcone libelle={champs.retirerPeriode(rang + 1)} Icone={Trash2} onClick={() => retirer(ligne.cle)} estDanger />
            </li>
          ))}
        </ol>
      )}
      {lignes.length < PERIODES_PRISE_MAX && (
        <Bouton variante="contour" onClick={ajouter} className="w-fit">
          <Plus className="size-4" aria-hidden="true" />
          {champs.ajouterPeriode}
        </Bouton>
      )}
      <MessageErreur message={erreur} />
    </fieldset>
  );
}

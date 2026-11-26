"use client";

import { useState, type ReactNode } from "react";
import { Briefcase, BriefcaseBusiness, CirclePause, CirclePlay, ClockArrowDown, ClockArrowUp, Fingerprint, LoaderCircle, LogIn, LogOut } from "lucide-react";
import { pointerADistance } from "@/app/pointage/actions";
import { Bouton } from "@/components/ui/bouton";
import { ChoixCartes, type OptionCarte } from "@/components/ui/choix-cartes";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import { etatPropose } from "@/lib/metier/pointage-distance";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import { TEXTES_POINTAGE_DISTANCE } from "@/lib/textes/pointage-distance";
import { CHAMPS_POINTAGE_DISTANCE } from "@/lib/validation/pointage-distance";
import type { EtatPointage } from "@/lib/validation/pointage";
import { CartePosition } from "./carte-position";
import { PrisePhoto } from "./prise-photo";
import { usePosition } from "./utiliser-position";

const textes = TEXTES_POINTAGE_DISTANCE;
const { etats, etatsBadgeuse } = TEXTES_EXCEPTIONS.pointages;
const ICONES = {
  entree: LogIn,
  sortie: LogOut,
  debut_pause: CirclePause,
  fin_pause: CirclePlay,
  debut_mission: BriefcaseBusiness,
  fin_mission: Briefcase,
  debut_heures_sup: ClockArrowUp,
  fin_heures_sup: ClockArrowDown,
};

/**
 * Écran de pointage de l'employé : position détectée (si exigée), photo prise sur le moment
 * (si exigée), type de pointage parmi `etats` (ceux accordés sur sa fiche), puis un seul bouton « Pointer ». L'heure est celle du serveur.
 * Sur ordinateur : position et photo côte à côte, puis le pointage à côté de `aCote`
 * (pointages du jour).
 */
export function EcranPointage({
  exigePosition,
  exigePhoto,
  etats: etatsAccordes,
  dernierEtat,
  aCote,
}: {
  exigePosition: boolean;
  exigePhoto: boolean;
  etats: EtatPointage[];
  dernierEtat: string | null;
  aCote: ReactNode;
}) {
  const position = usePosition(exigePosition);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [numeroPhoto, setNumeroPhoto] = useState(0);
  const options: OptionCarte<EtatPointage>[] = etatsAccordes.map((valeur) => ({ valeur, libelle: etats[valeur], aide: etatsBadgeuse[valeur], Icone: ICONES[valeur] }));
  const [etat, setEtat] = useState<EtatPointage>(() => etatPropose(dernierEtat, etatsAccordes));
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<{ type: "succes" | "erreur"; texte: string } | null>(null);

  const positionTrouvee = position.etat.etat === "trouvee" ? position.etat.position : null;
  const manque = exigePosition && !positionTrouvee ? textes.manque.position : exigePhoto && !photo ? textes.manque.photo : null;

  async function pointer() {
    const formulaire = new FormData();
    formulaire.set(CHAMPS_POINTAGE_DISTANCE.etat, etat);
    if (positionTrouvee) {
      formulaire.set(CHAMPS_POINTAGE_DISTANCE.latitude, String(positionTrouvee.latitude));
      formulaire.set(CHAMPS_POINTAGE_DISTANCE.longitude, String(positionTrouvee.longitude));
      formulaire.set(CHAMPS_POINTAGE_DISTANCE.precision, String(positionTrouvee.precisionMetres));
    }
    if (photo) formulaire.set(CHAMPS_POINTAGE_DISTANCE.photo, new File([photo], "pointage.jpg", { type: "image/jpeg" }));

    setEnCours(true);
    setMessage(null);
    const resultat = await pointerADistance(formulaire);
    setEnCours(false);
    if (!resultat.ok) return setMessage({ type: "erreur", texte: resultat.erreur });
    setMessage({ type: "succes", texte: resultat.donnees.message });
    // Pointage suivant : nouvelle photo, état suivant proposé.
    setEtat(etatPropose(etat, etatsAccordes));
    setPhoto(null);
    setNumeroPhoto((numero) => numero + 1);
  }

  return (
    <>
      {(exigePosition || exigePhoto) && (
        <div className={exigePosition && exigePhoto ? "grid gap-5 lg:grid-cols-2 lg:gap-6" : "grid gap-5"}>
          {exigePosition && <CartePosition etat={position.etat} onActualiser={position.actualiser} />}
          {exigePhoto && <PrisePhoto key={numeroPhoto} onChanger={setPhoto} />}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3 lg:items-start lg:gap-6">
        <section className="flex flex-col gap-4 rounded-xl border border-bordure bg-surface p-5 shadow-carte lg:col-span-2 lg:p-6" aria-labelledby="titre-choix">
          <h2 id="titre-choix" className="flex items-center gap-2 text-lg font-semibold text-marine">
            <Fingerprint className="size-5 text-primaire" aria-hidden="true" />
            {textes.choix.titre}
          </h2>
          <ChoixCartes nom={CHAMPS_POINTAGE_DISTANCE.etat} legende={textes.choix.legende} options={options} valeur={etat} onChanger={setEtat} classeGrille="grid-cols-2" />

          <div aria-live="polite">
            {message?.type === "succes" && <MessageSucces message={message.texte} />}
            {message?.type === "erreur" && <MessageErreur message={message.texte} className="rounded-lg border border-erreur/30 bg-erreur/5 p-3" />}
          </div>

          <Bouton onClick={pointer} disabled={enCours || manque !== null} className="min-h-14 w-full text-lg lg:min-h-14" aria-describedby={manque ? "pointage-manque" : undefined}>
            {enCours ? <LoaderCircle className="size-6 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Fingerprint className="size-6" aria-hidden="true" />}
            {enCours ? textes.enCours : `${textes.pointer} : ${etats[etat]}`}
          </Bouton>
          {manque && (
            <p id="pointage-manque" className="text-center text-sm text-texte-secondaire">
              {manque}
            </p>
          )}
        </section>
        {aCote}
      </div>
    </>
  );
}

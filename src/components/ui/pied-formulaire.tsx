import { LoaderCircle } from "lucide-react";
import { Bouton } from "./bouton";
import { MessageErreur } from "./message-erreur";

/**
 * Pied d'un formulaire en fenêtre : erreur générale annoncée aux lecteurs d'écran, puis
 * bouton principal (désactivé pendant l'envoi, à droite) et « Annuler ».
 */
export function PiedFormulaire({
  message,
  enCours,
  libelle,
  libelleEnCours,
  libelleAnnuler,
  onAnnuler,
}: {
  message?: string;
  enCours: boolean;
  libelle: string;
  libelleEnCours: string;
  libelleAnnuler: string;
  onAnnuler: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-bordure bg-fond px-5 py-3 sm:px-6">
      <div role="alert" aria-live="polite">
        <MessageErreur message={message} className="mb-3 rounded-lg border border-erreur/30 bg-erreur/5 p-3" />
      </div>
      {/* Le bouton principal vient en premier dans le code : c'est lui que déclenche la touche Entrée. */}
      <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        <Bouton type="submit" disabled={enCours}>
          {enCours && <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {enCours ? libelleEnCours : libelle}
        </Bouton>
        <Bouton variante="fantome" onClick={onAnnuler}>
          {libelleAnnuler}
        </Bouton>
      </div>
    </div>
  );
}

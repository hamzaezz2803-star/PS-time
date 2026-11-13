import { LoaderCircle } from "lucide-react";
import { Bouton } from "./bouton";
import { MessageErreur } from "./message-erreur";

/** Erreur générale annoncée aux lecteurs d'écran, puis bouton principal désactivé pendant l'envoi. */
export function PiedFormulaire({
  message,
  enCours,
  libelle,
  libelleEnCours,
}: {
  message?: string;
  enCours: boolean;
  libelle: string;
  libelleEnCours: string;
}) {
  return (
    <>
      <div role="alert" aria-live="polite">
        <MessageErreur message={message} className="rounded-lg border border-erreur/30 bg-erreur/5 p-3" />
      </div>
      <Bouton type="submit" disabled={enCours} className="w-full sm:w-fit">
        {enCours && (
          <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        )}
        {enCours ? libelleEnCours : libelle}
      </Bouton>
    </>
  );
}

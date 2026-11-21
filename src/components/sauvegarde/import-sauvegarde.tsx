"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Upload } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import { CHEMIN_CONNEXION, CHEMIN_IMPORT_SAUVEGARDE, MOT_CONFIRMATION_IMPORT, TAILLE_MAX_IMPORT_OCTETS } from "@/lib/constantes";
import { TEXTES_SAUVEGARDE as textes } from "@/lib/textes/sauvegarde";
import type { ReponseImportSauvegarde } from "@/types";
import { CarteSauvegarde } from "./carte-sauvegarde";

type Etat = { enCours: boolean; reponse: ReponseImportSauvegarde | null };

/** Vérifications du navigateur, pour un message immédiat ; le serveur refait tout. */
function erreurAvantEnvoi(fichier: File | null, confirmation: string): string | null {
  if (!fichier || fichier.size === 0) return textes.erreursSaisie.fichier;
  if (fichier.size > TAILLE_MAX_IMPORT_OCTETS) return textes.erreursSaisie.taille;
  if (confirmation !== MOT_CONFIRMATION_IMPORT) return textes.erreursSaisie.confirmation;
  return null;
}

/** Import d'une sauvegarde PS Time signée, envoyée à la route protégée ; confirmation par un mot à retaper. */
export function ImportSauvegarde() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [etat, setEtat] = useState<Etat>({ enCours: false, reponse: null });

  async function envoyer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const formulaire = new FormData(evenement.currentTarget);
    const fichier = formulaire.get("fichier");
    const erreur = erreurAvantEnvoi(fichier instanceof File ? fichier : null, confirmation);
    if (erreur) return setEtat({ enCours: false, reponse: { ok: false, message: erreur } });

    setEtat({ enCours: true, reponse: null });
    let reponse: ReponseImportSauvegarde;
    try {
      const resultat = await fetch(CHEMIN_IMPORT_SAUVEGARDE, { method: "POST", body: formulaire });
      reponse = (await resultat.json()) as ReponseImportSauvegarde;
    } catch {
      reponse = { ok: false, message: textes.echecImport };
    }
    setEtat({ enCours: false, reponse });
    if (reponse.ok) {
      setConfirmation("");
      if (!reponse.reconnexion) router.refresh();
    }
  }

  const reponse = etat.reponse;
  return (
    <CarteSauvegarde id="titre-import" titre={textes.import.titre} description={textes.import.description}>
      <ul className="flex list-disc flex-col gap-1 ps-5 text-sm text-texte-secondaire">
        <li>{textes.import.avantImport}</li>
        <li>{textes.import.externe}</li>
      </ul>
      <form onSubmit={envoyer} className="flex flex-col gap-4" aria-busy={etat.enCours}>
        <ChampFormulaire nom="fichier" type="file" accept=".sql" required libelle={textes.import.fichier} aide={textes.import.aideFichier} className="py-2 lg:py-1.5" />
        <ChampFormulaire
          nom="confirmation"
          libelle={textes.import.confirmation}
          aide={textes.import.aideConfirmation}
          autoComplete="off"
          spellCheck={false}
          value={confirmation}
          onChange={(evenement) => setConfirmation(evenement.target.value)}
          className="sm:max-w-xs"
        />
        <Bouton type="submit" variante="contour" disabled={etat.enCours || confirmation !== MOT_CONFIRMATION_IMPORT} className="self-start border-erreur text-erreur">
          {etat.enCours ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
          {etat.enCours ? textes.import.enCours : textes.import.bouton}
        </Bouton>
        <div aria-live="polite">
          {reponse && !reponse.ok && <MessageErreur message={reponse.message} className="text-base" />}
          {reponse?.ok && (
            <div className="flex flex-col gap-3">
              <MessageSucces message={reponse.message} />
              {reponse.reconnexion && (
                <p className="flex flex-wrap items-center gap-3 text-base text-texte">
                  {textes.reconnexion}
                  <Link href={CHEMIN_CONNEXION} className="font-semibold text-primaire underline underline-offset-2">
                    {textes.import.reconnecter}
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </form>
    </CarteSauvegarde>
  );
}

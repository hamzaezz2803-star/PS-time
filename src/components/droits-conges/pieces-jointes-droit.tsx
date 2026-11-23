"use client";

import { useActionState, useState } from "react";
import { ExternalLink, FileImage, FileText, LoaderCircle, Paperclip, Upload, X } from "lucide-react";
import { ajouterPiecesJointes, retirerPieceJointe } from "@/app/(connecte)/presence/droits-conges/actions";
import { Bouton } from "@/components/ui/bouton";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import { CHEMIN_PIECES_JOINTES_DROITS } from "@/lib/constantes";
import { TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import type { EtatFormulaire, PieceJointeDroit } from "@/types";
import { ChampFichiers } from "./champ-pieces-jointes";

const ETAT_INITIAL: EtatFormulaire = {};

/** Une pièce : icône du format, nom, taille, ouverture dans un nouvel onglet et retrait. */
function LignePiece({ droitId, piece }: { droitId: string; piece: PieceJointeDroit }) {
  const [etat, action, enCours] = useActionState(retirerPieceJointe, ETAT_INITIAL);
  const Icone = piece.typeMime === "application/pdf" ? FileText : FileImage;
  return (
    <li className="flex flex-col gap-1 py-2">
      <div className="flex items-center gap-3">
        <Icone className="size-5 shrink-0 text-primaire" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-texte">{piece.nomFichier}</span>
          <span className="text-sm tabular-nums text-texte-secondaire">{textes.taille(piece.tailleOctets)}</span>
        </span>
        <a
          href={`${CHEMIN_PIECES_JOINTES_DROITS}/${piece.id}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={textes.ouvrir(piece.nomFichier)}
          className="inline-flex size-11 items-center justify-center rounded-md text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire lg:size-9"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
        <form action={action}>
          <input type="hidden" name="droitId" value={droitId} />
          <input type="hidden" name="pieceId" value={piece.id} />
          <button
            type="submit"
            disabled={enCours}
            aria-label={textes.retirer(piece.nomFichier)}
            className="inline-flex size-11 items-center justify-center rounded-md text-erreur hover:bg-erreur/5 focus-visible:outline-2 focus-visible:outline-primaire disabled:opacity-50 lg:size-9"
          >
            {enCours ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
          </button>
        </form>
      </div>
      <MessageErreur message={etat.message} />
    </li>
  );
}

/** Ajout de pièces à un droit existant. */
function AjoutPieces({ droitId }: { droitId: string }) {
  const [etat, action, enCours] = useActionState(ajouterPiecesJointes, ETAT_INITIAL);
  return (
    <form action={action} className="flex flex-col gap-3 border-t border-bordure pt-4">
      <input type="hidden" name="id" value={droitId} />
      <ChampFichiers erreur={etat.erreursChamps?.fichiers} requis />
      <MessageErreur message={etat.message} />
      <MessageSucces message={etat.succes?.message} />
      <Bouton type="submit" variante="contour" disabled={enCours} className="w-full sm:w-fit">
        {enCours ? <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Upload className="size-5" aria-hidden="true" />}
        {enCours ? textes.ajoutEnCours : textes.ajouterPieces}
      </Bouton>
    </form>
  );
}

/** Bouton « Pièces jointes (n) » d'une ligne de droit, et sa fenêtre (consulter, ajouter, retirer). */
export function PiecesJointesDroit({ droitId, nomEmploye, pieces }: { droitId: string; nomEmploye: string; pieces: PieceJointeDroit[] }) {
  const [estOuverte, setEstOuverte] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setEstOuverte(true)}
        aria-label={textes.libellePiecesJointes(nomEmploye)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9"
      >
        <Paperclip className="size-4" aria-hidden="true" />
        <span className="tabular-nums">{pieces.length}</span>
      </button>
      <FenetreModale ouverte={estOuverte} onFermer={() => setEstOuverte(false)} titre={textes.titrePiecesJointes} libelleFermer={textes.fermer}>
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="text-base font-semibold text-marine">{nomEmploye}</p>
          {pieces.length === 0 ? (
            <p className="rounded-lg border border-bordure bg-fond p-4 text-sm text-texte-secondaire">{textes.aucunePieceJointe}</p>
          ) : (
            <ul className="divide-y divide-bordure">
              {pieces.map((piece) => (
                <LignePiece key={piece.id} droitId={droitId} piece={piece} />
              ))}
            </ul>
          )}
          <AjoutPieces droitId={droitId} />
        </div>
      </FenetreModale>
    </>
  );
}

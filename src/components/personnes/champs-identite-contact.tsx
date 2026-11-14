"use client";

import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection } from "@/components/ui/champ-selection";
import {
  GENRES,
  LONGUEUR_MAX_EMAIL,
  LONGUEUR_MAX_NUMERO_PIECE,
  TYPES_PIECE_IDENTITE,
} from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";

const { formulaire: textes } = TEXTES_PERSONNES;
const OPTIONS_GENRE = GENRES.map((genre) => ({ valeur: genre, libelle: textes.genres[genre] }));
const OPTIONS_PIECE = TYPES_PIECE_IDENTITE.map((type) => ({ valeur: type, libelle: textes.typesPiece[type] }));

/** Onglet « Identité et contact » : genre, pièce d'identité, téléphone et e-mail (tous facultatifs). */
export function ChampsIdentiteContact({
  valeurs,
  erreurs,
}: {
  valeurs: Record<string, string>;
  erreurs?: Record<string, string | undefined>;
}) {
  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      <ChampSelection nom="genre" libelle={textes.genre} options={OPTIONS_GENRE} optionVide={textes.aucunGenre} defaultValue={valeurs.genre ?? ""} erreur={erreurs?.genre} />
      <div className="hidden sm:block" aria-hidden="true" />
      <ChampSelection nom="typePieceIdentite" libelle={textes.typePiece} options={OPTIONS_PIECE} optionVide={textes.aucunePiece} defaultValue={valeurs.typePieceIdentite ?? ""} erreur={erreurs?.typePieceIdentite} />
      <ChampFormulaire nom="numeroPieceIdentite" libelle={textes.numeroPiece} defaultValue={valeurs.numeroPieceIdentite ?? ""} maxLength={LONGUEUR_MAX_NUMERO_PIECE} autoComplete="off" spellCheck={false} aide={textes.aidePiece} erreur={erreurs?.numeroPieceIdentite} />
      <ChampFormulaire nom="telephone" libelle={textes.telephone} type="tel" inputMode="tel" defaultValue={valeurs.telephone ?? ""} placeholder={textes.exempleTelephone} autoComplete="off" erreur={erreurs?.telephone} />
      <ChampFormulaire nom="email" libelle={textes.email} type="email" defaultValue={valeurs.email ?? ""} placeholder={textes.exempleEmail} maxLength={LONGUEUR_MAX_EMAIL} autoComplete="off" spellCheck={false} erreur={erreurs?.email} />
    </div>
  );
}

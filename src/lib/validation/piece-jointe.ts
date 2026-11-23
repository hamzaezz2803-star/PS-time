import { PIECE_JOINTE_TAILLE_MAX_OCTETS, PIECES_JOINTES_PAR_ENVOI_MAX } from "@/lib/constantes";
import { nettoyerNomFichier, verifierPieceJointe, type TypePieceJointe } from "@/lib/metier/pieces-jointes";
import { TEXTES_DROITS_CONGES } from "@/lib/textes/droits-conges";

const { erreurs } = TEXTES_DROITS_CONGES;
const MAX_MO = PIECE_JOINTE_TAILLE_MAX_OCTETS / (1024 * 1024);

/** Pièce vérifiée (signature, taille), prête à être enregistrée. */
export type PieceJointeRecue = { nomFichier: string; type: TypePieceJointe; contenu: Buffer };

export type LecturePiecesJointes = { ok: true; pieces: PieceJointeRecue[] } | { ok: false; erreur: string };

/**
 * Fichiers envoyés dans le champ `nomChamp` (« fichiers »). Un champ de fichier vide envoie un
 * fichier sans nom ni contenu : il est ignoré. `obligatoire` : au moins un fichier.
 */
export async function lirePiecesJointes(formulaire: FormData, obligatoire: boolean, nomChamp = "fichiers"): Promise<LecturePiecesJointes> {
  const fichiers = formulaire.getAll(nomChamp).filter((valeur): valeur is File => valeur instanceof File && (valeur.size > 0 || valeur.name !== ""));
  if (fichiers.length === 0) return obligatoire ? { ok: false, erreur: erreurs.fichiersVides } : { ok: true, pieces: [] };
  if (fichiers.length > PIECES_JOINTES_PAR_ENVOI_MAX) return { ok: false, erreur: erreurs.tropDeFichiers(PIECES_JOINTES_PAR_ENVOI_MAX) };

  const pieces: PieceJointeRecue[] = [];
  for (const fichier of fichiers) {
    const nomFichier = nettoyerNomFichier(fichier.name);
    // Taille annoncée vérifiée avant de lire le contenu en mémoire.
    if (fichier.size > PIECE_JOINTE_TAILLE_MAX_OCTETS) return { ok: false, erreur: erreurs.fichierTropLourd(nomFichier, MAX_MO) };
    const contenu = Buffer.from(await fichier.arrayBuffer());
    const verification = verifierPieceJointe(contenu);
    if (!verification.ok) {
      return { ok: false, erreur: verification.erreur === "taille" ? erreurs.fichierTropLourd(nomFichier, MAX_MO) : erreurs.fichierFormat(nomFichier) };
    }
    pieces.push({ nomFichier, type: verification.type, contenu });
  }
  return { ok: true, pieces };
}

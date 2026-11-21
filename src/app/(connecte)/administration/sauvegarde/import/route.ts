import { basename } from "node:path";
import { revalidateTag } from "next/cache";
import { enregistrerTrace } from "@/lib/actions/notifier";
import { CHEMIN_SAUVEGARDE, MOT_CONFIRMATION_IMPORT, TAILLE_MAX_IMPORT_OCTETS } from "@/lib/constantes";
import { ETIQUETTE_APPARENCE } from "@/lib/donnees/apparence";
import { obtenirPool } from "@/lib/donnees/base";
import { autoriserSauvegarde } from "@/lib/donnees/sauvegarde-acces";
import { lireSecretSauvegarde } from "@/lib/donnees/sauvegarde-export";
import { importerSauvegarde, type ResultatImport } from "@/lib/donnees/sauvegarde-import";
import { TEXTES_SAUVEGARDE as textes } from "@/lib/textes/sauvegarde";
import type { ReponseImportSauvegarde } from "@/types";

/** Marge pour les en-têtes du formulaire multipart autour du fichier. */
const MARGE_FORMULAIRE_OCTETS = 64 * 1024;

const repondre = (reponse: ReponseImportSauvegarde, statut = 200) => Response.json(reponse, { status: statut, headers: { "Cache-Control": "no-store" } });

/** Lit le formulaire : fichier .sql de taille permise et mot de confirmation exact. */
async function lireFormulaire(requete: Request): Promise<{ fichier: File } | { erreur: string }> {
  const longueur = Number(requete.headers.get("content-length"));
  if (!Number.isFinite(longueur) || longueur > TAILLE_MAX_IMPORT_OCTETS + MARGE_FORMULAIRE_OCTETS) return { erreur: textes.erreursSaisie.taille };
  const formulaire = await requete.formData();
  if (formulaire.get("confirmation") !== MOT_CONFIRMATION_IMPORT) return { erreur: textes.erreursSaisie.confirmation };
  const fichier = formulaire.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0 || !fichier.name.toLowerCase().endsWith(".sql")) return { erreur: textes.erreursSaisie.fichier };
  if (fichier.size > TAILLE_MAX_IMPORT_OCTETS) return { erreur: textes.erreursSaisie.taille };
  return { fichier };
}

/** Restauration d'une sauvegarde signée (super administrateur). Remplace toutes les données dans une transaction. */
export async function POST(requete: Request) {
  const utilisateur = await autoriserSauvegarde(requete);
  if (!utilisateur) return repondre({ ok: false, message: textes.droits }, 403);

  let resultat: ResultatImport;
  let nomFichier: string;
  try {
    const formulaire = await lireFormulaire(requete);
    if ("erreur" in formulaire) return repondre({ ok: false, message: formulaire.erreur }, 400);
    nomFichier = formulaire.fichier.name.slice(0, 100);
    resultat = await importerSauvegarde(obtenirPool(), lireSecretSauvegarde(), await formulaire.fichier.text());
  } catch (erreur) {
    console.error("Échec de l'import d'une sauvegarde", { type: erreur instanceof Error ? erreur.name : "inconnu" });
    return repondre({ ok: false, message: textes.echecImport }, 500);
  }
  if (!resultat.ok) {
    console.warn("Import de sauvegarde refusé", { par: utilisateur.identifiant, raison: resultat.erreur });
    return repondre({ ok: false, message: textes.erreurs[resultat.erreur] }, 400);
  }

  // Les réglages d'apparence viennent aussi du fichier.
  revalidateTag(ETIQUETTE_APPARENCE, { expire: 0 });
  const sauvegardeAvant = basename(resultat.sauvegardeAvant);
  console.info("Sauvegarde importée", { par: utilisateur.identifiant, avecComptes: resultat.avecComptes, lignes: resultat.lignes, sauvegardeAvant });
  await enregistrerTrace({
    action: "modification",
    objet: "sauvegarde",
    libelle: textes.libelleImport(nomFichier, resultat.avecComptes),
    lien: CHEMIN_SAUVEGARDE,
    // Comptes remplacés : l'identifiant du compte peut ne plus exister, le nom suffit.
    auteur: { id: resultat.avecComptes ? null : utilisateur.id, nom: utilisateur.nom, identifiant: utilisateur.identifiant },
  });
  return repondre({ ok: true, message: textes.importReussi(resultat.tables, resultat.lignes, sauvegardeAvant), reconnexion: resultat.avecComptes });
}

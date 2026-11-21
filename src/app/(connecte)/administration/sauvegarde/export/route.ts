import { enregistrerTrace } from "@/lib/actions/notifier";
import { CHEMIN_SAUVEGARDE } from "@/lib/constantes";
import { obtenirPool } from "@/lib/donnees/base";
import { autoriserSauvegarde } from "@/lib/donnees/sauvegarde-acces";
import { genererSauvegarde, lireSecretSauvegarde } from "@/lib/donnees/sauvegarde-export";
import { nomFichierSauvegarde } from "@/lib/metier/sauvegarde";
import { TEXTES_SAUVEGARDE as textes } from "@/lib/textes/sauvegarde";

const journaliserEchec = (erreur: unknown) =>
  console.error("Échec de l'export de la sauvegarde", { type: erreur instanceof Error ? erreur.name : "inconnu" });

/** Téléchargement de toutes les données en SQL signé (super administrateur, formulaire POST de la page). */
export async function POST(requete: Request) {
  const utilisateur = await autoriserSauvegarde(requete);
  if (!utilisateur) return new Response(textes.droits, { status: 403 });
  const avecComptes = (await requete.formData()).get("comptes") === "oui";

  const encodeur = new TextEncoder();
  let generateur: AsyncGenerator<string>;
  let premier: IteratorResult<string>;
  try {
    generateur = genererSauvegarde(obtenirPool(), lireSecretSauvegarde(), avecComptes);
    // Premier morceau lu avant de répondre : une base injoignable donne un message, pas un fichier coupé.
    premier = await generateur.next();
  } catch (erreur) {
    journaliserEchec(erreur);
    return new Response(textes.export.echec, { status: 500 });
  }

  await enregistrerTrace({
    action: "export",
    objet: "sauvegarde",
    libelle: textes.libelleExport(avecComptes),
    lien: CHEMIN_SAUVEGARDE,
    auteur: { id: utilisateur.id, nom: utilisateur.nom, identifiant: utilisateur.identifiant },
  });
  console.info("Sauvegarde exportée", { par: utilisateur.identifiant, avecComptes });

  let enAttente: IteratorResult<string> | null = premier;
  const flux = new ReadableStream<Uint8Array>({
    async pull(controleur) {
      try {
        const morceau = enAttente ?? (await generateur.next());
        enAttente = null;
        if (morceau.done) controleur.close();
        else controleur.enqueue(encodeur.encode(morceau.value));
      } catch (erreur) {
        journaliserEchec(erreur);
        controleur.error(erreur);
      }
    },
    async cancel() {
      await generateur.return(undefined);
    },
  });

  return new Response(flux, {
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomFichierSauvegarde("ps-time-sauvegarde", new Date())}"`,
      // Fichier très sensible : jamais gardé en cache par le navigateur ou un proxy.
      "Cache-Control": "no-store",
    },
  });
}

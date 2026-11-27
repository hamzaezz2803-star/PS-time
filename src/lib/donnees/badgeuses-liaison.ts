import "server-only";

import { Socket } from "node:net";
import { DELAI_REPONSE_BADGEUSE_MS, PORT_BADGEUSE } from "@/lib/constantes";
import { COMMANDES_ZK, NUMERO_REPONSE_INITIAL, REPONSES_ZK, construirePaquet, lireReponse, type ReponseZk } from "@/lib/metier/badgeuses/protocole-zk";

/** Pourquoi une liaison a échoué : traduit en statut lisible par l'appelant. */
export type RaisonEchec = "injoignable" | "non_reconnue" | "protegee";

export class ErreurBadgeuse extends Error {
  constructor(readonly raison: RaisonEchec) {
    super(`Badgeuse : ${raison}`);
    this.name = "ErreurBadgeuse";
  }
}

/** Ouvre la connexion TCP ; échoue après le délai si personne ne répond. */
function ouvrirSocket(adresse: string, delaiMs: number): Promise<Socket> {
  return new Promise((resoudre, rejeter) => {
    const socket = new Socket();
    // Une erreur réseau tardive ne doit jamais arrêter le serveur : elle est traitée par « close ».
    socket.on("error", () => undefined);
    const minuterie = setTimeout(() => echouer(), delaiMs);
    const echouer = () => {
      clearTimeout(minuterie);
      socket.destroy();
      rejeter(new ErreurBadgeuse("injoignable"));
    };
    socket.once("error", echouer);
    socket.connect(PORT_BADGEUSE, adresse, () => {
      clearTimeout(minuterie);
      socket.off("error", echouer);
      resoudre(socket);
    });
  });
}

/** Vrai si le port des badgeuses est ouvert à cette adresse (recherche rapide, rien n'est envoyé). */
export async function portOuvert(adresse: string, delaiMs: number): Promise<boolean> {
  try {
    const socket = await ouvrirSocket(adresse, delaiMs);
    socket.destroy();
    return true;
  } catch {
    return false;
  }
}

/** Envoie un paquet et attend la réponse complète. */
function echanger(socket: Socket, paquet: Uint8Array): Promise<ReponseZk> {
  return new Promise((resoudre, rejeter) => {
    let recu = new Uint8Array();
    const terminer = (resultat: ReponseZk | ErreurBadgeuse) => {
      clearTimeout(minuterie);
      socket.off("data", surDonnees);
      socket.off("error", surCoupure);
      socket.off("close", surCoupure);
      if (resultat instanceof ErreurBadgeuse) rejeter(resultat);
      else resoudre(resultat);
    };
    const surCoupure = () => terminer(new ErreurBadgeuse("injoignable"));
    const surDonnees = (morceau: Buffer) => {
      const suite = new Uint8Array(recu.length + morceau.length);
      suite.set(recu);
      suite.set(morceau, recu.length);
      recu = suite;
      const reponse = lireReponse(recu);
      if (reponse === "incomplet") return;
      terminer(reponse ?? new ErreurBadgeuse("non_reconnue"));
    };
    const minuterie = setTimeout(() => terminer(new ErreurBadgeuse("injoignable")), DELAI_REPONSE_BADGEUSE_MS);
    socket.on("data", surDonnees);
    socket.once("error", surCoupure);
    socket.once("close", surCoupure);
    socket.write(paquet);
  });
}

export type LiaisonBadgeuse = {
  /** Envoie une commande ; null si la badgeuse la refuse (modèle qui ne la connaît pas). */
  commander(commande: number, donnees?: Uint8Array): Promise<Uint8Array | null>;
};

/**
 * Ouvre une session avec la badgeuse, exécute le travail, puis ferme toujours proprement.
 * Une seule commande à la fois : la badgeuse répond dans l'ordre.
 */
export async function avecBadgeuse<T>(adresse: string, travail: (liaison: LiaisonBadgeuse) => Promise<T>): Promise<T> {
  const socket = await ouvrirSocket(adresse, DELAI_REPONSE_BADGEUSE_MS);
  let session = 0;
  let numero = NUMERO_REPONSE_INITIAL;
  const envoyer = async (commande: number, donnees?: Uint8Array) => {
    const reponse = await echanger(socket, construirePaquet(commande, session, numero, donnees));
    numero = reponse.numero;
    return reponse;
  };

  try {
    const connexion = await envoyer(COMMANDES_ZK.connexion);
    if (connexion.commande === REPONSES_ZK.nonAutorise) throw new ErreurBadgeuse("protegee");
    if (connexion.commande !== REPONSES_ZK.ok) throw new ErreurBadgeuse("non_reconnue");
    session = connexion.session;
    const resultat = await travail({
      async commander(commande, donnees) {
        const reponse = await envoyer(commande, donnees);
        return reponse.commande === REPONSES_ZK.ok ? reponse.donnees : null;
      },
    });
    await envoyer(COMMANDES_ZK.sortie).catch(() => null);
    return resultat;
  } finally {
    socket.destroy();
  }
}

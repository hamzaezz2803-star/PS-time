"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { verifierCodeInstallation } from "@/app/connexion/actions";
import { Bouton } from "@/components/ui/bouton";
import { ChampSaisie } from "@/components/ui/champ-saisie";
import { Etiquette } from "@/components/ui/etiquette";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageErreur } from "@/components/ui/message-erreur";
import { MessageSucces } from "@/components/ui/message-succes";
import { clientAuthentification } from "@/lib/client-authentification";
import { CHEMIN_ESPACE, IDENTIFIANT_INSTALLATION, LONGUEUR_MAX_IDENTIFIANT } from "@/lib/constantes";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { validerIdentifiants } from "@/lib/validation/connexion";
import type { ErreursChampsConnexion } from "@/types";
import { ChampAvecIcone } from "./champ-avec-icone";
import { ChampMotDePasse } from "./champ-mot-de-passe";
import { messagePourErreurConnexion } from "./erreurs-connexion";
import { FormulairePremierCompte } from "./formulaire-premier-compte";

const { champs, installation } = TEXTES_CONNEXION;

/**
 * Connexion par identifiant et mot de passe. « pstime » + mot de passe du jour (première
 * installation seulement) ouvre la fenêtre de création du compte administrateur ; on revient
 * ensuite ici pour se connecter avec ce nouveau compte.
 */
export function FormulaireConnexion() {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreursChamps, setErreursChamps] = useState<ErreursChampsConnexion>({});
  const [message, setMessage] = useState<string>();
  const [messageSucces, setMessageSucces] = useState<string>();
  const [jetonInstallation, setJetonInstallation] = useState<string | null>(null);
  // Change après la création du compte : le formulaire repart avec le nouvel identifiant.
  const [saisie, setSaisie] = useState({ numero: 0, identifiant: "" });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const formulaire = new FormData(evenement.currentTarget);
    const validation = validerIdentifiants(formulaire.get("identifiant"), formulaire.get("motDePasse"));

    setMessage(undefined);
    setMessageSucces(undefined);
    setErreursChamps(validation.ok ? {} : (validation.erreursChamps ?? {}));
    if (!validation.ok) return;
    const { identifiant, motDePasse } = validation.donnees;

    setEnCours(true);
    if (identifiant === IDENTIFIANT_INSTALLATION) {
      const resultat = await verifierCodeInstallation(motDePasse);
      setEnCours(false);
      if (resultat.ok) setJetonInstallation(resultat.jeton);
      else setMessage(resultat.message);
      return;
    }

    // La validation définitive (limite de tentatives, compte actif) est faite par le serveur.
    const { error } = await clientAuthentification.signIn.username({ username: identifiant, password: motDePasse });
    if (error) {
      setMessage(messagePourErreurConnexion(error));
      setEnCours(false);
      return;
    }
    router.replace(CHEMIN_ESPACE);
  }

  function compteCree(identifiant: string) {
    setJetonInstallation(null);
    setSaisie((precedente) => ({ numero: precedente.numero + 1, identifiant }));
    setMessageSucces(installation.reussite);
  }

  const erreurIdentifiant = erreursChamps.identifiant;
  const erreurMotDePasse = erreursChamps.motDePasse;

  return (
    <>
      <form key={saisie.numero} onSubmit={soumettre} noValidate className="flex flex-col gap-5">
        <MessageSucces message={messageSucces} />
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="identifiant">{champs.identifiant.libelle}</Etiquette>
          <ChampAvecIcone icone={UserRound}>
            <ChampSaisie
              id="identifiant"
              className="ps-11"
              name="identifiant"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={LONGUEUR_MAX_IDENTIFIANT}
              defaultValue={saisie.identifiant}
              placeholder={champs.identifiant.exemple}
              required
              aria-invalid={erreurIdentifiant ? true : undefined}
              aria-describedby={erreurIdentifiant ? "erreur-identifiant" : undefined}
            />
          </ChampAvecIcone>
          <MessageErreur id="erreur-identifiant" message={erreurIdentifiant} />
        </div>

        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="motDePasse">{champs.motDePasse.libelle}</Etiquette>
          <ChampAvecIcone icone={LockKeyhole}>
            <ChampMotDePasse
              id="motDePasse"
              className="ps-11"
              name="motDePasse"
              autoComplete="current-password"
              required
              autoFocus={saisie.numero > 0}
              aria-invalid={erreurMotDePasse ? true : undefined}
              aria-describedby={erreurMotDePasse ? "erreur-mot-de-passe" : undefined}
            />
          </ChampAvecIcone>
          <MessageErreur id="erreur-mot-de-passe" message={erreurMotDePasse} />
        </div>

        <div role="alert" aria-live="polite">
          <MessageErreur message={message} className="rounded-lg border border-erreur/30 bg-erreur/5 p-3" />
        </div>

        <Bouton type="submit" disabled={enCours} className="w-full">
          {enCours && <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {enCours ? TEXTES_CONNEXION.boutonConnexionEnCours : TEXTES_CONNEXION.boutonConnexion}
        </Bouton>
      </form>

      <FenetreModale
        ouverte={jetonInstallation !== null}
        onFermer={() => setJetonInstallation(null)}
        titre={installation.titre}
        libelleFermer={installation.fermer}
      >
        {jetonInstallation && (
          <FormulairePremierCompte jeton={jetonInstallation} onCree={compteCree} onAnnuler={() => setJetonInstallation(null)} />
        )}
      </FenetreModale>
    </>
  );
}

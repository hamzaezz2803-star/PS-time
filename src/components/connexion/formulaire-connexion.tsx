"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { ChampSaisie } from "@/components/ui/champ-saisie";
import { Etiquette } from "@/components/ui/etiquette";
import { MessageErreur } from "@/components/ui/message-erreur";
import { clientAuthentification } from "@/lib/client-authentification";
import { CHEMIN_ESPACE } from "@/lib/constantes";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import { validerIdentifiants } from "@/lib/validation/connexion";
import type { ErreursChampsConnexion } from "@/types";
import { ChampMotDePasse } from "./champ-mot-de-passe";
import { messagePourErreurConnexion } from "./erreurs-connexion";

const { champs } = TEXTES_CONNEXION;

export function FormulaireConnexion() {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreursChamps, setErreursChamps] = useState<ErreursChampsConnexion>({});
  const [message, setMessage] = useState<string>();

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const formulaire = new FormData(evenement.currentTarget);
    const validation = validerIdentifiants(
      formulaire.get("email"),
      formulaire.get("motDePasse"),
    );

    setMessage(undefined);
    setErreursChamps(validation.ok ? {} : (validation.erreursChamps ?? {}));
    if (!validation.ok) return;

    setEnCours(true);
    // La validation définitive (format, limite de tentatives, compte actif) est faite par le serveur.
    const { error } = await clientAuthentification.signIn.email({
      email: validation.donnees.email,
      password: validation.donnees.motDePasse,
    });

    if (error) {
      setMessage(messagePourErreurConnexion(error));
      setEnCours(false);
      return;
    }

    router.replace(CHEMIN_ESPACE);
  }

  const erreurEmail = erreursChamps.email;
  const erreurMotDePasse = erreursChamps.motDePasse;

  return (
    <form onSubmit={soumettre} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Etiquette htmlFor="email">{champs.email.libelle}</Etiquette>
        <ChampSaisie
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={champs.email.exemple}
          required
          aria-invalid={erreurEmail ? true : undefined}
          aria-describedby={erreurEmail ? "erreur-email" : undefined}
        />
        <MessageErreur id="erreur-email" message={erreurEmail} />
      </div>

      <div className="flex flex-col gap-2">
        <Etiquette htmlFor="motDePasse">{champs.motDePasse.libelle}</Etiquette>
        <ChampMotDePasse
          id="motDePasse"
          name="motDePasse"
          autoComplete="current-password"
          required
          aria-invalid={erreurMotDePasse ? true : undefined}
          aria-describedby={erreurMotDePasse ? "erreur-mot-de-passe" : undefined}
        />
        <MessageErreur id="erreur-mot-de-passe" message={erreurMotDePasse} />
      </div>

      <div role="alert" aria-live="polite">
        <MessageErreur
          message={message}
          className="rounded-lg border border-erreur/30 bg-erreur/5 p-3"
        />
      </div>

      <Bouton type="submit" disabled={enCours} className="w-full">
        {enCours && (
          <LoaderCircle
            className="size-5 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        {enCours
          ? TEXTES_CONNEXION.boutonConnexionEnCours
          : TEXTES_CONNEXION.boutonConnexion}
      </Bouton>
    </form>
  );
}

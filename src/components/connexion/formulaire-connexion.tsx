"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { connecter } from "@/app/connexion/actions";
import { Bouton } from "@/components/ui/bouton";
import { ChampSaisie } from "@/components/ui/champ-saisie";
import { Etiquette } from "@/components/ui/etiquette";
import { MessageErreur } from "@/components/ui/message-erreur";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import type { EtatConnexion } from "@/types";
import { ChampMotDePasse } from "./champ-mot-de-passe";

const ETAT_INITIAL: EtatConnexion = { email: "" };
const { champs } = TEXTES_CONNEXION;

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState(connecter, ETAT_INITIAL);
  const erreurEmail = etat.erreursChamps?.email;
  const erreurMotDePasse = etat.erreursChamps?.motDePasse;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Etiquette htmlFor="email">{champs.email.libelle}</Etiquette>
        <ChampSaisie
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={champs.email.exemple}
          defaultValue={etat.email}
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
          message={etat.message}
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

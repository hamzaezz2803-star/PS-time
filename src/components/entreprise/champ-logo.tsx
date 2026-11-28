"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp, ImageOff, LoaderCircle, Trash2, Undo2 } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { CHEMIN_LOGO_ENTREPRISE, LOGO_ENTREPRISE_TAILLE_MAX_OCTETS } from "@/lib/constantes";
import { TEXTES_ENTREPRISE } from "@/lib/textes/entreprise";
import { reduireLogo } from "./reduire-logo";

const { logo: textes, erreurs } = TEXTES_ENTREPRISE;

/** Ce que l'utilisateur a choisi pour le logo, envoyé avec le formulaire par FormulaireEntreprise. */
export type ChoixLogo = { fichier: File | null; estRetire: boolean };
export const CHOIX_LOGO_INITIAL: ChoixLogo = { fichier: null, estRetire: false };

/**
 * Logo de l'entreprise : aperçu sur fond blanc (comme sur la connexion et dans la barre), choix
 * d'une image (réduite dans le navigateur avant l'envoi) et retrait.
 */
export function ChampLogo({ logoVersion, choix, onChange, erreur }: { logoVersion: number | null; choix: ChoixLogo; onChange: (choix: ChoixLogo) => void; erreur?: string }) {
  const champChoix = useRef<HTMLInputElement>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreurLocale, setErreurLocale] = useState<string>();
  const [apercu, setApercu] = useState<string | null>(null);

  // Adresse temporaire de l'aperçu, créée pour le fichier choisi et libérée quand il change.
  useEffect(() => {
    if (!choix.fichier) return;
    const adresse = URL.createObjectURL(choix.fichier);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- l'adresse dépend d'un objet du navigateur créé ici.
    setApercu(adresse);
    return () => URL.revokeObjectURL(adresse);
  }, [choix.fichier]);

  const logoActuel = logoVersion ? `${CHEMIN_LOGO_ENTREPRISE}?v=${logoVersion}` : null;
  const imageAffichee = choix.fichier ? apercu : choix.estRetire ? null : logoActuel;

  const choisir = async (fichier: File | undefined) => {
    if (!fichier) return;
    setEnCours(true);
    setErreurLocale(undefined);
    const logo = await reduireLogo(fichier);
    setEnCours(false);
    if (champChoix.current) champChoix.current.value = "";
    if (!logo) return setErreurLocale(erreurs.logoLecture);
    if (logo.size > LOGO_ENTREPRISE_TAILLE_MAX_OCTETS) return setErreurLocale(erreurs.logoTaille);
    onChange({ fichier: logo, estRetire: false });
  };

  const etat = enCours ? textes.traitement : choix.estRetire ? textes.retire : null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-3 ring-1 ring-bordure sm:w-48">
        {imageAffichee ? (
          // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:) ou route dédiée : pas d'optimisation possible.
          <img src={imageAffichee} alt={textes.libelle} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm text-texte-secondaire">
            <ImageOff className="size-6" aria-hidden="true" />
            {textes.aucun}
          </span>
        )}
        {enCours && (
          <span className="absolute inset-0 flex items-center justify-center bg-surface/80">
            <LoaderCircle className="size-6 animate-spin text-primaire motion-reduce:animate-none" aria-hidden="true" />
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {etat && <p id="etat-logo" className="text-sm text-texte-secondaire">{etat}</p>}
        <div className="flex flex-wrap gap-2">
          <Bouton variante="contour" onClick={() => champChoix.current?.click()} disabled={enCours} aria-describedby={etat ? "etat-logo" : undefined}>
            <ImageUp className="size-4" aria-hidden="true" />
            {imageAffichee ? textes.changer : textes.choisir}
          </Bouton>
          {imageAffichee && (
            <Bouton variante="fantome" onClick={() => onChange({ fichier: null, estRetire: Boolean(logoActuel) })} disabled={enCours}>
              <Trash2 className="size-4" aria-hidden="true" />
              {textes.retirer}
            </Bouton>
          )}
          {choix.estRetire && (
            <Bouton variante="fantome" onClick={() => onChange(CHOIX_LOGO_INITIAL)}>
              <Undo2 className="size-4" aria-hidden="true" />
              {textes.annulerRetrait}
            </Bouton>
          )}
        </div>
        <div role="alert" aria-live="polite">
          <MessageErreur message={erreurLocale ?? erreur} />
        </div>
      </div>
      {/* Choix du fichier, jamais envoyé tel quel : le logo réduit est joint à l'envoi du formulaire. */}
      <input ref={champChoix} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => choisir(e.target.files?.[0])} />
    </div>
  );
}

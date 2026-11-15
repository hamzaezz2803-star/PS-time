"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, Trash2, Undo2, UserRound } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { MessageErreur } from "@/components/ui/message-erreur";
import { CHEMIN_PHOTO_EMPLOYE, PHOTO_TAILLE_MAX_OCTETS } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { redimensionnerPhoto } from "./redimensionner-photo";

const { photo: textes, erreurs } = TEXTES_PERSONNES;

/**
 * Photo de profil dans le formulaire : aperçu, choix (recadrée et allégée avant l'envoi),
 * retrait. Le fichier préparé est placé dans le champ caché « photo » envoyé avec le formulaire.
 */
export function ChampPhoto({ employeId, photoModifieeLe, erreur }: { employeId?: string; photoModifieeLe: Date | null; erreur?: string }) {
  const champEnvoye = useRef<HTMLInputElement>(null);
  const champChoix = useRef<HTMLInputElement>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [estRetiree, setEstRetiree] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreurLocale, setErreurLocale] = useState<string>();

  // Libère l'adresse temporaire de l'aperçu quand il change ou que le champ disparaît.
  useEffect(() => {
    return () => {
      if (apercu) URL.revokeObjectURL(apercu);
    };
  }, [apercu]);

  const photoActuelle = employeId && photoModifieeLe ? `${CHEMIN_PHOTO_EMPLOYE(employeId)}?v=${new Date(photoModifieeLe).getTime()}` : null;
  const imageAffichee = apercu ?? (estRetiree ? null : photoActuelle);

  const choisir = async (fichier: File | undefined) => {
    if (!fichier) return;
    setEnCours(true);
    setErreurLocale(undefined);
    const photo = await redimensionnerPhoto(fichier);
    setEnCours(false);
    if (champChoix.current) champChoix.current.value = "";
    if (!photo) return setErreurLocale(erreurs.photoLecture);
    if (photo.size > PHOTO_TAILLE_MAX_OCTETS) return setErreurLocale(erreurs.photoTaille);
    const transfert = new DataTransfer();
    transfert.items.add(photo);
    if (champEnvoye.current) champEnvoye.current.files = transfert.files;
    setApercu(URL.createObjectURL(photo));
    setEstRetiree(false);
  };

  const retirer = () => {
    if (champEnvoye.current) champEnvoye.current.value = "";
    setApercu(null);
    setEstRetiree(Boolean(photoActuelle));
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-bordure bg-fond/60 p-4">
      <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface text-texte-secondaire ring-1 ring-bordure">
        {imageAffichee ? (
          // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:) ou route protégée : pas d'optimisation possible.
          <img src={imageAffichee} alt={textes.libelle} className="size-full object-cover" />
        ) : (
          <UserRound className="size-9" aria-hidden="true" />
        )}
        {enCours && (
          <span className="absolute inset-0 flex items-center justify-center bg-surface/80">
            <LoaderCircle className="size-6 animate-spin text-primaire motion-reduce:animate-none" aria-hidden="true" />
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <p className="text-sm font-medium text-texte">{textes.libelle}</p>
          <p id="aide-photo" className="text-sm text-texte-secondaire">{enCours ? textes.traitement : estRetiree ? textes.retiree : textes.aide}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Bouton variante="contour" onClick={() => champChoix.current?.click()} disabled={enCours} aria-describedby="aide-photo">
            <Camera className="size-4" aria-hidden="true" />
            {imageAffichee ? textes.changer : textes.choisir}
          </Bouton>
          {imageAffichee && (
            <Bouton variante="fantome" onClick={retirer} disabled={enCours}>
              <Trash2 className="size-4" aria-hidden="true" />
              {textes.retirer}
            </Bouton>
          )}
          {estRetiree && (
            <Bouton variante="fantome" onClick={() => setEstRetiree(false)}>
              <Undo2 className="size-4" aria-hidden="true" />
              {textes.annulerRetrait}
            </Bouton>
          )}
        </div>
        <div role="alert" aria-live="polite">
          <MessageErreur message={erreurLocale ?? erreur} />
        </div>
      </div>
      {/* Choix du fichier (jamais envoyé tel quel), puis fichier préparé et demande de retrait, envoyés. */}
      <input ref={champChoix} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => choisir(e.target.files?.[0])} />
      <input ref={champEnvoye} type="file" name="photo" className="hidden" tabIndex={-1} aria-hidden="true" />
      {estRetiree && <input type="hidden" name="retirerPhoto" value="oui" />}
    </div>
  );
}

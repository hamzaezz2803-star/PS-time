"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, SwitchCamera } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { PHOTO_POINTAGE_COTE_MAX_PIXELS, PHOTO_POINTAGE_QUALITE_JPEG, PHOTO_POINTAGE_TAILLE_MAX_OCTETS } from "@/lib/constantes";
import { TEXTES_POINTAGE_DISTANCE } from "@/lib/textes/pointage-distance";
import { cn } from "@/lib/utils";

const textes = TEXTES_POINTAGE_DISTANCE.photo;
type EtatCamera = "arret" | "demarrage" | "actif" | "prise" | "refusee" | "indisponible" | "echec";
/** Caméra arrière (le lieu) ou avant (l'employé). */
type Cote = "environment" | "user";

/** Qualités essayées tour à tour pour rester sous 200 Ko. */
const QUALITES = [PHOTO_POINTAGE_QUALITE_JPEG, 0.6, 0.4];

/** Image de la vidéo réduite à 640 px au plus, en JPEG de 200 Ko au plus, ou null. */
async function capturer(video: HTMLVideoElement): Promise<Blob | null> {
  const echelle = Math.min(1, PHOTO_POINTAGE_COTE_MAX_PIXELS / Math.max(video.videoWidth, video.videoHeight));
  const toile = document.createElement("canvas");
  toile.width = Math.round(video.videoWidth * echelle);
  toile.height = Math.round(video.videoHeight * echelle);
  toile.getContext("2d")?.drawImage(video, 0, 0, toile.width, toile.height);
  for (const qualite of QUALITES) {
    const image = await new Promise<Blob | null>((resoudre) => toile.toBlob(resoudre, "image/jpeg", qualite));
    if (image && image.size <= PHOTO_POINTAGE_TAILLE_MAX_OCTETS) return image;
  }
  return null;
}

/**
 * Photo prise sur le moment : le lieu (caméra arrière par défaut) ou l'employé (caméra avant).
 * Elle reste dans le navigateur jusqu'au pointage ; la caméra est coupée dès la photo prise ou
 * en quittant la page.
 */
export function PrisePhoto({ onChanger }: { onChanger: (photo: Blob | null) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const flux = useRef<MediaStream | null>(null);
  const [etat, setEtat] = useState<EtatCamera>("arret");
  const [cote, setCote] = useState<Cote>("environment");
  const [apercu, setApercu] = useState<string | null>(null);

  const couperCamera = () => {
    flux.current?.getTracks().forEach((piste) => piste.stop());
    flux.current = null;
  };

  async function demarrer(coteVoulu: Cote) {
    if (!navigator.mediaDevices?.getUserMedia) return setEtat("indisponible");
    couperCamera();
    setCote(coteVoulu);
    setEtat("demarrage");
    try {
      // `ideal` : un ordinateur sans caméra arrière prend sa seule caméra.
      flux.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: coteVoulu } }, audio: false });
      if (video.current) video.current.srcObject = flux.current;
      setEtat("actif");
    } catch (erreur) {
      setEtat(erreur instanceof DOMException && erreur.name === "NotAllowedError" ? "refusee" : "indisponible");
    }
  }

  async function prendre() {
    const image = video.current ? await capturer(video.current) : null;
    couperCamera();
    if (!image) return setEtat("echec");
    setApercu(URL.createObjectURL(image));
    setEtat("prise");
    onChanger(image);
  }

  function reprendre() {
    setApercu(null);
    onChanger(null);
    void demarrer(cote);
  }

  useEffect(() => () => flux.current?.getTracks().forEach((piste) => piste.stop()), []);
  // L'aperçu précédent est libéré dès qu'il est remplacé ou retiré.
  useEffect(() => () => {
    if (apercu) URL.revokeObjectURL(apercu);
  }, [apercu]);

  const estActif = etat === "actif";
  // Effet miroir seulement pour la caméra avant (comme un miroir) ; la photo envoyée n'est jamais inversée.
  const miroir = cote === "user" ? "-scale-x-100" : "";
  return (
    <section className="flex h-full flex-col gap-3 rounded-xl border border-bordure bg-surface p-5 shadow-carte" aria-labelledby="titre-photo">
      <h2 id="titre-photo" className="flex items-center gap-2 text-lg font-semibold text-marine">
        <Camera className="size-5 text-primaire" aria-hidden="true" />
        {textes.titre}
      </h2>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-marine sm:aspect-video">
        <video ref={video} autoPlay playsInline muted aria-label={textes.video} className={estActif ? cn("size-full object-cover", miroir) : "hidden"} />
        {/* Aperçu local (adresse blob: du navigateur), envoyé seulement avec le pointage. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {apercu && <img src={apercu} alt={textes.apercu} className="size-full object-cover" />}
        {!estActif && !apercu && <Camera className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-white/80" aria-hidden="true" />}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-center gap-2">
        {etat === "prise" ? (
          <Bouton variante="contour" onClick={reprendre}>
            <RotateCcw className="size-5" aria-hidden="true" />
            {textes.reprendre}
          </Bouton>
        ) : estActif ? (
          <>
            <Bouton variante="contour" onClick={prendre}>
              <Camera className="size-5" aria-hidden="true" />
              {textes.prendre}
            </Bouton>
            <Bouton variante="fantome" onClick={() => demarrer(cote === "user" ? "environment" : "user")}>
              <SwitchCamera className="size-5" aria-hidden="true" />
              {textes.changerCamera}
            </Bouton>
          </>
        ) : (
          <Bouton variante="contour" onClick={() => demarrer(cote)} disabled={etat === "demarrage"}>
            <Camera className="size-5" aria-hidden="true" />
            {textes.demarrer}
          </Bouton>
        )}
      </div>
      {(etat === "refusee" || etat === "indisponible" || etat === "echec") && (
        <p role="alert" className="text-center text-sm text-erreur">
          {etat === "refusee" ? textes.refusee : etat === "indisponible" ? textes.indisponible : textes.echec}
        </p>
      )}
    </section>
  );
}

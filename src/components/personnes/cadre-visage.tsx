"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ShieldCheck } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";

const textes = TEXTES_PERSONNES.acces;
type EtatCamera = "arret" | "demarrage" | "actif" | "refuse" | "indisponible";

/**
 * Aperçu de la caméra avec un cadre ovale pour vérifier le cadrage du visage. Aucune image n'est
 * prise ni envoyée : le flux reste dans le navigateur. Affiché seulement quand son onglet est
 * ouvert : le quitter démonte le composant, ce qui coupe la caméra.
 */
export function CadreVisage() {
  const video = useRef<HTMLVideoElement>(null);
  const flux = useRef<MediaStream | null>(null);
  const [etat, setEtat] = useState<EtatCamera>("arret");

  const arreter = () => {
    flux.current?.getTracks().forEach((piste) => piste.stop());
    flux.current = null;
    setEtat((actuel) => (actuel === "actif" || actuel === "demarrage" ? "arret" : actuel));
  };

  async function demarrer() {
    if (!navigator.mediaDevices?.getUserMedia) return setEtat("indisponible");
    setEtat("demarrage");
    try {
      const nouveau = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      flux.current = nouveau;
      if (video.current) video.current.srcObject = nouveau;
      setEtat("actif");
    } catch (erreur) {
      setEtat(erreur instanceof DOMException && erreur.name === "NotAllowedError" ? "refuse" : "indisponible");
    }
  }

  // Caméra coupée quand l'onglet est quitté ou la fenêtre fermée.
  useEffect(() => () => flux.current?.getTracks().forEach((piste) => piste.stop()), []);
  const estActif = etat === "actif";

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-marine">{textes.visage}</h3>
      <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl bg-marine">
        <video ref={video} autoPlay playsInline muted aria-label={textes.videoCamera} className={estActif ? "size-full -scale-x-100 object-cover" : "hidden"} />
        {/* Cadre : fond assombri autour d'un ovale, pour guider la position du visage. */}
        <svg viewBox="0 0 400 300" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <mask id="masque-visage">
              <rect width="400" height="300" fill="white" />
              <ellipse cx="200" cy="140" rx="85" ry="110" fill="black" />
            </mask>
          </defs>
          <rect width="400" height="300" fill="black" opacity={estActif ? 0.45 : 0.2} mask="url(#masque-visage)" />
          <ellipse cx="200" cy="140" rx="85" ry="110" fill="none" stroke="white" strokeWidth="3" strokeDasharray="10 8" />
        </svg>
        <p className="absolute inset-x-0 bottom-0 bg-marine/70 px-3 py-2 text-center text-sm font-medium text-white">{textes.consigneCadre}</p>
        {!estActif && <Camera className="absolute left-1/2 top-[46%] size-10 -translate-x-1/2 -translate-y-1/2 text-white/80" aria-hidden="true" />}
      </div>
      <div className="flex flex-col items-center gap-2">
        {estActif ? (
          <Bouton variante="contour" onClick={arreter}>
            <CameraOff className="size-5" aria-hidden="true" />
            {textes.arreterCamera}
          </Bouton>
        ) : (
          <Bouton variante="contour" onClick={demarrer} disabled={etat === "demarrage"}>
            <Camera className="size-5" aria-hidden="true" />
            {textes.demarrerCamera}
          </Bouton>
        )}
        {(etat === "refuse" || etat === "indisponible") && (
          <p role="alert" className="text-center text-sm text-erreur">{etat === "refuse" ? textes.cameraRefusee : textes.cameraIndisponible}</p>
        )}
      </div>
      <p className="flex items-start gap-2 rounded-lg bg-fond px-3 py-2.5 text-sm text-texte-secondaire">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-succes" aria-hidden="true" />
        {textes.aucuneImage}
      </p>
    </section>
  );
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DELAI_POSITION_MILLISECONDES } from "@/lib/constantes";
import type { Position } from "@/lib/metier/pointage-distance";

export type EtatPosition =
  | { etat: "recherche" }
  | { etat: "trouvee"; position: Position }
  | { etat: "refusee" | "indisponible" | "nonPrise" };

const abonnerARien = () => () => {};
// Côté serveur on suppose la géolocalisation présente : le navigateur corrige au premier rendu.
const geolocalisationPrise = () => "geolocation" in navigator;
const geolocalisationServeur = () => true;

/**
 * Position actuelle de l'appareil (GPS ou réseau), demandée à l'ouverture puis à chaque
 * « Actualiser ». Jamais saisie ni modifiable par l'employé.
 */
export function usePosition(estActif: boolean): { etat: EtatPosition; actualiser: () => void } {
  const estPrise = useSyncExternalStore(abonnerARien, geolocalisationPrise, geolocalisationServeur);
  const [essai, setEssai] = useState(0);
  const [etat, setEtat] = useState<EtatPosition>({ etat: "recherche" });

  useEffect(() => {
    if (!estActif || !estPrise) return;
    let estAnnule = false;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!estAnnule) setEtat({ etat: "trouvee", position: { latitude: coords.latitude, longitude: coords.longitude, precisionMetres: Math.round(coords.accuracy) } });
      },
      (erreur) => {
        if (!estAnnule) setEtat({ etat: erreur.code === erreur.PERMISSION_DENIED ? "refusee" : "indisponible" });
      },
      { enableHighAccuracy: true, timeout: DELAI_POSITION_MILLISECONDES, maximumAge: 0 },
    );
    return () => {
      estAnnule = true;
    };
  }, [estActif, estPrise, essai]);

  const actualiser = () => {
    setEtat({ etat: "recherche" });
    setEssai((precedent) => precedent + 1);
  };
  return { etat: estPrise ? etat : { etat: "nonPrise" }, actualiser };
}

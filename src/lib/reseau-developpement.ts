/**
 * Développement seulement : adresses du PC sur le réseau local (Wi-Fi, câble), détectées à chaque
 * démarrage. Le téléphone qui ouvre https://<adresse>:<port> est ainsi accepté sans rien saisir,
 * même quand le PC change de réseau. Jamais utilisé en production.
 * Sans "server-only" : ce fichier est aussi lu par next.config.ts (Node, hors application).
 */
import { networkInterfaces } from "node:os";

const PORT_PAR_DEFAUT = "3000";

/** Adresses IPv4 du PC sur ses réseaux (ex. 192.168.0.197), hors adresse interne 127.0.0.1. */
export function adressesReseauLocal(): string[] {
  return Object.values(networkInterfaces())
    .flatMap((interfaces) => interfaces ?? [])
    .filter((carte) => carte.family === "IPv4" && !carte.internal)
    .map((carte) => carte.address);
}

/** Adresses que le navigateur du téléphone (et du PC) utilise avec `npm run dev:telephone`. */
export function originesDeveloppement(): string[] {
  if (process.env.NODE_ENV !== "development") return [];
  const port = process.env.PORT ?? PORT_PAR_DEFAUT;
  return ["localhost", ...adressesReseauLocal()].map((hote) => `https://${hote}:${port}`);
}

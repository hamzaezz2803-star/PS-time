/** Code partagé par les scripts de création d'utilisateur. */
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import {
  FORMAT_IDENTIFIANT,
  IDENTIFIANT_INSTALLATION,
  LONGUEUR_MAX_IDENTIFIANT,
  LONGUEUR_MIN_IDENTIFIANT,
} from "../src/lib/constantes.ts";

const OCTETS_MOT_DE_PASSE_TEMPORAIRE = 12;

/** Nom imposé par Better Auth pour une connexion par mot de passe. */
export const FOURNISSEUR_MOT_DE_PASSE = "credential";

const schemaArguments = z.object({
  // Mêmes règles que la connexion par identifiant (sinon le compte ne pourrait pas se connecter).
  identifiant: z
    .string()
    .trim()
    .toLowerCase()
    .min(LONGUEUR_MIN_IDENTIFIANT)
    .max(LONGUEUR_MAX_IDENTIFIANT)
    .regex(FORMAT_IDENTIFIANT)
    .refine((valeur) => valeur !== IDENTIFIANT_INSTALLATION),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  nom: z.string().trim().min(1).max(100),
  "super-admin": z.boolean().default(false),
});

export type ArgumentsUtilisateur = {
  identifiant: string;
  email: string;
  nom: string;
  estSuperAdmin: boolean;
};

/** Lit et valide --identifiant, --email, --nom (et --super-admin). Quitte avec l'usage si invalide. */
export function lireArgumentsUtilisateur(usage: string): ArgumentsUtilisateur {
  const { values } = parseArgs({
    options: {
      identifiant: { type: "string" },
      email: { type: "string" },
      nom: { type: "string" },
      "super-admin": { type: "boolean" },
    },
  });
  const analyse = schemaArguments.safeParse(values);
  if (!analyse.success) {
    console.error(`Usage : ${usage}`);
    process.exit(1);
  }
  const { "super-admin": estSuperAdmin, ...reste } = analyse.data;
  return { ...reste, estSuperAdmin };
}

/**
 * Identifiant UUID v4, mot de passe temporaire aléatoire et son empreinte scrypt
 * (même fonction que Better Auth, donc reconnue à la connexion).
 */
export async function preparerNouvelUtilisateur() {
  const motDePasseTemporaire = randomBytes(OCTETS_MOT_DE_PASSE_TEMPORAIRE).toString(
    "base64url",
  );
  return {
    id: crypto.randomUUID(),
    idCompte: crypto.randomUUID(),
    motDePasseTemporaire,
    empreinte: await hashPassword(motDePasseTemporaire),
  };
}

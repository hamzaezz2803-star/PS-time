import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import {
  DUREE_SESSION_SECONDES,
  FENETRE_TENTATIVES_SECONDES,
  LONGUEUR_MAX_MOT_DE_PASSE,
  LONGUEUR_MIN_MOT_DE_PASSE,
  PROLONGATION_SESSION_SECONDES,
  TENTATIVES_CONNEXION_MAX,
} from "@/lib/constantes";
import { obtenirBase } from "./base";
import { comptes, sessions, utilisateurs, verifications } from "./schema";
import { estUtilisateurActif } from "./utilisateurs";

/** Code renvoyé au navigateur quand un compte désactivé tente de se connecter. */
export const CODE_COMPTE_DESACTIVE = "COMPTE_DESACTIVE";

const dates = { createdAt: "creeLe", updatedAt: "modifieLe" } as const;

/**
 * Authentification par Better Auth : hachage scrypt, sessions en base,
 * cookie httpOnly, limite de tentatives. Les noms de `fields` sont les clés du schéma Drizzle.
 */
export const auth = betterAuth({
  appName: "PS Time",
  database: drizzleAdapter(obtenirBase(), {
    provider: "mysql",
    schema: { utilisateurs, sessions, comptes, verifications },
  }),
  advanced: {
    database: { generateId: () => crypto.randomUUID() },
  },
  emailAndPassword: {
    enabled: true,
    // Les comptes sont créés par un administrateur, jamais par inscription libre.
    disableSignUp: true,
    minPasswordLength: LONGUEUR_MIN_MOT_DE_PASSE,
    maxPasswordLength: LONGUEUR_MAX_MOT_DE_PASSE,
  },
  user: {
    modelName: "utilisateurs",
    fields: { name: "nom", emailVerified: "emailVerifie", ...dates },
    additionalFields: {
      identifiant: { type: "string", required: true, input: false },
      doitChangerMotDePasse: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
      estActif: { type: "boolean", required: true, defaultValue: true, input: false },
      estSuperAdmin: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    modelName: "sessions",
    expiresIn: DUREE_SESSION_SECONDES,
    updateAge: PROLONGATION_SESSION_SECONDES,
    fields: {
      userId: "utilisateurId",
      token: "jeton",
      expiresAt: "expireLe",
      ipAddress: "adresseIp",
      userAgent: "agentUtilisateur",
      ...dates,
    },
  },
  account: {
    modelName: "comptes",
    fields: {
      userId: "utilisateurId",
      providerId: "fournisseurId",
      accountId: "compteId",
      password: "motDePasse",
      ...dates,
    },
  },
  verification: {
    modelName: "verifications",
    fields: {
      identifier: "identifiant",
      value: "valeur",
      expiresAt: "expireLe",
      ...dates,
    },
  },
  rateLimit: {
    // Actif aussi en développement. Stockage en mémoire : une installation = un serveur.
    enabled: true,
    customRules: {
      "/sign-in/email": {
        window: FENETRE_TENTATIVES_SECONDES,
        max: TENTATIVES_CONNEXION_MAX,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          if (!(await estUtilisateurActif(session.userId))) {
            throw new APIError("FORBIDDEN", { code: CODE_COMPTE_DESACTIVE });
          }
        },
      },
    },
  },
  plugins: [nextCookies()], // doit rester le dernier plugin
});

export type SessionAuthentifiee = typeof auth.$Infer.Session;

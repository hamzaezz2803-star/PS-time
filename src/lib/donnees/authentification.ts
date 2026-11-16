import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import {
  DUREE_SESSION_SECONDES,
  FENETRE_TENTATIVES_SECONDES,
  FORMAT_IDENTIFIANT,
  LONGUEUR_MAX_IDENTIFIANT,
  LONGUEUR_MIN_IDENTIFIANT,
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
      accessToken: "jetonAcces",
      refreshToken: "jetonRafraichissement",
      idToken: "jetonIdentite",
      accessTokenExpiresAt: "jetonAccesExpireLe",
      refreshTokenExpiresAt: "jetonRafraichissementExpireLe",
      scope: "portee",
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
      "/sign-in/username": {
        window: FENETRE_TENTATIVES_SECONDES,
        max: TENTATIVES_CONNEXION_MAX,
      },
    },
  },
  // Connexion par identifiant uniquement. Les comptes sont gérés par un administrateur :
  // pas de modification de profil par l'utilisateur, ni de test de disponibilité d'un identifiant.
  disabledPaths: ["/sign-in/email", "/update-user", "/is-username-available"],
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
  plugins: [
    // Connexion par identifiant (colonne `identifiant`, en minuscules).
    username({
      displayUsername: false,
      minUsernameLength: LONGUEUR_MIN_IDENTIFIANT,
      maxUsernameLength: LONGUEUR_MAX_IDENTIFIANT,
      usernameValidator: (identifiant) => FORMAT_IDENTIFIANT.test(identifiant),
      validationOrder: { username: "post-normalization" },
      schema: { user: { fields: { username: "identifiant" } } },
    }),
    nextCookies(), // doit rester le dernier plugin
  ],
});

export type SessionAuthentifiee = typeof auth.$Infer.Session;

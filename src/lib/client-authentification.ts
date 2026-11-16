import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Client Better Auth du navigateur (appels vers /api/auth, soumis à la limite de tentatives). */
export const clientAuthentification = createAuthClient({ plugins: [usernameClient()] });

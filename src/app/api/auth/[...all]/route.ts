import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/donnees/authentification";

export const { GET, POST } = toNextJsHandler(auth);

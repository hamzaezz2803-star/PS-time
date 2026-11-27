import { z } from "zod";
import { estAdressePrivee } from "@/lib/metier/badgeuses/reseau";

/** Adresse d'une badgeuse : IPv4 d'un réseau privé seulement (jamais une adresse d'Internet). */
export const schemaAdresseBadgeuse = z
  .string()
  .trim()
  .max(15)
  .refine(estAdressePrivee);

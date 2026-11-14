import { z } from "zod";

/** Texte d'un formulaire : espaces multiples réduits et bords retirés. */
export const texteNettoye = z.string().transform((valeur) => valeur.replace(/\s+/g, " ").trim());

/** Texte facultatif : une saisie vide devient null. */
export const texteFacultatif = texteNettoye.transform((valeur) => (valeur === "" ? null : valeur));

/** Nom obligatoire et borné. */
export const nomObligatoire = (longueurMax: number, vide: string, tropLong: string) =>
  texteNettoye.pipe(z.string().min(1, { error: vide }).max(longueurMax, { error: tropLong }));

/** Nombre entier saisi dans un champ texte, entre deux bornes. */
export const entierBorne = (minimum: number, maximum: number, erreur: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, { error: erreur })
    .transform(Number)
    .pipe(z.int().min(minimum, { error: erreur }).max(maximum, { error: erreur }));

/** Case à cocher : présente (« oui ») si cochée, absente sinon. */
export const caseCochee = z.string().transform((valeur) => valeur === "oui");

export const lireTexte = (valeur: unknown) => (typeof valeur === "string" ? valeur : "");

/** Valeurs d'un formulaire pour une liste de champs (absent = chaîne vide). */
export function lireChamps<C extends string>(formulaire: FormData, champs: readonly C[]): Record<C, string> {
  return Object.fromEntries(champs.map((champ) => [champ, lireTexte(formulaire.get(champ))])) as Record<C, string>;
}

/** Premier message d'erreur de chaque champ, sous les noms du formulaire. */
export function premieresErreurs(erreur: z.ZodError): Record<string, string> {
  const { fieldErrors } = z.flattenError(erreur);
  return Object.fromEntries(
    Object.entries(fieldErrors).flatMap(([champ, messages]) => {
      const premier = (messages as string[] | undefined)?.[0];
      return premier ? [[champ, premier]] : [];
    }),
  );
}

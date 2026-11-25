/** Erreur PostgreSQL renvoyée par le pilote `pg`, transmise par Drizzle dans `cause`. */
type ErreurPostgres = { code?: string; constraint?: string };

const CODE_DOUBLON = "23505"; // unique_violation
const CODE_CLE_ETRANGERE = "23503"; // foreign_key_violation

const erreurPostgres = (erreur: unknown): ErreurPostgres | undefined =>
  (erreur as { cause?: ErreurPostgres } | null)?.cause;

/**
 * Nom de l'index unique violé, ou null si l'erreur n'est pas un doublon.
 * Sert à dire à l'utilisateur quel champ est déjà pris.
 */
export function indexEnDoublon(erreur: unknown): string | null {
  const cause = erreurPostgres(erreur);
  if (cause?.code !== CODE_DOUBLON) return null;
  return cause.constraint ?? "";
}

/** Vrai si la suppression est bloquée par une clé étrangère (ligne encore utilisée ailleurs). */
export function estEncoreReference(erreur: unknown): boolean {
  return erreurPostgres(erreur)?.code === CODE_CLE_ETRANGERE;
}

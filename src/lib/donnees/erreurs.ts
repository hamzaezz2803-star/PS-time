/**
 * Nom de l'index unique violé (MySQL/MariaDB, code ER_DUP_ENTRY), ou null si l'erreur
 * n'est pas un doublon. Sert à dire à l'utilisateur quel champ est déjà pris.
 */
export function indexEnDoublon(erreur: unknown): string | null {
  const cause = (erreur as { cause?: { code?: string; sqlMessage?: string } } | null)?.cause;
  if (cause?.code !== "ER_DUP_ENTRY") return null;
  // Ex. : « Duplicate entry 'OP-01' for key 'postes_code_idx' » (MySQL 8 préfixe la table).
  return cause.sqlMessage?.match(/for key '(?:[^.']*\.)?([^']+)'/)?.[1] ?? "";
}

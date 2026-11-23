import { z } from "zod";
import { JOURS_DROIT_MAX, LIMITE_EMPLOYES_POINTAGE, LONGUEUR_MAX_REMARQUE_DROIT, UNITES_SAISIE_EVENEMENT } from "@/lib/constantes";
import { estNombreDeJoursValide, estValeurValidePourUnite } from "@/lib/metier/droits-conges";
import { nombreDeJours } from "@/lib/metier/evenements";
import { TEXTES_DROITS_CONGES } from "@/lib/textes/droits-conges";
import { lireTexte, premieresErreurs, texteFacultatif } from "./commun";

const { erreurs } = TEXTES_DROITS_CONGES;
const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;
/** Une période de droit couvre au plus une année bissextile. */
const DUREE_MAX_PERIODE_JOURS = 366;

const jourValide = z
  .string()
  .regex(FORMAT_JOUR, { error: erreurs.dateInvalide })
  .refine((jour) => new Date(`${jour}T00:00:00Z`).toISOString().startsWith(jour), { error: erreurs.dateInvalide });

/** « 18 », « 18,5 » ou « 18.5 » ; vide = 0 (reliquat). */
const nombreDeJoursSaisi = z
  .string()
  .trim()
  .transform((valeur) => (valeur === "" ? 0 : Number(valeur.replace(",", "."))))
  .refine((jours) => estNombreDeJoursValide(jours, JOURS_DROIT_MAX), { error: erreurs.joursInvalides(JOURS_DROIT_MAX) });

/** Choix « Oui / Non » de la fiche (boutons radio « oui » ou « non »). */
const ouiNon = (erreur: string) => z.enum(["oui", "non"], { error: erreur }).transform((valeur) => valeur === "oui");

/** Champs chiffrés du droit, contrôlés selon l'unité choisie. */
const CHAMPS_CHIFFRES = ["joursAcquis", "joursReliquat", "supplement1", "supplement2", "supplement3"] as const;

const schemaDroit = z
  .object({
    du: jourValide,
    au: jourValide,
    uniteSaisie: z.enum(UNITES_SAISIE_EVENEMENT, { error: erreurs.uniteInvalide }),
    joursAcquis: nombreDeJoursSaisi,
    joursReliquat: nombreDeJoursSaisi,
    supplement1: nombreDeJoursSaisi,
    supplement2: nombreDeJoursSaisi,
    supplement3: nombreDeJoursSaisi,
    estConfirme: ouiNon(erreurs.choixOuiNon),
    // « Solde : positif » = le solde ne peut pas devenir négatif (absence refusée).
    estBloquant: z.enum(["positif", "negatif"], { error: erreurs.choixSolde }).transform((valeur) => valeur === "positif"),
    estReporte: ouiNon(erreurs.choixOuiNon),
    remarque: texteFacultatif.pipe(z.string().max(LONGUEUR_MAX_REMARQUE_DROIT, { error: erreurs.remarqueTropLongue(LONGUEUR_MAX_REMARQUE_DROIT) }).nullable()),
  })
  .refine((droit) => droit.au >= droit.du, { path: ["au"], error: erreurs.datesIncoherentes })
  .superRefine((droit, contexte) => {
    // En jours entiers, pas de demi-journée.
    for (const champ of CHAMPS_CHIFFRES) {
      if (!estValeurValidePourUnite(droit[champ], droit.uniteSaisie, JOURS_DROIT_MAX)) {
        contexte.addIssue({ code: "custom", path: [champ], message: erreurs.valeurPourUnite(droit.uniteSaisie, JOURS_DROIT_MAX) });
      }
    }
  })
  .refine((droit) => nombreDeJours({ debut: droit.du, fin: droit.au }) <= DUREE_MAX_PERIODE_JOURS, { path: ["au"], error: erreurs.tropLong(DUREE_MAX_PERIODE_JOURS) });

const schemaCreation = z.object({
  employeIds: z
    .array(z.uuid({ error: erreurs.employeIntrouvable }))
    .min(1, { error: erreurs.employesVides })
    .max(LIMITE_EMPLOYES_POINTAGE, { error: erreurs.tropDEmployes(LIMITE_EMPLOYES_POINTAGE) })
    .transform((ids) => [...new Set(ids)]),
  evenementId: z.uuid({ error: erreurs.evenementVide }),
});

export type DonneesDroit = z.infer<typeof schemaDroit>;
export type DonneesCreationDroits = DonneesDroit & z.infer<typeof schemaCreation>;

type Validation<T> = { ok: true; donnees: T } | { ok: false; erreursChamps: Record<string, string> };

const lireDroit = (formulaire: FormData) =>
  schemaDroit.safeParse({
    du: lireTexte(formulaire.get("du")),
    au: lireTexte(formulaire.get("au")),
    uniteSaisie: lireTexte(formulaire.get("uniteSaisie")),
    joursAcquis: lireTexte(formulaire.get("joursAcquis")),
    joursReliquat: lireTexte(formulaire.get("joursReliquat")),
    supplement1: lireTexte(formulaire.get("supplement1")),
    supplement2: lireTexte(formulaire.get("supplement2")),
    supplement3: lireTexte(formulaire.get("supplement3")),
    estConfirme: lireTexte(formulaire.get("estConfirme")),
    estBloquant: lireTexte(formulaire.get("solde")),
    estReporte: lireTexte(formulaire.get("estReporte")),
    remarque: lireTexte(formulaire.get("remarque")),
  });

/** Modification d'un droit : période, jours, blocage, remarque (l'employé et l'événement ne changent pas). */
export function validerDroit(formulaire: FormData): Validation<DonneesDroit> {
  const droit = lireDroit(formulaire);
  return droit.success ? { ok: true, donnees: droit.data } : { ok: false, erreursChamps: premieresErreurs(droit.error) };
}

/** Création : les mêmes champs, pour un événement et un ou plusieurs employés. */
export function validerCreationDroits(formulaire: FormData): Validation<DonneesCreationDroits> {
  const droit = lireDroit(formulaire);
  const cible = schemaCreation.safeParse({ employeIds: formulaire.getAll("employes").map(lireTexte), evenementId: lireTexte(formulaire.get("evenementId")) });
  if (!droit.success || !cible.success) {
    return {
      ok: false,
      erreursChamps: { ...(cible.success ? {} : premieresErreurs(cible.error)), ...(droit.success ? {} : premieresErreurs(droit.error)) },
    };
  }
  return { ok: true, donnees: { ...droit.data, ...cible.data } };
}

"use client";

import { useActionState } from "react";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { confirmerDroit } from "@/app/(connecte)/presence/droits-conges/actions";
import { MessageErreur } from "@/components/ui/message-erreur";
import { TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import type { EtatFormulaire } from "@/types";

/** Bouton « Confirmer » d'un droit provisoire : ses jours deviennent utilisables (page actualisée). */
export function BoutonConfirmerDroit({ id, nomEmploye }: { id: string; nomEmploye: string }) {
  const [etat, action, enCours] = useActionState(confirmerDroit, {} as EtatFormulaire);
  return (
    <form action={action} className="flex flex-col items-end gap-1 lg:items-start">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={enCours}
        aria-label={textes.confirmer(nomEmploye)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-primaire/40 px-2.5 text-sm font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire disabled:opacity-50 lg:min-h-9"
      >
        {enCours ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CircleCheck className="size-4" aria-hidden="true" />}
        {enCours ? textes.confirmationEnCours : textes.libelleConfirmer}
      </button>
      <MessageErreur message={etat.message} />
    </form>
  );
}

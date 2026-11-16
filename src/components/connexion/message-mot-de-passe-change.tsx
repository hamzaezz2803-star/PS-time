"use client";

import { useSearchParams } from "next/navigation";
import { MessageSucces } from "@/components/ui/message-succes";
import { PARAMETRE_MOT_DE_PASSE_CHANGE } from "@/lib/constantes";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";

/** Confirmation affichée au retour sur la connexion après un changement de mot de passe. */
export function MessageMotDePasseChange() {
  const parametres = useSearchParams();
  if (!parametres.has(PARAMETRE_MOT_DE_PASSE_CHANGE)) return null;
  return <MessageSucces message={TEXTES_CONNEXION.motDePasseChange} className="mb-6" />;
}

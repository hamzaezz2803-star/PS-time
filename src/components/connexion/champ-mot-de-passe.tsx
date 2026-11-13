"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ChampSaisie } from "@/components/ui/champ-saisie";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";

const { afficher, masquer } = TEXTES_CONNEXION.champs.motDePasse;

/** Champ mot de passe avec un bouton pour afficher ou masquer la saisie. */
export function ChampMotDePasse(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">,
) {
  const [estVisible, setEstVisible] = useState(false);
  const Icone = estVisible ? EyeOff : Eye;

  return (
    <div className="relative">
      <ChampSaisie
        {...props}
        type={estVisible ? "text" : "password"}
        className="pe-14"
      />
      <button
        type="button"
        onClick={() => setEstVisible((visible) => !visible)}
        aria-label={estVisible ? masquer : afficher}
        aria-pressed={estVisible}
        className="absolute inset-y-0 end-0 flex w-12 items-center justify-center rounded-e-lg text-texte-secondaire transition-colors duration-150 hover:text-primaire focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primaire"
      >
        <Icone className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}

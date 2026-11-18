import { Download, LogIn, LogOut, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import type { ActionHistorique } from "@/lib/metier/historique";

/** Icône et teinte de chaque type d'action (toujours accompagnées du libellé : jamais la couleur seule). */
export const STYLES_ACTIONS: Record<ActionHistorique, { Icone: LucideIcon; pastille: string; bulle: string }> = {
  creation: { Icone: Plus, pastille: "bg-succes/5 text-succes ring-succes/25", bulle: "bg-succes/10 text-succes ring-succes/20" },
  modification: { Icone: Pencil, pastille: "bg-ciel text-primaire ring-primaire/20", bulle: "bg-ciel text-primaire ring-primaire/15" },
  suppression: { Icone: Trash2, pastille: "bg-erreur/5 text-erreur ring-erreur/25", bulle: "bg-erreur/10 text-erreur ring-erreur/20" },
  connexion: { Icone: LogIn, pastille: "bg-fond text-marine ring-bordure", bulle: "bg-canevas text-marine ring-bordure" },
  deconnexion: { Icone: LogOut, pastille: "bg-fond text-texte-secondaire ring-bordure", bulle: "bg-canevas text-texte-secondaire ring-bordure" },
  export: { Icone: Download, pastille: "bg-attention/5 text-attention ring-attention/25", bulle: "bg-attention/10 text-attention ring-attention/20" },
};

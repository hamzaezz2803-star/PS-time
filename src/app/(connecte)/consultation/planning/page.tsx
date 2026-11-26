import { redirect } from "next/navigation";
import { CHEMIN_PLANNING_VUE } from "@/lib/constantes";

/** Consultation > Planning sans affichage choisi : le planning mensuel. */
export default function PagePlanningParDefaut() {
  redirect(CHEMIN_PLANNING_VUE("mensuel"));
}

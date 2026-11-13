import { redirect } from "next/navigation";

/** Pas encore de page d'accueil : on envoie vers la connexion. */
export default function Accueil() {
  redirect("/connexion");
}

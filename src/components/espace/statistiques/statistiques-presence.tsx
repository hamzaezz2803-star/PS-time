import Link from "next/link";
import { CircleAlert, Clock4, Percent, Timer, UserCheck, UserX } from "lucide-react";
import { CHEMIN_ESPACE, STATISTIQUES_EMPLOYES_MAX, STATISTIQUES_PERIODES } from "@/lib/constantes";
import type { DonneesStatistiques } from "@/lib/donnees/statistiques-presence";
import { formaterJour, formaterJourCourt } from "@/lib/formats";
import { formaterDuree } from "@/lib/metier/programme";
import { arriveesParHeure, bilanDuJour, cumulerBilans, joursParEvenement, parJourDeSemaine, presenceParDepartement, tauxPresence } from "@/lib/metier/statistiques-presence";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";
import { cn } from "@/lib/utils";
import { BarresDepartements } from "./barres-departements";
import { BarresEvenements } from "./barres-evenements";
import { GraphiqueColonnes } from "./graphique-colonnes";
import { RepartitionJour } from "./repartition-jour";
import { TuileStatistique } from "./tuile-statistique";

const textes = TEXTES_PRESENCE.statistiques;
const CARTE = "rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5";

function ChoixPeriode({ periode }: { periode: number }) {
  return (
    <nav aria-label={textes.periode} className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-texte">{textes.periode}</span>
      {STATISTIQUES_PERIODES.map((jours) => (
        <Link
          key={jours}
          href={`${CHEMIN_ESPACE}?periode=${jours}`}
          scroll={false}
          aria-current={jours === periode ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9",
            jours === periode ? "bg-primaire text-white" : "bg-canevas text-texte hover:bg-ciel",
          )}
        >
          {textes.joursPeriode(jours)}
        </Link>
      ))}
    </nav>
  );
}

/** Statistiques de présence calculées sur les vrais pointages : chiffres clés puis graphiques. */
export function StatistiquesPresence({ donnees, periode }: { donnees: DonneesStatistiques; periode: number }) {
  const { employes, jours, maintenant } = donnees;
  const bilans = jours.map((jour) => bilanDuJour(employes, jour, maintenant));
  const aujourdhui = bilans[bilans.length - 1] ?? bilanDuJour(employes, maintenant.jour, maintenant);
  const cumul = cumulerBilans(bilans);
  const tauxJour = tauxPresence(aujourdhui);
  const tauxPeriode = tauxPresence(cumul);
  const arrivees = arriveesParHeure(employes, maintenant.jour);
  const semaine = parJourDeSemaine(bilans);
  const g = textes.graphiques;
  const pourcent = (taux: number | null) => (taux === null ? textes.tuiles.sansDonnee : textes.pourcentage(taux));
  const t = textes.tuiles;

  return (
    <section aria-labelledby="titre-statistiques" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="titre-statistiques" className="text-lg font-semibold text-marine">{textes.titre}</h2>
          <p className="text-sm text-texte-secondaire">{textes.sousTitre}</p>
          {donnees.estTronque && <p className="text-sm text-attention">{textes.tronque(STATISTIQUES_EMPLOYES_MAX)}</p>}
        </div>
        <ChoixPeriode periode={periode} />
      </div>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <TuileStatistique libelle={t.presents} valeur={pourcent(tauxJour)} detail={t.presentsDetail(aujourdhui.aLHeure + aujourdhui.enRetard, aujourdhui.aLHeure + aujourdhui.enRetard + aujourdhui.absents)} Icone={UserCheck} teinte="bg-succes/10 text-succes" />
        <TuileStatistique libelle={t.retards} valeur={String(aujourdhui.enRetard)} detail={t.retardsDetail(formaterDuree(aujourdhui.minutesRetard))} Icone={CircleAlert} teinte="bg-attention/10 text-attention" />
        <TuileStatistique libelle={t.absents} valeur={String(aujourdhui.absents)} detail={t.absentsDetail(aujourdhui.attendus, aujourdhui.justifies)} Icone={UserX} teinte="bg-erreur/10 text-erreur" />
        <TuileStatistique libelle={t.tauxPeriode(periode)} valeur={pourcent(tauxPeriode)} detail={t.tauxPeriodeDetail(cumul.absents)} Icone={Percent} teinte="bg-ciel text-primaire" />
        <TuileStatistique libelle={t.heuresTravaillees(periode)} valeur={formaterDuree(cumul.minutesTravaillees)} detail={t.heuresTravailleesDetail(formaterDuree(cumul.minutesPrevues))} Icone={Timer} teinte="bg-ciel text-primaire" />
        <TuileStatistique libelle={t.heuresSup(periode)} valeur={formaterDuree(cumul.minutesSupplementaires)} detail={t.heuresSupDetail(formaterDuree(cumul.minutesRetard))} Icone={Clock4} teinte="bg-ciel text-primaire" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className={cn(CARTE, "lg:col-span-2")}>
          <GraphiqueColonnes
            id="presence-jours"
            titre={textes.graphiques.presenceJours}
            aide={textes.graphiques.presenceJoursAide}
            etiquettes={jours.map(formaterJourCourt)}
            etiquettesLongues={jours.map(formaterJour)}
            mode="empile"
            unite="nombre"
            series={[
              { cle: "a_l_heure", nom: textes.statuts.a_l_heure, couleur: "bg-graphe-a-l-heure", valeurs: bilans.map((b) => b.aLHeure) },
              { cle: "en_retard", nom: textes.statuts.en_retard, couleur: "bg-graphe-retard", valeurs: bilans.map((b) => b.enRetard) },
              { cle: "absent", nom: textes.statuts.absent, couleur: "bg-graphe-absent", valeurs: bilans.map((b) => b.absents) },
              { cle: "justifie", nom: textes.statuts.justifie, couleur: "bg-graphe-justifie", valeurs: bilans.map((b) => b.justifies) },
              { cle: "attendu", nom: textes.statuts.attendu, couleur: "bg-graphe-attente", valeurs: bilans.map((b) => b.attendus) },
            ]}
          />
        </div>
        <div className={CARTE}>
          <RepartitionJour bilan={aujourdhui} />
        </div>

        <div className={cn(CARTE, "lg:col-span-2")}>
          <GraphiqueColonnes
            id="heures-jours"
            titre={textes.graphiques.heures}
            aide={textes.graphiques.heuresAide}
            etiquettes={jours.map(formaterJourCourt)}
            etiquettesLongues={jours.map(formaterJour)}
            mode="groupe"
            unite="heures"
            series={[
              { cle: "prevues", nom: textes.graphiques.prevues, couleur: "bg-graphe-reference", valeurs: bilans.map((b) => b.minutesPrevues) },
              { cle: "travaillees", nom: textes.graphiques.travaillees, couleur: "bg-primaire", valeurs: bilans.map((b) => b.minutesTravaillees) },
            ]}
          />
        </div>
        <div className={CARTE}>
          <BarresDepartements lignes={presenceParDepartement(employes, maintenant)} />
        </div>

        <div className={cn(CARTE, "lg:col-span-2")}>
          <GraphiqueColonnes
            id="ecarts-jours"
            titre={g.ecarts}
            aide={g.ecartsAide}
            etiquettes={jours.map(formaterJourCourt)}
            etiquettesLongues={jours.map(formaterJour)}
            mode="groupe"
            unite="heures"
            series={[
              { cle: "retard", nom: g.retardCumule, couleur: "bg-graphe-retard", valeurs: bilans.map((b) => b.minutesRetard) },
              { cle: "heures_sup", nom: g.heuresSup, couleur: "bg-primaire", valeurs: bilans.map((b) => b.minutesSupplementaires) },
            ]}
          />
        </div>
        <div className={CARTE}>
          <BarresEvenements lignes={joursParEvenement(employes)} periode={periode} />
        </div>

        <div className={cn(CARTE, "lg:col-span-3")}>
          <GraphiqueColonnes
            id="jours-semaine"
            titre={g.semaine}
            aide={g.semaineAide(periode)}
            etiquettes={[...g.joursSemaine]}
            etiquettesLongues={[...g.joursSemaineLongs]}
            mode="groupe"
            unite="nombre"
            libelleCategorie={g.jourSemaine}
            series={[
              { cle: "retards", nom: g.retards, couleur: "bg-graphe-retard", valeurs: semaine.map((s) => s.retards) },
              { cle: "absents", nom: g.absents, couleur: "bg-graphe-absent", valeurs: semaine.map((s) => s.absents) },
            ]}
          />
        </div>

        <div className={cn(CARTE, "lg:col-span-3")}>
          {arrivees.length === 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-marine">{textes.graphiques.arrivees}</p>
              <p className="rounded-lg bg-fond px-3 py-4 text-sm text-texte-secondaire">{textes.graphiques.videAujourdhui}</p>
            </div>
          ) : (
            <GraphiqueColonnes
              id="arrivees"
              titre={textes.graphiques.arrivees}
              aide={textes.graphiques.arriveesAide}
              etiquettes={arrivees.map((a) => textes.graphiques.heure(a.heure))}
              etiquettesLongues={arrivees.map((a) => textes.graphiques.tranche(a.heure))}
              mode="groupe"
              unite="nombre"
              libelleCategorie={textes.graphiques.heureColonne}
              series={[{ cle: "arrivees", nom: textes.graphiques.arriveesValeur, couleur: "bg-primaire", valeurs: arrivees.map((a) => a.arrivees) }]}
            />
          )}
        </div>
      </div>
    </section>
  );
}

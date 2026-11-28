import { Download } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import { CHEMIN_EXPORT_SAUVEGARDE } from "@/lib/constantes";
import { TEXTES_SAUVEGARDE as textes } from "@/lib/textes/sauvegarde";
import { CarteSauvegarde } from "./carte-sauvegarde";

/** Export : simple formulaire POST vers la route protégée, qui renvoie le fichier en téléchargement. */
export function ExportSauvegarde() {
  return (
    <CarteSauvegarde id="titre-export" titre={textes.export.titre} description={textes.export.description}>
      <form method="post" action={CHEMIN_EXPORT_SAUVEGARDE} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <CaseACocher nom="comptes" libelle={textes.export.comptes} aria-describedby="aide-comptes" defaultChecked />
          <p id="aide-comptes" className="ms-8 text-sm text-texte-secondaire">{textes.export.aideComptes}</p>
        </div>
        <Bouton type="submit" className="self-start">
          <Download className="size-4" aria-hidden="true" />
          {textes.export.bouton}
        </Bouton>
      </form>
    </CarteSauvegarde>
  );
}

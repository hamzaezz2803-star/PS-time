"use client";

import { ChevronDown, Download, FileSpreadsheet, FileText, type LucideIcon } from "lucide-react";
import { CHEMIN_EXPORT_EXCEL_PERSONNES, CHEMIN_IMPRESSION_PERSONNES } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { useMenuDeroulant } from "@/components/ui/utiliser-menu-deroulant";
import { cn } from "@/lib/utils";

const textes = TEXTES_PERSONNES.export;

function Entree({ href, Icone, titre, aide, telecharger = false }: { href: string; Icone: LucideIcon; titre: string; aide: string; telecharger?: boolean }) {
  return (
    <a
      href={href}
      role="menuitem"
      download={telecharger || undefined}
      className="flex min-h-11 items-center gap-3 rounded-md px-2.5 py-2 text-start transition-colors duration-150 hover:bg-fond focus-visible:outline-2 focus-visible:outline-primaire"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ciel text-primaire">
        <Icone className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-texte">{titre}</span>
        <span className="text-sm text-texte-secondaire">{aide}</span>
      </span>
    </a>
  );
}

/** Bouton « Exporter » : Excel (téléchargement) ou PDF (page imprimable), avec les filtres en cours (`requete`). */
export function MenuExport({ requete }: { requete: string }) {
  const { estOuvert, basculer, conteneur } = useMenuDeroulant();

  return (
    <div ref={conteneur} className="relative ms-auto">
      <button
        type="button"
        onClick={basculer}
        aria-expanded={estOuvert}
        aria-haspopup="menu"
        aria-controls="menu-export"
        aria-label={textes.ouvrir}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-bordure-champ bg-surface px-3.5 text-sm font-semibold text-texte shadow-carte transition-colors duration-150 hover:bg-fond focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-10"
      >
        <Download className="size-4" aria-hidden="true" />
        {textes.bouton}
        <ChevronDown className={cn("size-4 text-texte-secondaire transition-transform duration-150 motion-reduce:transition-none", estOuvert && "rotate-180")} aria-hidden="true" />
      </button>
      {estOuvert && (
        <div
          id="menu-export"
          role="menu"
          className="absolute end-0 top-full z-20 mt-2 w-72 animate-apparition rounded-lg bg-surface p-1 shadow-flottant ring-1 ring-bordure motion-reduce:animate-none"
        >
          <Entree href={`${CHEMIN_EXPORT_EXCEL_PERSONNES}${requete}`} telecharger Icone={FileSpreadsheet} titre={textes.excel} aide={textes.aideExcel} />
          <Entree href={`${CHEMIN_IMPRESSION_PERSONNES}${requete}`} Icone={FileText} titre={textes.pdf} aide={textes.aidePdf} />
        </div>
      )}
    </div>
  );
}

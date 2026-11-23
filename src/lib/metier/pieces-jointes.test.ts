import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PIECE_JOINTE_TAILLE_MAX_OCTETS } from "../constantes.ts";
import { detecterTypePieceJointe, dispositionEnLigne, nettoyerNomFichier, verifierPieceJointe } from "./pieces-jointes.ts";

const octets = (...valeurs: number[]) => new Uint8Array(valeurs);
const PDF = octets(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37);
const PNG = octets(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0);

describe("type d'une pièce jointe", () => {
  it("reconnaît un PDF et les images acceptées par leur signature", () => {
    assert.equal(detecterTypePieceJointe(PDF), "application/pdf");
    assert.equal(detecterTypePieceJointe(PNG), "image/png");
    assert.equal(detecterTypePieceJointe(octets(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  });

  it("refuse un autre fichier, même nommé .pdf", () => {
    assert.equal(detecterTypePieceJointe(new TextEncoder().encode("<html>")), null);
    assert.equal(verifierPieceJointe(new TextEncoder().encode("MZ exécutable")).ok, false);
  });

  it("refuse un fichier vide ou trop lourd", () => {
    assert.deepEqual(verifierPieceJointe(new Uint8Array()), { ok: false, erreur: "taille" });
    const lourd = new Uint8Array(PIECE_JOINTE_TAILLE_MAX_OCTETS + 1);
    lourd.set(PDF);
    assert.deepEqual(verifierPieceJointe(lourd), { ok: false, erreur: "taille" });
    assert.deepEqual(verifierPieceJointe(PDF), { ok: true, type: "application/pdf" });
  });
});

describe("nom d'une pièce jointe", () => {
  it("retire le chemin, les caractères de contrôle et les guillemets", () => {
    assert.equal(nettoyerNomFichier("C:\\fakepath\\certificat.pdf"), "certificat.pdf");
    assert.equal(nettoyerNomFichier('../../"arrêt"\u0000 maladie.png'), "arrêt maladie.png");
  });

  it("donne un nom par défaut et raccourcit en gardant l'extension", () => {
    assert.equal(nettoyerNomFichier("  "), "piece-jointe");
    assert.equal(nettoyerNomFichier(".."), "piece-jointe");
    const long = nettoyerNomFichier(`${"a".repeat(200)}.pdf`);
    assert.equal(long.length, 150);
    assert.ok(long.endsWith(".pdf"));
  });

  it("encode le nom dans l'en-tête de téléchargement", () => {
    assert.equal(dispositionEnLigne("arrêt.pdf"), `inline; filename="arr_t.pdf"; filename*=UTF-8''arr%C3%AAt.pdf`);
  });
});

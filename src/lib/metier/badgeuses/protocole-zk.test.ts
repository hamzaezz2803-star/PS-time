import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COMMANDES_ZK,
  NUMERO_REPONSE_INITIAL,
  construirePaquet,
  decoderHeure,
  demandeOption,
  ecartSecondes,
  encoderHeure,
  lireOption,
  lireReponse,
  lireTailles,
  sommeDeControle,
} from "./protocole-zk.ts";

describe("construirePaquet", () => {
  it("produit la demande de connexion attendue par les badgeuses", () => {
    const paquet = construirePaquet(COMMANDES_ZK.connexion, 0, NUMERO_REPONSE_INITIAL);
    // En-tête TCP 50 50 82 7d, longueur 8, commande 1000 (e8 03), somme, session 0, numéro 0.
    assert.deepEqual(Array.from(paquet), [0x50, 0x50, 0x82, 0x7d, 8, 0, 0, 0, 0xe8, 0x03, 0x17, 0xfc, 0, 0, 0, 0]);
  });

  it("calcule la somme de contrôle sur le numéro précédent", () => {
    const corps = new Uint8Array([0xe8, 0x03, 0, 0, 0, 0, 0xfe, 0xff]);
    assert.equal(sommeDeControle(corps), 0xfc17);
  });

  it("ajoute les données après l'en-tête et compte leur longueur", () => {
    const paquet = construirePaquet(COMMANDES_ZK.lireOption, 1234, 3, demandeOption("~SerialNumber"));
    assert.equal(paquet[4], 8 + 14);
    assert.equal(new DataView(paquet.buffer).getUint16(14, true), 4);
  });
});

describe("lireReponse", () => {
  it("lit une réponse complète, attend une réponse coupée et refuse un autre protocole", () => {
    const reponse = construirePaquet(2000, 77, 0, new Uint8Array([1, 2]));
    const lue = lireReponse(reponse);
    assert.ok(lue && lue !== "incomplet");
    assert.equal(lue.commande, 2000);
    assert.equal(lue.session, 77);
    assert.deepEqual(Array.from(lue.donnees), [1, 2]);
    assert.equal(lireReponse(reponse.subarray(0, 12)), "incomplet");
    assert.equal(lireReponse(new TextEncoder().encode("HTTP/1.1 200 OK\r\n")), null);
  });
});

describe("heure des badgeuses", () => {
  it("encode et décode sans perte", () => {
    const heure = { annee: 2026, mois: 11, jour: 27, heures: 8, minutes: 5, secondes: 42 };
    assert.deepEqual(decoderHeure(encoderHeure(heure)), heure);
  });

  it("compte l'écart avec l'heure du serveur, à cheval sur deux jours", () => {
    const badgeuse = { annee: 2026, mois: 12, jour: 1, heures: 0, minutes: 1, secondes: 0 };
    const serveur = { annee: 2026, mois: 11, jour: 30, heures: 23, minutes: 59, secondes: 0 };
    assert.equal(ecartSecondes(badgeuse, serveur), 120);
  });
});

describe("lecture des réponses", () => {
  it("lit la valeur d'une option et ignore les caractères non imprimables", () => {
    assert.equal(lireOption(new TextEncoder().encode("~SerialNumber=ABC123\0\x01")), "ABC123");
    assert.equal(lireOption(new Uint8Array([0])), null);
  });

  it("lit le nombre d'utilisateurs et de pointages, refuse une réponse trop courte", () => {
    const donnees = new Uint8Array(92);
    const vue = new DataView(donnees.buffer);
    vue.setInt32(16, 25, true);
    vue.setInt32(32, 1480, true);
    assert.deepEqual(lireTailles(donnees), { utilisateurs: 25, pointages: 1480 });
    assert.equal(lireTailles(new Uint8Array(10)), null);
  });
});

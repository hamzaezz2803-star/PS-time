import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adressesDuReseau, comparerAdresses, estAdressePrivee, longueurMasque, reseauAParcourir } from "./reseau.ts";

describe("estAdressePrivee", () => {
  it("accepte les réseaux privés et refuse Internet, la boucle locale et les textes invalides", () => {
    for (const adresse of ["10.0.0.5", "172.16.1.1", "172.31.255.254", "192.168.1.201"]) assert.equal(estAdressePrivee(adresse), true, adresse);
    for (const adresse of ["8.8.8.8", "172.32.0.1", "127.0.0.1", "100.64.0.1", "192.168.1", "192.168.1.256", "192.168.01.1", "abc"]) {
      assert.equal(estAdressePrivee(adresse), false, adresse);
    }
  });
});

describe("longueurMasque", () => {
  it("compte les bits et refuse un masque non contigu", () => {
    assert.equal(longueurMasque("255.255.255.0"), 24);
    assert.equal(longueurMasque("255.255.0.0"), 16);
    assert.equal(longueurMasque("255.255.255.255"), 32);
    assert.equal(longueurMasque("255.0.255.0"), null);
  });
});

describe("reseauAParcourir et adressesDuReseau", () => {
  it("parcourt les 253 autres adresses d'un réseau /24", () => {
    const reseau = reseauAParcourir("192.168.1.50", "255.255.255.0");
    assert.deepEqual(reseau, { adresseServeur: "192.168.1.50", reseau: "192.168.1.0", longueurMasque: 24, reduit: false });
    const adresses = adressesDuReseau(reseau!);
    assert.equal(adresses.length, 253);
    assert.equal(adresses[0], "192.168.1.1");
    assert.equal(adresses.at(-1), "192.168.1.254");
    assert.equal(adresses.includes("192.168.1.50"), false);
  });

  it("réduit un grand réseau à la partie /24 du serveur", () => {
    const reseau = reseauAParcourir("10.20.30.40", "255.0.0.0");
    assert.deepEqual(reseau, { adresseServeur: "10.20.30.40", reseau: "10.20.30.0", longueurMasque: 24, reduit: true });
  });

  it("garde un petit réseau tel quel", () => {
    const reseau = reseauAParcourir("192.168.1.130", "255.255.255.192");
    assert.equal(reseau?.reseau, "192.168.1.128");
    assert.equal(adressesDuReseau(reseau!).length, 61);
  });

  it("ignore une adresse publique ou un réseau point à point", () => {
    assert.equal(reseauAParcourir("8.8.8.8", "255.255.255.0"), null);
    assert.equal(reseauAParcourir("192.168.1.1", "255.255.255.254"), null);
  });
});

describe("comparerAdresses", () => {
  it("trie dans l'ordre numérique", () => {
    assert.deepEqual(["192.168.1.10", "192.168.1.9", "10.0.0.1"].sort(comparerAdresses), ["10.0.0.1", "192.168.1.9", "192.168.1.10"]);
  });
});

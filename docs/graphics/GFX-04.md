# GFX-04 — Udarci i pogodak

- Bliski napad ima pripremu, prenos tezine i kontakt pre povratka u stav.
- Iva ispusta strelu. Luk leta, varnice i reakcija mete vremenski su povezani.
- HP i broj izlaze u trenutku kontakta iz dostavljenog rezultata. Na nuli
  figura pada i ostaje na tabli u prigusenom prikazu.
- Jedinstven ID po dogadjaju i Preskoci obezbedjuju jedan zavrsetak.

Proba: Napad, Projektil, Zavrsni pogodak. Promeni brzinu, pusti
Zavrsni pogodak i odmah klikni Preskoci. Meta zavrsava na 0 HP u oba prikaza.
Napad i Ponovi koriste isti probni dogadjaj uz reset scene.

Qt WebEngine/Chromium Linux 1280x800. Test proverava HP pre kontakta,
normalni/brzi rezultat, istu metu, dupli ID, preskakanje i ponavljanje.
Vrednosti su probni ulaz.

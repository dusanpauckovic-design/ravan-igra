# GFX-06 — Cela borbena proba

- Jedan ponovljiv niz prikazuje hod, strelu, oznaku, trag, bliski napad,
  odgurivanje, rusenje i zavrsni pad.
- Aktivni borac, selekcija i opasno polje imaju posebne oznake.
- Kamera reaguje samo na oznacen jaci pogodak, uz prekidac.
  Smanjeno kretanje skracuje animacije i gasi potres.
- Predati su renderer, RV-03 adapter, offline HTML, art i uputstvo
  za gameplay vlasnika u INTEGRATION.md.

Proba: Pusti celu borbu. Prebaci na Brzo ×2 i iskljuci Efekat kamere,
pa ponovi. Zatim ukljuci Smanjeno kretanje i pokreni treci put.
Reset usred niza treba da vrati pocetne HP, zaklon i najavu na tabli.
Demonstracija koristi unapred pripremljen niz dogadjaja.

Provere: 1280x800 i 1512x982 u Qt WebEngine/Chromium na Linuxu.
Normalna, brza i smanjena reprodukcija imaju identican krajnji
snapshot. Reset prekida niz i prazni efekte. RV-03 adapter dodatno
proveren stvarnim receipt podacima iz kombinacije i rusenja zaklona.

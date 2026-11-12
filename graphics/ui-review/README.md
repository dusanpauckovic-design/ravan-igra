# Ravan · A/B vizuelna proba

Igriva baza je E8 merge `fc158d7cb3d88c5ecc1d6cbd1e44434953aafaa4`. Predlog koristi postojecu ilustraciju Ravan naslovne, pravila i komande. Modul je za zajednicki pregled pre integracije.

- Naslovna koristi prigusene tonove, mesingani okvir i jasan izbor izmedju nove igre i nastavka.
- Mapa drzi stanje i trenutne akcije u traci koja ostaje u vidnom polju. Precice pozivaju postojece kontrole igre.
- Borba pokazuje trenutni potez, sledeceg borca i postojeci cilj. Potvrda akcije i detalji zadrzavaju postojeca pravila.

## Kratka proba

1. Na naslovnoj prebaci stil dugmetom u donjem desnom uglu ili tasterom F8. Otvori kreator kroz Nova igra.
2. Na mapi izaberi dostupno odrediste. Kreni treba da bude vidljivo u traci bez skrolovanja. Prebaci A/B i proveri da ista komanda ostaje dostupna.
3. U borbi promeni 2D/2.5D, pogledaj ko je na potezu i otvori Tehnike i detalji.

## Ponovi build

```sh
python3 graphics/ui-review/build.py /path/to/Ravan_E8-Merged.html Ravan_UI_Proba.html
```

## V01 · Dva vizuelna pravca

Klikabilni predlog prikazuje meni i preskocivi intro, bojiste i kamp. Zar i pepeo koristi toplo svetlo i tamne materijale. Hladni rukopis koristi svetlu podlogu sa hladnim panelima. E8 prikaz ucitava spojenu igru u izolovanom okviru za poredjenje. Igriva proba u parent direktorijumu sluzi za zasebnu proveru komandi i A/B rasporeda.

```sh
python3 graphics/ui-review/concept/build.py /path/to/Ravan_E8-Merged.html /path/to/E8-source/assets Ravan_V01_Vizuelni_Predlog.html
```

Komande u vizuelnom predlogu demonstriraju prelaze i stanja. Audio ulaz ceka odabrani lokalni Sonne piano fajl. Produkciona primena ceka izbor i vizuelno odobrenje iz plana #90.

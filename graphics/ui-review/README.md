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

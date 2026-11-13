# RAVAN · Prva dolina · ART-OW-A01

Prvi vizuelni prototip za pregled u #135. Jedna mapa, jedno vremensko stanje. Dugme **Magla** menja svetlo i vidljivost unutar istog kadra.

## Otvaranje i proba

Otvori `RAVAN_Prva_Dolina.html` iz predaje u browseru sa WebGL 2. HTML sadrzi modele i teksture i radi offline. Izaberi Recni prelaz ili Sumsko svetiliste i pritisni **Kreni**. Povuci mapu, zumiraj dugmadima ili tockicem i vrati kadar na ◎. Na telefonu mozes da biras i iz liste. **Detalji** smanjuju gustinu vegetacije, DPR i iskljucuje senke. Sistemski reduced motion zaustavlja animaciju vode i pomera druzinu odmah.

Ovo je izdvojena art scena. Putovanje koristi lokalne staze iz `world.js`. Druzina je oznacena prstenom na tlu. MakeHuman/MPFB i kanonski modeli Putnika i Putnice iz odobrenih HD referenci pripadaju zasebnoj predaji. Sama pecina je orijentir uz skeniranu stenu. Rezervni 2D prikaz se ne prikazuje pri WebGL gresci.

## Izvor

Bakijev `RAVAN_3D_OpenWorld_Demo_A_Paket.zip`, SHA-256 `8595400290b2735919a55bdcf326ddf1d9718e76fb0b6379d6e7696b0e308608`. Originalni teren je isti GLB. Zadrzani su recni tok, pet ID-jeva i njihove tacke. Oznaka gaza pomerena je sa x=0 na sredinu postojeceg kanala uz z=4. Nova povrsina vode prati originalni kanal i njegove visine. Three.js ucitava originalni mesh i spoljne objekte. `baki_asset_plan.json` je originalni predlog izvora. `assets_manifest.json` je evidencija stvarno koriscenih fajlova.

```sh
npm ci
python3 build.py RAVAN_Prva_Dolina.html
```

Izvorni ZIP sadrzi sve assete. Na GitHub grani `python3 prepare_assets.py` pre gradnje preuzima spoljne fajlove. Za tu obnovu potrebni su curl, ImageMagick 7 i Blender 4.x. Isti ZIP sadrzi i sirove snimke iz browsera i rezultate provera. Za ponavljanje testa instalirati Playwright i po potrebi postaviti `RAVAN_CHROMIUM`.

```sh
node qa/browser.cjs RAVAN_Prva_Dolina.html qa
```

## Veze za nastavak

- #82. Lokalni prototip izbora, putovanja, pan/zoom i pristupa na uskom ekranu.
- #94. Isti identitet doline, obale i gaza. Staze iz prototipa cekaju povezivanje na world snapshot.
- #102. Tri karaktera unutar jedne doline. Reka, borova suma i kameniti prevoj.
- #108. Za buduci prikaz susreta preuzeti iste ID-jeve, kamene i zemljane materijale i orijentire. Takticka borba se povezuje u zasebnom toku.
- #130. Test ove doline vodi se odvojeno od zajednicke E8 provere.

Ideja za kasniju odluku je rucno teksturisanje arhitekture logora po odobrenim RAVAN referencama. U ovoj verziji koristimo objavljeni komplet za naselja.

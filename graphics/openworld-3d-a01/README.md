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

## Prosirena dolina · Putnik i istrazivanje

Ista mapa sada pokriva oko 401 × 353 jedinice umesto 144 × 126, odnosno 7,8 puta vecu povrsinu. Originalni GLB ostaje srediste. Novi teren naleze na njegovu mrezu, a 6 novih mesta povezuju staze sa starom dolinom. Dodati su novi zavoj reke, grebeni, borovi i istocni zaseok. Gradjevine dobijaju matirane, vremenski istrosene materijale.

- Dugme ◇ prikazuje celu dolinu. Dugme ◎ centrirа i prati Putnika.
- Ukljuci **Magla istrazivanja** i klikni na teren blizu Putnika. Oko njega se otvara cist krug. Ranije poseceni delovi ostaju pod tanjom maglom, a neotkrivena odredista su skrivena. Klik van dohvata ili na drugi kraj reke mimo gaza ne pokrece kretanje.
- Kad putujes ka poznatoj oznaci posle skretanja sa staze, Putnik se najpre vraca istim putem do poslednje staze. Otkrivenost traje tokom otvorene sesije.
- 3D Putnik koristi MakeHuman osnovu, prilagodjen plast, krzno, opremu i dvotaktnu animaciju koraka. Ovo je prvi model za mapu. Lice i oziljak iz HD reference jos nisu modelovani. Model Putnice pripada sledecem radu na likovima.

Provera prosirenja se pokrece kao `node qa/expanded.cjs RAVAN_Dolina_Prosirena.html qa`. Evidencija je u `qa/expanded.json`. Ovo je izdvojeni art prototip i koristi lokalne staze.

## Putovanje i magla uz teren

Magla je ukljucena pri otvaranju. Putnik otkriva kratak, nepravilan vidokrug. Grebeni i recna obala zaustavljaju pogled; vec otkriveni teren ostaje prigusen kad Putnik ode. Pogled se suzava tokom noci. Iskljucivanje magle daje pregled doline za vizuelnu proveru.

Putovanje koristi lokalni sat prototipa. Trosak puta zavisi od rastojanja, nagiba, gaza i mokrog tla. Direktan put od logora do Mokrih livada traje oko dva dana u igri. Duboka voda je neprohodna. Na gazu Putnik zastaje i prikazuje lokalni dogadjaj koji se otkriva tek pri dolasku. Dogadjaji su dva unapred definisana prototipska primera. Sat i otkrivenost traju tokom otvorene sesije.

Grebene cine nizi, razdvojeni masivi. Izlozene stene prate padine. Staze do Severne straze i Mokrih livada idu preko medjutacaka i izbegavaju duboku vodu.

`node qa/journey.cjs RAVAN_Dolina_Putovanje.html qa` pokrece offline browser proveru.

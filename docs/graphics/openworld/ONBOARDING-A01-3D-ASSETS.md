# RAVAN — ART-OW-A01 | Onboarding za dizajn modela: stvarna 3D mapa + asseti

**Projekat:** RAVAN (zasebna fantasy RPG igra, ne Basketball Manager)  
**Uloga:** dizajn / art direction / 3D asset integration / UI scene presentation  
**Vlasnik odluka:** Dule  
**Status:** ODOBREN vizuelni smer A; najnovija odluka: jedna kvalitetna oblast u jednoj epohi, bez 4 paralelna sveta. Implementacija paketa NIJE jos integrisana u glavnu igru.  
**Pravila:** radi u izolovanom art modulu i grani; bez podagenata ako radis kao zaseban dizajn model. Precizno prijavi sta zaista radi.

## 1. Cilj i vizuelni identitet

Podigni izgled postojećeg eksperimetalnog open-world demo-a sa jednostavnih proceduralnih oblika na uverljivu, stvarno renderovanu 3D dolinu za RAVAN, sa kamerom iskosa (2.5D pogled). Igrac bira lokaciju i putuje kroz otvoreni svet u duhu Mount & Blade STRATEGIJSKE MAPE. **Borba nije Mount & Blade:** zasebno, potezno Heroes of Might and Magic bojiste na taktickim poljima. Ne diraj pravila borbe.

Art direction: ozbiljna, zemljana, prirodna fantasy atmosfera. Tamna maslinasta, kamen, hladna reka, zemlja, drvo, koza, tkanina; umereno toplog svetla, atmosferska dubina, citljive siluete, zrele proporcije. Izbegavaj crtane/igrackaste low-poly figure, preteranu zlatnu ornamentiku, visok bloom, neon, sablonsko ravnomerno rasporedjivanje stabala i UI koji prekriva mapu. Ravan ima vec odobrene HD reference glavnog putnika i putnice sa oziljcima: **lice, odeca i identitet moraju ostati dosledni** kroz UI, mapu i kasniju borbu.

## 2. Odobren tehnicki izbor A

**SCOPE FREEZE (13.11.2026):** Za A01 samo **jedna mapa / jedna vremenska verzija prve Ravni**, sa dovoljno razradjenim reljefom, prirodom, naseljem i putovanjem. Buduce tri epohe su backlog. Ne koristiti vreme na 4 varijante dok Dule ne odobri kvalitet jedne. Dizajner se bavi samo open world-om; glavni humanoidi/MakeHuman/rigovanje i borbene animacije su paralelan nezavisan tok.

- **Stvarna 3D geometrija terena + kamera iskosa**, opcionalno ortografska ili daleka perspektiva, unutar postojece HTML/browser tehnologije; Three.js je prihvatljiv ako je opravdan.
- Mapa je slobodna (nije heksagonalna u overworld-u). Putanje, prelazi i logicki ciljevi moraju odgovarati prohodnosti. Hex/takticka polja ostaju na zasebnom bojistu.
- Tri prepoznatljiva prirodna karaktera jedne povezane oblasti: **dolina/reka, suma, kameniti prevoj**. Put, obala, prelaz, kamp i orijentir moraju biti citljivi pri normalnom zumu.
- **BUDUCE FAZE, ne A01:** ista osnovna geografija ce jednom imati jos tri vremenska stanja. U A01 samo sacuvaj konzistentne koordinate i landmark ID-jeve, a napravi jednu prvobitnu Ravan (prva epoha). Nema rendera niti implementacije ostale tri epohe do Duleovog posebnog odobrenja.
- Pocni sa **jednom odlicno uradjenom dolinom**, ne sa ogromnim praznim kontinentom. Dugorocno skala u vise regija.

## 3. Postojeci materijal (prvo procitati i koristiti)

1. **RAVAN_3D_OpenWorld_Demo_A_Paket.zip** — Dule treba da ga priloži dizajn modelu iz razgovora; nije na GitHubu. Sadrzi `RAVAN_3D_Mapa_Demo_A/index.html`, `assets_manifest.json`, `download_models.py`, `make_original_terrain.py`, izvorni `Ravan_Originalni_Teren_Dolina.glb`, README i kompozitni pregled epoha.
2. **RAVAN_Preview_4_Epohe_REZERVNI_prikaz.jpg** iz paketa je screenshot rezervnog 2.5D prikaza, **nije dokaz stvarnih ucitanih 3DAssets GLB modela**. Taj prikaz je tehnicki nedovoljan za odobreni art cilj. Dizajner treba da ga znatno nadmasi.
3. Odobrene ilustracije **glavni putnik (oziljak), glavna putnica (oziljak)**, full-body; Dule moze da ih doda kao reference. Koristi ih za oblikovanje modela, ne kao varljivo nalepljene ravne figure.
4. Povezani GitHub rad: [world 2.5D UI #82](https://github.com/dusanpauckovic-design/ravan-igra/issues/82), [dolina i put #94](https://github.com/dusanpauckovic-design/ravan-igra/issues/94), [tri bioma #102](https://github.com/dusanpauckovic-design/ravan-igra/issues/102), [mapa→borba #108](https://github.com/dusanpauckovic-design/ravan-igra/issues/108), [integracioni QA #130](https://github.com/dusanpauckovic-design/ravan-igra/issues/130), [krovni plan #90](https://github.com/dusanpauckovic-design/ravan-igra/issues/90). Ovo je ART/ASSET dopuna, ne paralelno menjanje njihovih gameplay fajlova.

## 4. Stvarni 3D izvori i licence

**Prva osnova: 3DAssets.dev** — [Prehistoric Survivor Settlement](https://3dassets.dev/packs/prehistoric-survivor-settlement). Prototip manifest sadrzi konkretne izbore:
- `hidehut` (23199) — koliba
- `longhouse` (23200) — duga kuca
- `granary` (23202) — skladiste
- `hearth` (23206) — ognjiste
- `palisade` (23197) — palisada
- `cottage` (28762) — kuca za razvijenu epohu
- `mine` (28767) — ulaz u rudnik
- `tent` (28884) — sator

Direktne CDN GLB adrese i stranice modela su u **assets_manifest.json**. **Nijedan od ovih osam binarnih GLB nije potvrdjeno preuzet u trenutni demo paket.** Ako ne rade, prijavi koji URL/razlog i pronadji legitimnu rezervu; NIKAD ne tvrdi da su stvarni modeli prikazani ako je renderovan placeholder.

Drugi kvalitetni izvori: [Poly Haven](https://polyhaven.com/) (3D priroda, PBR/HDRI), [ambientCG](https://ambientcg.com/) (PBR zemlja, blato, kamen, mahovina), [cgbookcase](https://www.cgbookcase.com/) (materijali). Za humanoide: [MakeHuman Community](https://www.makehumancommunity.org/) / MPFB i Blender, a animacije Mixamo ili Quaternius gde uslovi odgovaraju. Quaternius koristimo za tehnicku osnovu/animacije, NE kao glavni crtani izgled.

Pre ukljucivanja svakog preuzetog asseta potvrdi tekucu licencu, atribuciju/redistribuciju i poreklo; zabelezi URL, autora, licencu, verziju, local path, poligone, dimenzije, velicinu fajla. Ne pretpostavljaj da svi izvori imaju isti rezim. Ne preuzimaj nesigurne ili copyright-risk pakete.

## 5. Konkretan mandat i red rada

**A01 — Asset audit + dokaz realnog 3D:** raspakuj postojeceg demoa, proveri da teren zaista radi, uspesno preuzmi i lokalno ucitaj najmanje **3 stvarna GLB objekta** (npr. koliba, skladiste, ognjiste) i **2 stvarna prirodna asseta**. Napravi screenshot iz stvarno pokrenutog WebGL prikaza, uz status u konzoli i manifest. Do tada status nije „realni asseti spremni“.

**A02 — Jedna lepa povezana dolina:** prirodna obala, nepravilna reka, cistina, grupe vegetacije, slojevita kamenita padina, prednji/srednji/daleki plan, prirodna svetlost i kontaktne senke. Minimum 5 mesta na mapi sa jasnom kompozicijom. Umereni PBR materijali, bez repetitivnih plocica ili uniformno posadjenog drveca. Prvo uradi jedan dobar referentni kadar sa 2 stanja svetla, pa primeni isti jezik na ostale delove.

**A03 — Zavrsni art pass iste doline (umesto cetiri epohe):** jedna vremenska verzija, jedan teren seed/geografija/landmark identitet, detaljno sredjene obale, stene, raznovrsna vegetacija, naselje, prirodni putevi, prelazi i svetlo. Daj pre/posle iz identicne kamere, bez laznog prikaza prohodnosti. U posebnoj kratkoj napomeni opisi kako ce kasnije isti landmark ID-jevi podrzati preostala tri vremenska stanja — bez njihove implementacije.

**A04 — Druzina kao marker i citljivo kretanje:** u okviru open-world-a samo jednostavan, pravilno skaliran marker druzine, prikaz putanje i uskladjen kadar tokom kretanja. MakeHuman/MPFB, rigovanje, kanonsko lice putnika i putnice i sve borbene animacije vodi drugi timski tok, van ovog tiketa.

**A05 — Predaja sa stvarnim radnim HTML-om:** jedna klikabilna mapa sa kamerom (pan/zoom, centriranje), putovanjem ka min. 3 lokacije, promenom epohe, oznacenom druzinom i kontekstualnim informacijama; mobile responsive. Iskoristi postojeci world API/snapshot kada je dostupan. Gde je fixture, jasno ga obelezi i predaj dokumentovan adapter. Ne menjaj battle engine.

## 6. Granice i saradnja

- Dizajner poseduje **sopstveni art modul, assete, 3D/2.5D renderer, UI i otvorivi preview** na posebnoj grani i u jasnom direktorijumu (npr. `graphics/openworld-3d-a01/**` i `docs/graphics/openworld/**`).
- **Ne dirati** produkcioni `main`, `src` pravila borbe/world simulacije, `app.js`, `core.js`, save format ili postojece integrisane buildove bez koordinacije. Ne menjati druge art/GFX grane.
- Za integraciju su zaduženi gameplay/integrator modeli, koji uzimaju **pinovani commit**, ne proizvoljno poslednje stanje.
- Pre pocetka proveri najnoviji stvarni repo checkpoint, PR-ove i #82/#90; `main` moze sadrzati samo dokumentaciju i nije dokaz najnovijeg koda.
- Ne proglasavaj funkcionalan susret/borbu bez stvarnog gameplay adaptera. Dostupna scena sa fixture podacima je vizuelni demo.

## 7. Kriterijumi prihvatanja / QA

- Stvarni 3D modeli dokazano ucitani **lokalno**, ne samo oznaceni u HTML-u ili pokusani preko CDN-a.
- Jedna dolina iz tri prepoznatljiva bioma izgleda realno-stilizovano, ne low-poly igracka, bez varanja koncept slikama.
- Jedan kvalitetno zavrsen svet/epoha sa istim stabilnim landmark ID-jevima i koordinatama za buduce epohe. Ostale tri epohe se ne zahtevaju u A01.
- Kamera i izabrana meta ne „beze“ pri zoom/resize; put i recni prelaz imaju logicnu prohodnost.
- Stvarni screenshot iz browsera za 1280x800 i 1440x900, provera na 390x844; **najmanje dva uporediva kadra iste epohe pre i posle poboljsanja**, bez mockupa. Ako WebGL u okruzenju ne radi, prijavi i ne predstavljaj fallback kao final.
- Osnovni pregled performansi: FPS ili vreme frejma, broj draw callova/poligona i low-quality preset za slabiji uredjaj.
- Predaja: GitHub grana i commit/SHA, izvorni fajlovi, asset manifest + licence, HTML/preview link, screenshotovi, kratko uputstvo, test log i **lista sta je stvarno integrisano / sta je samo placeholder**.
- Dule vizuelno odobrava rezultat. **Nema automatskog merge-a** samo na osnovu tehnickog uspeha.

**Prioritet:** vizuelni skok kroz stvarne 3D assete, prirodan teren i citljivu mapu > beskonacno sirenje povrsine > sporedni efekti i paneli.

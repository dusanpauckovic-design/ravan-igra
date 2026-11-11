# Graficki sprint

## Mandat
Dule je odobrio zaseban graficki sprint. Izvrsilac: drugi Sol, medium, bez podagenata. Radi GFX-01 do GFX-06 redom, bez cekanja novog odobrenja izmedju tiketa. Ciljani obim je 20–30 minuta po tiketu, ne garancija trajanja. Ako treba duze, zavrsi najmanju smislenu predaju i jasno evidentiraj ostatak; ne prijavljuj nezavrseno kao gotovo.

## Vizuelni smer
Stilizovani 2.5D preko postojece 2D hex logike: fiksni pogled iskosa, figure odraslih proporcija, oslonac stopala, meke senke, dubina i preklapanje. Tamnija slikana fantastika; zemlja, trava, kamen i tkanina. Citljivost pre dekoracije. Bez pravog 3D engine-a, rigovanja, nove kampanje ili redizajna svih menija.
Prva predaja mora pokazati jednu reprezentativnu arenu, tri figure i jedan osnovni napad. Dalje iteriraj isti prikaz, ne pravi sest nepovezanih demoa. Dule moze naknadno korigovati pravac; ne cekaj njegov odgovor da nastavis odobren red.

## Aktuelna baza
Gameplay izvrsilac radi RV-03 u #7; detaljna ranija specifikacija je #4. RV-02 predaja u #6 navodi commit 28cf617372515d5184a12c658cd6728cf952d26b.
- [RV-02 source](https://chatgpt.com/library?file_id=libfile_2269f7880cb48191b713f1476197cc23&account_id=personal)
- [RV-02 HTML](https://chatgpt.com/library?file_id=libfile_a60938e134e08191af2b3b3a59250d76&account_id=personal)
Prvo procitaj aktuelne #1/#6/#7 i proveri noviju predaju. Main pri planiranju sadrzi dokumentaciju, nije dokaz da kod igre postoji na njemu. Naveden SHA je prijavljen u handoffu, proveri dostupnost. Ne koristi basketball-manager materijale.

## Vlasnistvo bez sudaranja
- Tvoja grana: graphics/gfx-sprint-01.
- Tvoji fajlovi: graphics/gfx-sprint-01/** i docs/graphics/**.
- Tu drzi renderer, stil, assete, demonstraciju, fixture podatke, gradnju i testove.
- Ne menjaj core.js, app.js, gameplay testove, save format, AI, formule, RV grane, zajednicki build, docs/STATUS.md ili docs/IDEAS.md.
- Svoj status i ideje vodi u docs/graphics/STATUS.md i docs/graphics/IDEAS.md.
- Gameplay Sol zadrzava postojece RV-03 dogadjaje i minimalni feedback za funkcionalnu predaju; ne mora da prekida tekuci rad. Novo poliranje i 2.5D modul pripadaju grafickom Solu.
- Zavisnost od integracije resava adapter u tvojoj fascikli. Predaj ugovor i primer; gameplay vlasnik kasnije menja zajednicki app.js. Nemoj sam povezivati ili objavljivati glavnu igru.
- Ne blokiraj grafiku na RV-03: koristi zamrznuti RV-02 snapshot i jasno oznacene fixture dogadjaje. Demonstracija nije potvrda integracije u zivu igru.

## Ugovor prikaza
U GFX-01 dokumentuj mali ulaz: snapshot table/jedinica i dogadjaj sa jedinstvenim ID, tipom, akterom/metom, hex putanjom i vec izracunatim rezultatom. Ako engine ima postojece ekvivalente, mapiraj ih. Renderer ne odlucuje stetu, legalnost ni poteze.
Predvidi renderSnapshot, playEvent, cancel/reset i promenu brzine ili njihove ekvivalente. Ulaz je read-only. Ponavljanje eventa ne sme menjati stanje; reset prekida stare animacije.
Hex koordinate ostaju logicne; projekcija menja samo prikaz. Hit-test mora vracati pravi hex. Fixture demo jasno obeleziti.

## Evidencija i predaja posle SVAKOG tiketa
1. U issue upisi U radu, bazu i granu pre izmene.
2. Zaseban commit i verzionisan otvoriv samostalni HTML sa kumulativnim radom. UI oznaka GFX-0X i izvorni commit.
3. Stvarni screenshot iz browsera, pre/posle iz iste kamere i scene kad ima smisla. Ne koristiti mockup kao dokaz.
4. Kratko: 3–5 konkretnih promena, kako Dule proba za 2–5 minuta, provere i ogranicenja.
5. Azuriraj docs/graphics/STATUS.md i docs/graphics/GFX-0X.md; nova ideja u IDEAS.md, prijavi ali ne prosiruj obim.
6. Linkuj trajni izvor/commit, PR kad dostupan, HTML i screenshot u issue. Ne prepisuj stare buildove. Ako GitHub push blokira stvarna zabrana, ne zaobilazi je: sacuvaj trajni paket, evidentiraj razlog i nastavi nezavisan dozvoljen rad.
7. Status: Planirano → U radu → Tehnicki spremno / ceka Duleov pregled → Prihvaceno. Ne izmisljaj Duleovo prihvatanje.
8. Nastavi sledeci tiket autonomno. Ako sesija prekine: tacan checkpoint, putanja izvora i sledeca komanda/korak. Ne obecavaj rad u pozadini nakon kraja sesije.

## Provere
Cilj: desktop, posebno 1280x800 i 1512x982. Ne tvrdi Mac/Firefox proveru ako je radjen samo Chromium/Linux. Ne dodaj novu veliku zavisnost radi demo scene. Koristi postojecu grafiku; za nove raster assete koristi imagegen ako je dostupan, ograniceno i uz dosledan stil. Ako nije, nastavi sa postojecim/vector assetima i evidentiraj ogranicenje. Belezi poreklo novih asseta.

## Red rada
- [ ] [GFX-01 — Reprezentativna 2.5D arena i osnovni napad](https://github.com/dusanpauckovic-design/ravan-igra/issues/9)
- [ ] [GFX-02 — Figure na zemlji, senke i preklapanje](https://github.com/dusanpauckovic-design/ravan-igra/issues/10)
- [ ] [GFX-03 — Prirodno kretanje i zaustavljanje](https://github.com/dusanpauckovic-design/ravan-igra/issues/11)
- [ ] [GFX-04 — Udarac, projektil i reakcija na pogodak](https://github.com/dusanpauckovic-design/ravan-igra/issues/12)
- [ ] [GFX-05 — Magija, odgurivanje i rusenje zaklona](https://github.com/dusanpauckovic-design/ravan-igra/issues/13)
- [ ] [GFX-06 — Kompletan kratki prikaz borbe i predaja integraciji](https://github.com/dusanpauckovic-design/ravan-igra/issues/14)
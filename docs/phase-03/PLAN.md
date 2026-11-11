## Etapa 3 — Moj lik, moj inventar, moj svet
Dule je odobrio visoke ciljeve: preskakanje dijaloga i brz ulaz, mnogo izbora pri kreiranju lika, character sheet, kvalitetan inventory i world building. Ovo su vece igrive celine; stari okvir 20 minuta nije rok niti razlog za povrsnu predaju. Jedan gameplay Sol i jedan graficki/UI/UX Sol; bez podagenata.

## Cilj zavrsetka
Nova igra → kreiranje svog lika → stvarni character sheet i oprema → kamp → jedna istraziva oblast sa grananjem → borbe/istrazivanje/trgovina → plen i razvoj → povratak i save/load. Sve u jednoj kumulativnoj igrivoj verziji. Ne brojati nepovezane mockup ekrane kao gotovu igru.

## Baza i kontinuitet
Poslednja procitana zajednicka predaja #37: be2ddce0b783261cb02f6cd8221969b862a7a36f, gameplay/rv-23-gfx16.
[Izvor](https://chatgpt.com/library?file_id=libfile_ef0b26916f0081918ab7c1a865ba3515&account_id=personal) · [Igra](https://chatgpt.com/library?file_id=libfile_84f3d9ab4f2c8191b37c430679db864d&account_id=personal).
GFX-17 #49 i novi UI rad su u toku prema Duleu: graficki vlasnik prvo evidentira svoj najnoviji commit/checkpoint i nadogradjuje isti rad. Ne resetovati na stariju granu.
#37 prijavljuje tehnicke provere, ali stvarni browser QA jos nije potvrdjen. Druzina/stablo u zasebnom GFX demou nisu jos svi povezani sa zivim podacima.

## Dizajn granice
- Igrac ima slobodno stablo/specijalizacije; poreklo i pocetne sklonosti ne zakljucavaju klasu.
- Samo glavni lik napreduje tier-ima; rang saboraca trajan. Do sest clanova = glavni lik + pet saboraca.
- Start nezavisan. Ne birati Red obavezno pri kreiranju; pripadnost dolazi kasnije.
- Kamp i profesije postoje: prosirivati ih, ne praviti duplikate. Pocetak skroman, ne odmah zamak.
- Hibridna mapa sa istrazivanjem i otkljucanim fast travelom; jedna smisleno povezana oblast sada, ne nasumicni kontinent.
- Mitska bica uglavnom neprijatelji; ne uvoditi univerzalno pripitomljavanje.
- World building sada znaci geografiju, lokacije, resurse, stanovnike/usluge, protivnike i trajne posledice postupaka. Ne pisati novu dugu glavnu pricu ili menjati kanon romana. Radni nazivi/porekla/likovi oznaceni kao predlog.
- Preskakanje dijaloga ne preskace kreiranje lika, bitne odluke ili stanje igre. Nema tihog izbora Reda, trosenja resursa ili dobijanja nagrada dvaput.
- Bez obavezne online usluge, proceduralnog sveta ili novog frameworka.

## Podela
Gameplay: modeli/podaci, pravila, validacija, save migracije, app integracija i jedina zajednicka igriva verzija.
Grafika/UI/UX: postojeci novi UI, komponente ekrana i rendereri, sopstveni asseti; ne core/app/save. On poseduje ceo izgled i tok interakcije, gameplay povezuje adaptere.
U prvom gameplay tiketu dokumentovati verzionisan read-only snapshot + komande za character draft, sheet, inventory, mapu i kamp. Graficki Sol predlaze potrebna polja kroz svoj docs zapis. Ne cekati da svi ekrani budu gotovi: gameplay koristi postojece funkcionalne kontrole pa ih menja zamrznutim UI predajama.
Graficki rad u sopstvenoj aktivnoj UI fascikli/grani evidentiranoj na pocetku, ne u gameplay fajlovima. Gameplay pinuje prihvaceni UI commit; nema automatskog preuzimanja pokretne graficke grane.

## Predaje i autonomija
Posle svakog tiketa commit/paket, otvoriv kumulativni HTML, konkretni dobici, 3–5 korisnickih koraka i ocekivani rezultati, ciljane QA provere i stvarni screenshot ako browser dostupan. Odvojiti simulirani DOM, stvarni browser i Duleovo prihvatanje. Testove skalirati promeni; ne ponavljati sve bez razloga.
Gameplay evidencija docs/gameplay/phase-03/**; UI docs/graphics/phase-03/**. Status, ideje, baze i linkovi na GitHubu. Ideje prijaviti, ne siriti nekontrolisano.
Nastavljati redom bez dodatnog odobrenja, sa predajom posle celine. Ako UI nije spreman, zavrsiti nezavisan model i funkcionalni tok; ne prijaviti finalnu UI integraciju kao gotovu.
Sacuvati starije save-ove i buildove. Postojecu blokadu javnog objavljivanja izvora ne zaobilaziti, koristiti trajni paket i upisati stvarno stanje.

## Merilo kvaliteta
Mnogo opcija mora dati razlicite smislene likove, ne desetine praznih dropdowna. Svaka vidljiva statistika ima izvor i efekat. Svaki predmet ima funkciju ili jasno objasnjen status. Svaka lokacija ima svrhu i postojano stanje. Izbori se cuvaju i stvarno menjaju igru.

## Najnoviji UI checkpoint
Tokom planiranja predat je [GFX-18 PR #51](https://github.com/dusanpauckovic-design/ravan-igra/pull/51): pocetak, druzina, vestine, borba i rezime. To je demonstracija sa probnim podacima. UI-01–05 nadogradjuju taj rad, ne ponavljaju ga.

## Gameplay red
- [ ] [RV-24 — Preskoci dijaloge, kreiraj lika i udji direktno](https://github.com/dusanpauckovic-design/ravan-igra/issues/52)
- [ ] [RV-25 — Bogat kreator lika sa stvarnim posledicama](https://github.com/dusanpauckovic-design/ravan-igra/issues/53)
- [ ] [RV-26 — Stvarni character sheet za glavnog lika i saborce](https://github.com/dusanpauckovic-design/ravan-igra/issues/54)
- [ ] [RV-27 — Inventory sa pouzdanim predmetima i opremanjem](https://github.com/dusanpauckovic-design/ravan-igra/issues/55)
- [ ] [RV-28 — Loot, trgovina i korisna ekonomija predmeta](https://github.com/dusanpauckovic-design/ravan-igra/issues/56)
- [ ] [RV-29 — Jedna istraziva oblast sa grananjem i putovanjem](https://github.com/dusanpauckovic-design/ravan-igra/issues/57)
- [ ] [RV-30 — Svet reaguje na tvoje postupke](https://github.com/dusanpauckovic-design/ravan-igra/issues/58)
- [ ] [RV-31 — Kamp, profesije i priprema sledeceg izlaska](https://github.com/dusanpauckovic-design/ravan-igra/issues/59)
- [ ] [RV-32 — Napredak lika kroz istrazivanje i izbor druzine](https://github.com/dusanpauckovic-design/ravan-igra/issues/60)
- [ ] [RV-33 — Jedna zajednicka RPG verzija: od kreatora do povratka u kamp](https://github.com/dusanpauckovic-design/ravan-igra/issues/61)

## UI red — nadogradnja novog UI-ja
- [ ] [UI-01 — Novi prvi ekran i kreator sa mnogo izbora](https://github.com/dusanpauckovic-design/ravan-igra/issues/62)
- [ ] [UI-02 — Character sheet kao glavni pregled lika](https://github.com/dusanpauckovic-design/ravan-igra/issues/63)
- [ ] [UI-03 — Inventory koji se lako koristi](https://github.com/dusanpauckovic-design/ravan-igra/issues/64)
- [ ] [UI-04 — Mapa sveta, kamp i osecaj mesta](https://github.com/dusanpauckovic-design/ravan-igra/issues/65)
- [ ] [UI-05 — Zaokruzen novi UI za celu RPG petlju](https://github.com/dusanpauckovic-design/ravan-igra/issues/66)

## Paralelne zavisnosti
RV-24/25 ↔ UI-01; RV-26 ↔ UI-02; RV-27/28 ↔ UI-03; RV-29/30/31 ↔ UI-04; RV-33 preuzima UI-05. UI radi po ugovorima i svoje mock podatke jasno oznacava. Gameplay moze napredovati kroz funkcionalne kontrole dok preuzima konkretne UI predaje.
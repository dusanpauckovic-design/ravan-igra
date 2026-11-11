# Sprint 2

Vlasnik: postojeci graficki Sol. Nastavi iz tehnicki predate GFX-06 verzije #14 i PR #19, bez ponavljanja GFX-01–06. U svojoj novoj fascikli nadogradjuj isti kumulativni prikaz. Citljivost i prirodniji odrasli likovi imaju prednost nad cestim efektima kamere. Status docs/graphics/sprint-02/STATUS.md; ideje docs/graphics/sprint-02/IDEAS.md. Graficki demo jasno oznaciti; ne tvrditi da je nov modul integrisan dok gameplay predaja to ne potvrdi.

## Pravila sprinta
Jedan Sol medium po redu, bez podagenata. Oko 20–30 minuta ciljanog rada po tiketu; procena nije obecanje. Svaki tiket obuhvata funkciju, njeno povezivanje u pripadajuci build i ciljanu proveru. Ne praviti zasebne tikete samo za tekst ili boju. Ako traje duze, zavrsi smislenu celinu i evidentiraj ostatak.
Pre rada proveri aktuelne predaje i postojeci kod: ne ponavljaj vec uradjeno. Zavrsi zapoceti zadatak pre ovog reda. Pricu ne prosirujemo. Ne vracaj stare sisteme inicijative niti menjaj trajne rangove.

Posle svakog: zaseban commit, verzionisan otvoriv HTML, stvarni screenshot kada browser radi, 3–5 konkretnih dobitaka, test od 2–5 minuta sa ocekivanim rezultatom i ciljane provere. Jasno odvoji stvarni browser test od simuliranog DOM-a. Bez laznog prolaza ili screenshot-a. Sacuvaj sve predaje i nastavi sledeci bez novog odobrenja. Korisnicko prihvatanje je odvojeno od tehnicke predaje.
Azuriraj svoj GitHub issue i svoju evidenciju; nove ideje prijavi i sacuvaj, ne siri aktivni obim. Na blokadi ostavi trajni checkpoint i nastavi samo nezavisan dozvoljen rad. Postojece blokade javnog push-a ne zaobilazi; dostupan source paket i tacan razlog upisi u issue.

## Saradnja
Gameplay jedini menja core/app/save i glavnu igru. Grafika jedina menja svoj renderer i assete. Gameplay koristi ZAMRZNUT GFX-06 modul iz commita 3e7492109d87a8308955adc3bb636b7b641cde53 / PR #19, ne prati automatski graficku granu.
Graficki nastavak je zaseban verzionisan modul u graphics/gfx-sprint-02/** i docs/graphics/sprint-02/**, izveden iz GFX-06. Ne menjati GFX-06 osnovu tokom integracije; zadrzati kompatibilan ugovor snapshot/event adaptera. Nove komande iz prikaza su namere koje engine validira, nikad direktna mutacija stanja.

## UI/UX je deo vlasnistva
Dule je izricito odredio da graficki Sol vodi i UI/UX: jednostavan izbor akcije, jasni meniji druzine i vestina, povratna informacija i privlacan ritam napretka. Cilj je lako razumevanje i zelja za ponovnim igranjem; ne obecavati da je zabavnost dokazana bez korisnickog testa. UI komponente su u svom modulu, gameplay vlasnik ih povezuje. Ne dodavati lazne nagrade, prisilne tajmere ili nepotrebne klikove.

## Redosled
- [ ] [GFX-07 — Jednostavan borbeni HUD i jasna hijerarhija](https://github.com/dusanpauckovic-design/ravan-igra/issues/38)
- [ ] [GFX-08 — Izbor akcije, mete i potvrda bez zabune](https://github.com/dusanpauckovic-design/ravan-igra/issues/39)
- [ ] [GFX-09 — Pregledna druzina i izbor builda](https://github.com/dusanpauckovic-design/ravan-igra/issues/40)
- [ ] [GFX-10 — Stablo vestina koje se lako razume](https://github.com/dusanpauckovic-design/ravan-igra/issues/41)
- [ ] [GFX-11 — Teren sa prirodnijim materijalima i jasnim pravilima](https://github.com/dusanpauckovic-design/ravan-igra/issues/42)
- [ ] [GFX-12 — Citljive prirodnije figure i razlicite uloge](https://github.com/dusanpauckovic-design/ravan-igra/issues/43)
- [ ] [GFX-13 — Ritam i tezina napada bez usporavanja](https://github.com/dusanpauckovic-design/ravan-igra/issues/44)
- [ ] [GFX-14 — Nagrada, napredak i sledeci susret](https://github.com/dusanpauckovic-design/ravan-igra/issues/45)
- [ ] [GFX-15 — Kratko uvodjenje i korisne borbene povratne informacije](https://github.com/dusanpauckovic-design/ravan-igra/issues/46)
- [ ] [GFX-16 — Zaokruzen UI/UX tok i kompatibilna predaja](https://github.com/dusanpauckovic-design/ravan-igra/issues/47)
# Sprint 2

Vlasnik: postojeci gameplay Sol. Prvo zavrsi RV-13 #25. Polaziste nakon toga je njegova proverena predaja, ne stari RV-03. RV-12 poslednji prijavljeni commit: 62c9d1f6002c686f26352a842bce49c51c1dbaab. GFX-06 adapter je pravljen za RV-03: prilagodi mapiranje novijim podacima bez gubitka novih pravila. Evidencija docs/gameplay/sprint-02/**; svoj glavni status azuriraj po potrebi.
GFX izvor: https://chatgpt.com/library?file_id=libfile_be50734730e48191ab6a161013af7930&account_id=personal
Integracija: https://github.com/dusanpauckovic-design/ravan-igra/blob/3e7492109d87a8308955adc3bb636b7b641cde53/docs/graphics/INTEGRATION.md

## Pravila sprinta
Jedan Sol medium po redu, bez podagenata. Oko 20–30 minuta ciljanog rada po tiketu; procena nije obecanje. Svaki tiket obuhvata funkciju, njeno povezivanje u pripadajuci build i ciljanu proveru. Ne praviti zasebne tikete samo za tekst ili boju. Ako traje duze, zavrsi smislenu celinu i evidentiraj ostatak.
Pre rada proveri aktuelne predaje i postojeci kod: ne ponavljaj vec uradjeno. Zavrsi zapoceti zadatak pre ovog reda. Pricu ne prosirujemo. Ne vracaj stare sisteme inicijative niti menjaj trajne rangove.

Posle svakog: zaseban commit, verzionisan otvoriv HTML, stvarni screenshot kada browser radi, 3–5 konkretnih dobitaka, test od 2–5 minuta sa ocekivanim rezultatom i ciljane provere. Jasno odvoji stvarni browser test od simuliranog DOM-a. Bez laznog prolaza ili screenshot-a. Sacuvaj sve predaje i nastavi sledeci bez novog odobrenja. Korisnicko prihvatanje je odvojeno od tehnicke predaje.
Azuriraj svoj GitHub issue i svoju evidenciju; nove ideje prijavi i sacuvaj, ne siri aktivni obim. Na blokadi ostavi trajni checkpoint i nastavi samo nezavisan dozvoljen rad. Postojece blokade javnog push-a ne zaobilazi; dostupan source paket i tacan razlog upisi u issue.

## Saradnja
Gameplay jedini menja core/app/save i glavnu igru. Grafika jedina menja svoj renderer i assete. Gameplay koristi ZAMRZNUT GFX-06 modul iz commita 3e7492109d87a8308955adc3bb636b7b641cde53 / PR #19, ne prati automatski graficku granu.
Graficki nastavak je zaseban verzionisan modul u graphics/gfx-sprint-02/** i docs/graphics/sprint-02/**, izveden iz GFX-06. Ne menjati GFX-06 osnovu tokom integracije; zadrzati kompatibilan ugovor snapshot/event adaptera. Nove komande iz prikaza su namere koje engine validira, nikad direktna mutacija stanja.

## Redosled
- [ ] [RV-14 — Stvarna borba u 2.5D prikazu](https://github.com/dusanpauckovic-design/ravan-igra/issues/28)
- [ ] [RV-15 — Sve postojece taktike u povezanoj borbi](https://github.com/dusanpauckovic-design/ravan-igra/issues/29)
- [ ] [RV-16 — Pametne reakcije protivnika](https://github.com/dusanpauckovic-design/ravan-igra/issues/30)
- [ ] [RV-17 — Predlozi kombinacije bez automatskog igranja](https://github.com/dusanpauckovic-design/ravan-igra/issues/31)
- [ ] [RV-18 — Dve specijalizacije kroz postojece stablo](https://github.com/dusanpauckovic-design/ravan-igra/issues/32)
- [ ] [RV-19 — Oprema kao izbor pre pohoda](https://github.com/dusanpauckovic-design/ravan-igra/issues/33)
- [ ] [RV-20 — Smislena nagrada i razvoj izmedju borbi](https://github.com/dusanpauckovic-design/ravan-igra/issues/34)
- [ ] [RV-21 — Protivnicka elita sa citljivom pripremom](https://github.com/dusanpauckovic-design/ravan-igra/issues/35)
- [ ] [RV-22 — Povezana kratka ekspedicija sa izborima](https://github.com/dusanpauckovic-design/ravan-igra/issues/36)
- [ ] [RV-23 — Usvajanje novog UI/UX modula i zajednicka verzija](https://github.com/dusanpauckovic-design/ravan-igra/issues/37)
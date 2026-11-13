# RAVAN — korisnicke UI reference (atributi, oprema, druzina)

**Datum:** 2026-11-13. **Status:** vlasnik proizvoda je poslao tri vizuelne reference; prihvacene su kao smernice za buduci dizajn, a NE kao odobren konacan Ravan UI.

## Trajni izvori (privatna Library)

Referentne fotografije su sacuvane u privatnoj ChatGPT Biblioteci, u folderu `/Ravan Igra/UI Reference/`:

1. `01-Attributes-Support-Character.jpeg` — puna figura support lika, leva kolona druzine/opreme, desni atributi i primarno unapredjenje.
2. `02-Equipment-Item-Details.jpeg` — inventar/slotovi levo, fokusirana kartica predmeta preko sredine, poredjenje atributa desno, komande za obradu i opremanje.
3. `03-Attributes-Nonhuman-Character.jpeg` — isto rasporedjenje za nehumanoidnog/posebnog junaka, sa drugacijim ambijentom i elementom.

**Autorska i pristupna napomena:** Fotografije su iskljucivo privatne reference tudje igre; NE kopirati tudje 3D modele, UI ikonografiju, identicne kompozicije, pozadine, nazive, logotipe, zvuk ili originalne teksture. Ovi fajlovi nisu ukljuceni u javni GitHub repo. Razviti originalan Ravan identitet.

## Sta je Dule eksplicitno pokazao kao ciljni kvalitet

- **Junak je centralna zvezda ekrana:** velika, jasno vidljiva figura od glave do pete, otprilike centralnih 45-55% horizontalnog prostora, sa prirodnim proporcijama, citljivim siluetama i dovoljno detaljnom odecom, oruzjem i licem.
- **Levo — izbor i opremanje:** vertikalni portreti saboraca/bliske postave; slotovi opreme i kategorije vidljivi odmah, sa jasnim oznakama zauzetog/praznog/zakljucanog; ne sakrivati kljucne kontrole u duboke menije.
- **Desno — posledice:** atributi, zdravlje, odbrana, napad i Ravan-specifikacne vrednosti, citljivo sa kratkim objasnjenjima. Posle promene opreme jasno oznaciti sta se menja (plus/minus, izvor promene); bez prenatrpanih sitnih redova.
- **Oprema na zahvat ruke:** klik na slot/prikaz predmeta otvara kompaktan floating panel sa imenom, ilustracijom, statistikama, opcijama *opremi, uporedi, unapredi*; bez odlaska na drugi dugacak ekran.
- **Vizuelni ton:** atmosfericne lokacije i autenticna Ravan paleta, ozbiljan dark-mythic fantasy, materijali kamen, metali, stara tkanina, koza; suzdrzani akcenti bakra/srebra/magijske energije; detalji ali ne mobilna RPG konfeta.
- **Razliciti likovi, dosledan sistem:** osnovni raspored atributa isti za razlicite tipove likova; pozadina moze da prati njihovu pripadnost, a nikada ne sme zamagliti citljivost informacija.
- **Kratki koraci bez vertikalnog skrolovanja:** na desktopu svi kljucni izbori i primarna akcija dostupni u viewportu; modal/panels, tabovi, paginacija i filteri umesto dugih stranica.

## Prilagodjavanje Ravni — ne prepisivati mehanike sa fotografija

- Lik ima Ravan-statistike i sisteme (rangovi Bronze/Silver/Gold, tier-ovi, talenat, sposobnosti, profesije, oprema), prema kanonskim pravilima proizvoda; ne preuzimati tudje nazive poput Enlightenment, Attack Interval ili Support.
- Ravan moze imati **do sest aktivnih** u borbi, ali glavni lik ulazi prema posebnom sistemu, ne kopirati tudji sistem postave sa screenshot-a. Dizajn izbora clanova treba da radi sa promenljivim brojem saboraca.
- Prikaz celog lika mora zaista reagovati na odabir modela, frizure, brade/tetovaze i opreme; nema laznih nakalemljenih elemenata niti nepouzdanog spajanja delova lica. Za opcije kreatora koristiti zasebne validirane kompletne modele ili drugacije provereno vizuelno resenje.
- Prvo razviti originalne Ravan mockup-e za **Atributi**, **Oprema**, **Druzina** i **Izgled lika**, sa ovim smerom i postojecim igrivim podacima. Vlasnik treba da odobri vizuelni prototip pre integracije.
- Za desktop verifikovati bez skrola na 1280x800 i 1512x982, a mobilni/tablet imati prilagodjen prikaz sa istom hijerarhijom; bez umanjivanja svega na necitljiv font.

## Sta ne zakljucivati iz samih referenci

Fotografije ne znace odobravanje: tudje slike/likovi/pozadine, identicni RPG upgrade sistemi, istih svih atributa, zasicenih boja za sve menije, jednog ogromnog ekrana za ceo manager, niti da su navedeni Ravan ekrani implementirani.

## Povezani izvori i rad

- UI osnovni tiket [#62](https://github.com/dusanpauckovic-design/ravan-igra/issues/62): karakter kreator i novi prvi ekran.
- Popravke fullscreen / pretrpanosti [#67](https://github.com/dusanpauckovic-design/ravan-igra/issues/67): ekran nije prihvacen dok se te primedbe ne rese.
- Igrivi E8 HTML iz korisnicke Biblioteke (fajl `Ravan_E8-Merged.html`), postojece snimke u `/Ravan Igra/`; ne pretpostavljati da su privatni buildovi na GitHub main.

**Pravilo za naredne agente:** kada rade Character Sheet, Inventory/Equipment i Party, procitati ovaj vodic, uporediti sa aktuelnim HTML-om i poslati vizuelni preview pre vecih izmena. Ne menjati tudje domene bez integracionog dogovora.
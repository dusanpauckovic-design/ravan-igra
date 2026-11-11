# Vizuelna dorada ekrana posle UI-FIX

Baza je UI-FIX na `graphics/ui-fix-fullscreen`. Kumulativni HTML prikazuje postojece interakcije sa probnim podacima.

| Ekran | Dorada |
| --- | --- |
| Vestine | Cetiri grane u grafu. Linije prate stvarne preduslove iz kataloga, a nauceno, dostupno i zakljucano imaju oznaku i boju. Jedna kartica pokazuje efekat, razlog ili cenu izabrane vestine. |
| Pocetak i uvod | Pejzaz nosi naslov igre. Uvod prikazuje iste izbore uz istaknuti prizor doline. |
| Kreator | Ilustrovani izbor identiteta, veci prikaz figure i simboli za atribute. Koraci i potvrde koriste postojeci draft. |
| Druzina i list lika | Silueta i ime nose profil. U listu su vrednosti atributa vidljive, a poreklo bonusa otvara se klikom. |
| Inventar | Znakovi razlikuju oruzje, oklop, potrosno i materijal. Jedna kartica cuva poredjenje i radnje odabranog predmeta. |
| Mapa | Prikaz razlikuje aktivne i neotkrivene puteve, mesto na kojem je druzina i resenu lokaciju. |
| Kamp | Pejzaz, zalihe i mapa na prvom planu. Radnje kampa su oznacene svojim simbolima. |
| Borba i nagrada | UI-FIX vec daje teren preko prozora i akcije dole. U rezimeu su nagrade oznacene simbolom. |

## Proba

1. Otvori Vestine. Klikni Prisebnost da vidis preduslov. Klikni Daleki hitac i nauci ga. Prisebnost postaje dostupna, a broj poena se smanji za jedan.
2. Otvori Magiju. Prati cetiri puta od Energetskog udara i izaberi Otisak II. U uskom prozoru klik fokusira detalj. Dugme Nazad na stablo vraca na isti cvor.
3. Otvori List lika, Inventar, Mapu i Kamp. Promeni lik, predmet i lokaciju. Prikaz naglasava izabrani element dok kontrole zadrzavaju postojece ponasanje.

## Integracija

`visuals.module.js` daje simbole i koristi postojeci `ART.battle_vista`. Komponente i CSS su u `graphics/gfx-sprint-02`. Graf uzima `catalog[id].requires` i port `status(id)`, `points()`, `submit({type:'learn',nodeId})`. Za stvarnu igru povezati odgovarajuci gameplay katalog i njegove preduslove i proslediti rezultate pravih komandi u isti prikaz. Raspored cvorova u demonstraciji mapira postojece ID-jeve iz probnog kataloga. Borbeni shell ostaje na UI-FIX. Povezivanje sa RV-33b ide kroz gameplay adapter.

## QA

`python graphics/gfx-sprint-02/build.py UI-VISUAL /tmp/Ravan_UI-VISUAL.html`. Postojeci `browser_qa.sh` koristi etapu 27 za 1280×800 i 1024×640, a etapu 28 za graf na 390×844.

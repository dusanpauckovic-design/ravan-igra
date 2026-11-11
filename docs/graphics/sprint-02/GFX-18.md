# GFX-18 — Prvi ekran i ujednacen UI

UI predaja izvedena iz GFX-17. Predaja za RV-23 i glavni gameplay build
imaju zaseban tok integracije.

- Pocetak otvara Kameni prolaz kao naslovni ekran. Daje direktan ulaz,
  pripremu druzine i precice do pojedinacnih boraca.
- Povratak na Pocetak vodi nazad na tekuci susret ili njegov rezime.
- Druzina ima pregledne portrete, uloge i trake zivota. Build i tehnike
  ostaju uz izabranog borca.
- Vestine razdvajaju preduslove, statuse i detalje. Borba koristi kompaktnije
  komande i HP trake. Rezime istice ishod, raspolozivu nagradu i sledeci korak.
- Pejzaz i likovi su postojeci Ravan vizuali iz GFX-16.

Proba: sa Pocetka izaberi Ivu, pregledaj vestine, udji u susret, odigraj
jedan napad i vrati se na Pocetak. Nastavak treba da zadrzi HP. Posle
drugog napada pogledaj rezime, izaberi nagradu i otvori sledeci susret.

QA: 65/65 na 1280×800 i 65/65 na 1512×982, Qt WebEngine/Chromium na Linuxu. Provereni nativni klikovi i Enter kroz susret, kao i povratak na aktivni susret ili rezime.

# GFX-17 — Pregled mete i putanje na tabli

Samostalna dorada na GFX-16. Zasebna graficka grana, sa probnim podacima.

- Dostupne mete imaju tacku, izabrana meta punu konturu, a blokirana
  isprekidanu konturu sa krstom i postojecim tekstualnim razlogom.
- Pregled kretanja iscrtava dostavljene heksove putanje u 2D i 2.5D.
- Na tabli strelice biraju heks, Enter otvara pregled. Potvrda je posebno
  dugme, a Escape vraca fokus na izabranu akciju.
- Promena akcije, odustajanje i reset uklanjaju prethodni pregled.

Proba: Druzina → Pregledaj vestine → Udji u susret. Izaberi Kretanje i klikni
heks 2,4, pa zaklon na 5,3. Putanja treba da nestane i potvrda da se zakljuca.
Pritisni Escape, izaberi Napad, pa desnu strelicu i Enter za pregled mete.

## Opcioni podaci za buduce povezivanje

`port.targets({action,state})` moze da vrati niz logickih heksova koje je
engine oznacio kao dostupne. `preview.path` je opciona potvrdjena putanja.
Prikaz koristi ove podatke kao vodic. Ako izostanu, ostaju izbor, razlog
blokade i poseban submit sa postojecim tokenom. Renderer ne odlucuje legalnost.
Pravila i rad na RV-23 pripadaju gameplay grani.

Qt WebEngine/Chromium na Linuxu, 1280×800: 58/58. Provereni postojece nativne komande i novi vodic, reset i zastita od ponovljenog Entera.

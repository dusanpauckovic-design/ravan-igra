# GFX-03 — Prirodnije kretanje

- Tri probne putanje, ukljucujuci dijagonale i promenu smera.
- Figura se okrece prema segmentu, korak i blagi nagib tela prate hod,
  meka senka klizi po tlu sa osloncem i figura usporava pri dolasku.
- Brzina moze da se promeni tokom prikaza. Reset prekida tekuci kadar
  i vraca pocetni prikaz. Krajnji hex dolazi sa kraja primljene putanje.

Proba: Prava putanja, Obilazak i Promena smera. Pokreni Obilazak,
klikni Reset usred hoda, pa izaberi Brzo i ponovi. Gledaj stopala i senku.
Probne putanje su iz demonstracije. Modul ne racuna prohodnost.

Qt WebEngine/Chromium Linux 1280x800 proverava sve tri krajnje tacke,
reset tokom hoda i ponavljanje. Raster figura dozvoljava stilizovani
segmentirani korak. Nema posebnih frejmova hodanja po smerovima.

# GFX-01 — Kameni prolaz

- Jedna teren scena sa zemljom, zelenilom, stenama, prolazom i lomljivim zaklonom od 18 HP.
- Radan, Iva i Merin zadrzavaju RV-03 siluete, a Tihi lovac sluzi kao meta.
- Fiksni kosi prikaz, ravni uporedni prikaz iste scene, hover i logicki hex.
- Napad prikazuje zamah, kontakt i povratak u stav. Rezultat je neutralna fixture proba.

Proba za Dula: otvori Ravan_GFX-01.html, preklopi 2D/2.5D,
prelazi misem preko heksova, izaberi tri saveznika i pokreni Napad pa Ponovi.
Klik na polje bira borca na njegovim stopalima, a desni spisak daje drugi put do selekcije.

Izvor je zaseban graficki commit. Baza za art i ugovor je stvarna RV-03
predaja, a arena je graficka demonstracija. Pregled ugovora je u CONTRACT.md.

Provera: Qt WebEngine/Chromium na Linuxu, 1280x800, oba prikaza.
Provereni svih 54 centara u oba moda, kontrole u okviru viewporta,
selekcija sa table i spiska, povratak u stav i konzola.

# UI-FIX · borba preko celog prozora i komande na klik

Predaja grafike i UI-ja za #67. Baza je UI-05. Samostalni HTML je demonstracija sa probnim podacima.

- Borba koristi ceo viewport. Cilj i red poteza su gore, osnovne akcije i potvrda dole. Tehnike, detalji i postavke dele jedan panel.
- Klik na akciju otvara pregled. Za kretanje, napad, lecenje i oznaku klik na polje bira metu, a zasebno dugme potvrdi potez. Odustajanje vraca traku akcija. Gard i preskakanje imaju eksplicitnu potvrdu.
- `Ceo ekran` salje zahtev preko Fullscreen API na klik. Dugme cita stvarno stanje iz `document.fullscreenElement`, a promene prati preko `fullscreenchange`. Ako browser odbije zahtev, status objasnjava zasto i borba ostaje preko celog dostupnog prozora.
- Renderer odvaja logicke koordinate table od velicine prozora i gustine piksela. Tabla se prilagodjava visini zaglavlja i komandne trake.

## Proba

Otvori samostalni HTML u tabu i klikni **Brza arena**. Izaberi **Kretanje**, klikni na dostupno polje, promeni metu pa potvrdi. Probaj **Odustani** posle izbora napada. Proveri i **Gard**, **Preskoci** i **Tehnike**. Dugme **Ceo ekran** testiraj u punom browseru i izadji preko dugmeta ili Escape.

## Predaja za #68

- Preuzeti borbeni raspored iz `index.html` i `view.css`, kao i `RavanBattleShell(view)` iz `battle-shell.module.js`. Raspored aktivira `#app[data-view=battle]`. Pozvati `resize()` pri ulasku u borbu i `close()` pri izlasku iz prikaza.
- `viewer.resize(width,height,{top,bottom,dpr})` prima CSS piksele. `clientToBoard(clientX,clientY)` pretvara klik u koordinate za postojeci `hitTest(x,y)`; `boardToClient(project(cell))` vraca poziciju heksa u prozoru.
- Povezati potvrde na stvarne komande preko gameplay adaptera uz postojeci tok pregled → potvrda → odgovor engine-a → prikaz. Iz gameplay snapshota citati red poteza, raspolozive akcije i razloge kada akcija nije dostupna. Probni gard, preskakanje i tehnika postoje samo u demonstraciji.
- Zadrzati stvarne snapshot i save tokove iz integracione grane. Nativni ulaz, izlaz na dugme i izlaz preko Escape jos treba proci u browseru koji odobrava fullscreen. Qt WebEngine test je potvrdio granu odbijenog zahteva.

## Reprodukcija

Iz korena repozitorijuma:

```sh
python graphics/gfx-sprint-02/build.py UI-FIX /tmp/Ravan_UI-FIX.html
bash graphics/gfx-sprint-02/browser_qa.sh /tmp/Ravan_UI-FIX.html /tmp 26 1280x800
bash graphics/gfx-sprint-02/browser_qa.sh /tmp/Ravan_UI-FIX.html /tmp 26 1512x982
```

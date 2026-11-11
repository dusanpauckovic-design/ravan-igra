# GFX-06 — Predaja integraciji

## Fajlovi

- `graphics/gfx-sprint-01/renderer.js` nudi `RavanGraphics.createRenderer(canvas, sources, onChange?)`.
- `graphics/gfx-sprint-01/rv03-adapter.js` nudi `RavanGraphicsRV03.snapshot`,
  `mapReceipt` i `createPlayback`.
- `assets/` u kompletnom grafickom paketu sadrzi izvedenice iz RV-03.
  `prepare_art.py /putanja/do/RV-03/assets` reprodukuje ih iz originala.
- `demo.js`, `view.css`, `index.html` i `build.py` pripadaju offline demonstraciji.
  `python graphics/gfx-sprint-01/build.py GFX-06 Ravan_GFX-06.html`
  pakuje JS, CSS i art u samostalni fajl.
- `adapter_qa.js /putanja/do/RV-03/src/core.js` koristi stvarni RV-03 core u proveri.
  `browser_qa.sh` proverava otvoriv HTML i hvata snimke kroz Qt WebEngine.

## Ulaz i izlaz

Canvas treba da ima internih 960 × 570. CSS moze da skalira prikaz. Daj
`sources` kao mapu naziva asseta na lokalni URL ili data URL.
`ready` se resava posle pokusaja ucitavanja slika. `project({x,y})` i
`hitTest(canvasX,canvasY)` dele istu projekciju. Ulaz je zero-based odd-row
offset kao u RV-03. Fizicki canvas pikseli se dobijaju skaliranjem
`clientX/Y - getBoundingClientRect().left/top` odnosom canvas/CSS dimenzija.
Ukljuci `onChange(snapshot)` samo za prikaz i HUD.

Snapshot je `{width,height,active,units,covers,trails,danger}`.
RV-03 adapter prenosi `units.id/team/x/y/hp/hpMax/mark`,
`battle.current`, `battle.obstacles`, `battle.trails` i niz
`units.intent` za opasna polja. Podrazumevane RV-03 dimenzije su 11 × 7.
Dostupne su `pickSprite(unit)` i dimenzije u opcionom parametru.
Podrazumevana grafika za nepoznate humanoide koristi Radanovu siluetu.

Dogadjaj ima `id,type,actor?,target?,from?,at?,path,result`. Rezultat po
potrebi sadrzi `hp: [{id,hp,delta}]`, `covers: [{id,hp}]`,
`marks: [{id,mark}]`, pun niz `trails` i `danger`. Kamera reaguje samo
na opcioni `impact: 'heavy'` iz ulaza. Podrzani tipovi su `move`, `push`,
`melee`, `ranged`, `mark`, `markEnd`, `trailPlace`, `trailHit`, `cover`
i `sync`. Zavrsni 0 HP daje pozu pada. Renderer radi na sopstvenoj kopiji
i primenjuje rezultat jednom u kontaktu. `skip()` primenjuje zavrsetak
tekucog vizuelnog dogadjaja. `cancel()` prekida kadar, a
`reset(snapshot)` prazni i evidenciju ID-jeva. `setSpeed(n)`,
`setReducedMotion(bool)` i `setCameraEffects(bool)` uticu na prezentaciju.

## Primer povezivanja

U postojecem borbenom view-u postavi persistentan canvas i instancu.
U trenutku ulaska ili ponovnog ucitavanja borbe dodeli jedinstven
`battleId` za taj zivotni ciklus. Pozovi posle **uspesnog** `commitPlan`
iz RV-03 i povezi sa postojecim input lock-om.

```js
const gfx = RavanGraphics.createRenderer(canvas, sources, updateVisualHUD);
const adapter = RavanGraphicsRV03;
const player = adapter.createPlayback(gfx);
await gfx.ready;
player.reset(battleId, adapter.snapshot(battle));

// U postojecem handleru koji vec ima uspesan rezultat commitPlan:
const displayed = await player.play(battleId, committed.before, battle, committed.receipt);
// 'complete' znaci da je zavrsni snapshot nacrtan. Postojeci engine
// handler ostaje odgovoran za input lock, persist, AI i osvezavanje menija.
```

Na izlasku iz borbe pozovi `player.cancel()`; na restartu ili load-u
pozovi `player.reset(newBattleId, adapter.snapshot(loadedBattle))`.
Renderer rezervise canvas za citanje i crtanje. Klik i tastaturu obradi u
postojecem gameplay kodu uz njegovu proveru legalnosti. `player.play`
ocekuje serijske potvrde dok je borbeni prikaz aktivan. Stari ID borbe,
dupli receipt i poziv dok je prethodni u toku vracaju `ignored`.
Za ponovnu selekciju pozovi `gfx.select(selectedId)` po zavrsetku prikaza.

## RV-03 ogranicenja

- RV-03 izazovi daju `receipt.visuals`: move, attack, push, trail,
  markSpent, cover i fall. Adapter cuva njihov red, cepa kretanje na
  okidanju traga ako je heks u prosledjenoj putanji, a oznake i postavljanje
  traga dopunjava iz razlike pre/posle.
- `receipt.changes` ima zbirni HP po jedinici. Kod vise pogodaka iz
  istog receipt-a taj rezultat se prikazuje jednom na poslednjem
  relevantnom kontaktu. Poseban HP po kontaktu zahteva takav rezultat iz
  engine-a. Ako borba nema putanju u visuals, zavrsni snapshot i dalje
  prikazuje tacnu poziciju, bez izmisljanja koraka.
- Trenutni RV-03 hook je `v6Run` / `v6Animate` u `src/v06.js`.
  Gameplay vlasnik treba da zadrzi stabilan canvas kroz `render()`,
  zameni stari vizuelni poziv i uskladi trajanje input lock-a s Promise
  zavrsetkom. Postojeci save, pravila, AI i formulu stete koristi igra.
- Fixture build demonstrira sve probe. Adapter je proveren protiv stvarnih
  RV-03 receipata u Node-u, a prikaz u Chromium/Qt na Linuxu. Povezivanje sa
  zivom igrom i Mac/Safari/Firefox provera ostaju za integraciju.

# Predaja UI-05 za RV-33

UI commit je pinovan u tiketu #66. Kumulativni HTML je offline demonstracija.
Gameplay vlasnik povezuje komponente sa zivim stanjem i izdaje zajednicki build.
Baza za mapiranje je RV-25 `c31805f562946e2956ef68b701417d05661a2421`,
`docs/gameplay/phase-03/UI-CONTRACT.md` i `src/phase03.js`.

## Sloj adaptera

Koristi `window.RavanRPG.snapshot()` za citanje i
`window.RavanRPG.dispatch({version:1,revision:snapshot.revision,...command})`
za komande. Posle svake potvrde ucitaj snapshot. Na odbijanju koristi
`result.error`, prikazi ga kao `reason` u UI-ju i osvezi podatke.
Stvarne borbene potvrde zadrzavaju `RavanGameplayUI`.

| Ekran | Stvarni ulaz | Mapiranje komandi i otvorene tacke |
|---|---|---|
| Pocetak | `screen`, `saved.name/level/screen` | Nova igra → `new`, Nastavi → `continue`. Brza arena ostaje na posebnom gameplay ulazu. |
| Kreator | `creatorCatalog`, `draft`, `draft.profile`, `draft.preview` | Lokalni draft do potvrde. `origin` → `profile.background`; talent, flaw, kit i `attributes.hp/atk/def/speed` idu istim ID-jevima. Figure guard/archer → `hero/hero_alt`; story/skip → `story/quick`. Posalji kompletan validan `draft` sa `step:1`, zatim `begin` uz novu reviziju. `needsConfirmation` prikazi kroz postojecu gameplay potvrdu. Stvarni pregled noza/luka cita `draft.preview`. |
| Uvod | `dialogue.node/mode` i dostupne odluke iz gameplay scenarija | Preskoci → `dialogueMode {mode:'quick'}`. Kartice odluke koriste stvarni `storyChoice {id}`; prvo oruzje `firstWeapon {id}`; obicno dalje `storyNext`, regrutacija `recruitChoice {accept}`. Probni ridge/river ID-jevi pripadaju samo demonstraciji. |
| List lika | `sheet.roster[].id,level,xp,job,active,stats,equipment,current`, `sheet.profile,tier,skills,points` | Renderuj izracunate vrednosti. Izvori bonusa, rang/status i poredjenje opreme treba da stignu u snapshotu; ne izracunavati ih iz opisa. Ucenje → `learn {id}`. |
| Inventar | `inventory.slots`, `inventory.items[].uid`, `sheet.roster[].equipment` | `equip {hero,slot,uid}`, `uid:null` skida. Pretraga, sortiranje i omiljeno su UI prikaz ili engine preferenca ako postoji. Cena, capacity i blokade, kupovina/prodaja/upotreba/plen ocekuju RV-27/28 portove. |
| Mapa | `map.position`, `map.locations[].id/name/x/y/completed/available/requires` | `navigate {to:'map'}`. Mrezu, otkrivenost i komande putovanja/aktivnosti dopuniti iz RV-29/30. |
| Kamp | `camp.level/day/resources/salves`, druzina i profesije | `navigate {to:'camp'}`. Odmor, priprema i potrosnja zaliha koriste komande i razloge iz RV-31. |
| Ishod i nagrada | Zivi ishod, dozvoljene nagrade i trenutno odrediste | Postojece gameplay potvrde za plen, nagradu i checkpoint. Probni povratak na lokaciju iz world fixture-a zameniti RV-33 tokom. |

Komponente ekrana su `character.module.js`, `sheet.module.js`,
`inventory.module.js`, `world.module.js` i `feedback.module.js` u
`graphics/gfx-sprint-02/`. `demo.js` je primer kompozicije sa fixture portovima.
Svaki port cita snapshot i salje komande. Loading, potvrda posledice i
greska su predstavljeni odvojeno. Prioritet povezivanja: naslov/kreator,
list/oprema, mapa/kamp, zatim prolaz celog RV-33 toka sa starim save-om.

## Ogranicenja predaje

Kreator u UI-05 koristi RV-25 ID-jeve i granice 4/2. Brojevi lista lika,
stanje sveta, cene i cuvanje unutar sesije su probni. Engine ostaje
izvor pravila, trajnog save-a, izvedenih vrednosti i potvrde komandi.
QA ukljucuje stvarne klikove i Enter za kamp → mapa → borba → nagrada → kamp.

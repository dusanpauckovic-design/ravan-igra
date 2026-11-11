# Ugovor prikaza

Renderer prima obicne JSON podatke. `renderSnapshot({width,height,units,covers})`
ucitava tablu. Jedinica ima `id,name,team,sprite,x,y,hp,hpMax`. Zaklon ima
`x,y`, opciono `id,hp,hpMax`. Koordinate su zero-based, odd-row offset,
identicne RV-03 `x/y`. `project(cell)` i `hitTest(canvasX,canvasY)` koriste
istu projekciju. Upravljanje pravilima i odabir legalnih poteza ostaju na strani igre.

`playEvent({id,type,actor,target,path,result})` cita izvrsene dogadjaje.
`id` je jedinstven unutar borbe, `actor/target` su ID-jevi jedinica,
`path` je putanja kao lista logickih polja, `result` je vec izracunat.
GFX-01 koristi `melee` bez posledice u kratkoj fixture animaciji. Rezultat,
putanja i dodatni tipovi se razradjuju dalje. Promise vraca `complete`,
`cancelled` ili `ignored`. `cancel()` prekida trenutni kadar.
`reset(snapshot)` ucitava novi prikaz i prazni evidenciju dogadjaja.
`setSpeed(n)` menja brzinu.

RV-03 ima `battle.units`, `battle.obstacles`, `receipt.seq`,
`receipt.changes` i za izazove `receipt.visuals`. Integrator imenuje
borbu i spaja identitet borbe + sekvencu + indeks vizuelnog dogadjaja.
Predaja prikazuje zamrznutu, isecenu scenu po uzoru na arenu RV-03.
Njeno dugme 2D osnova predstavlja iste fixture podatke u ravnoj projekciji.

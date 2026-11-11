# GFX-16 — predaja za RV-23

Predaja je offline demonstracija koja koristi probne snapshotove i portove.
Bazirana je na zamrznutom GFX-06 commitu
`3e7492109d87a8308955adc3bb636b7b641cde53`.
Putanje `graphics/gfx-sprint-02/**` i `docs/graphics/sprint-02/**` su zasebne.
Stara GFX-06 grana ostaje baza koju gameplay moze da koristi nezavisno.

## Migracija iz GFX-06

| Ulaz ili poziv | GFX-16 |
|---|---|
| `RavanGraphics.createRenderer(canvas, sources, onChange?)` | Isti poziv i internih 960×570. |
| Snapshot `width,height,active,units,covers,trails,danger` | Isti format. Opciono `terrain: [{x,y,kind}]`, gde je kind earth, grass, stone ili mud. Nedostajuci teren je zemlja. Prepreke se i dalje citaju iz covers. |
| `project`, `hitTest`, `renderSnapshot`, `playEvent`, `reset`, `cancel`, `skip`, brzina | Isti ugovor. `describeCell` vraca vrstu podloge i prepreku za HUD. |
| Standardni receipt i njegov ID | Kopirani `rv03-adapter.js` ostaje adapter GFX-06. Za novi UI port vrati jedinstven ID dogadjaja ili prosledi mapirani niz kroz postojece serijsko pustanje. |
| Novi vizuelni tipovi | Opciono `guard` sa actor ID i `observe` sa actor/target ID. Dolaze iz potvrdjenog engine dogadjaja. |
| Oznake, HP, kretanje i rusenje | Rezultat, celije putanje i oznake i dalje stizu iz engine-a. UI nema ovlascenje da ih preracunava. |

## UI portovi

`demo.js` pokazuje sastavljanje ekrana i mount komponente. U RV-23
ucitaj `renderer.js`, potrebne `*.module.js` komponente i postavi UI
kontejner iz `index.html`. Zameni `RavanFixture*` instance portovima
koji citaju stvarno stanje. `demo.js` sadrzi probne susrete i sluzi kao
primer povezivanja. U igri odluku o otvaranju susreta donosi vlasnik
postojeceg toka, uz svoju validaciju.

| Port | Ulaz | Odgovor |
|---|---|---|
| Akcije `preview` | `{action,target,state}`; state je kopija za prikaz, engine koristi svoje stanje | `{ok,token,summary,cost}` ili `{ok:false,reason}` |
| Akcije `submit` | Opaque token prethodnog pregleda | `{ok,event,message,outcome?}` ili razlog; token vazi za isti turn i reviziju |
| Druzina `get` | — | Clanovi sa ID, ulogom, rangom, oruzjem, siluetom, build opcijama, tehnikama i tri slota |
| Druzina `submit` | `{unitId,build}` ili `{unitId,slot,technique}` | `{ok,reason?}`; citaj stanje ponovo nakon prihvatanja |
| Vestine `status,points,submit` | ID cvora ili `{type:'learn',nodeId}` | Stanje cvora, poeni i rezultat; katalog sadrzi ime, opis, cenu i preduslov |
| Rezultat `open,get,submit` | Ishod i kontekst, pa `{type,resultId,rewardId?}` | Model rezimea, dostupni izbori i razlozi, pa prihvacena nagrada, checkpoint ili sledeci susret |

Akcioni panel zakljucava slanje dok stize potvrda. Engine proverava
aktuelnog aktera, metu, cenu i token i primenjuje rezultat jednom.
Ako receipt sadrzi vise dogadjaja, prosledi seriju adapteru i otkljucaj
UI nakon prikaza potvrdenog snapshota. Promena susreta/reset treba da
otkaze prethodnu animaciju i da ucita novi snapshot.

## Potrebni engine podaci

- Stabilni ID borbe, runde/poteza i receipta, aktivni borac, jedinice i
  HP, putanje, prepreke, polja opasnosti i opciono materijal polja.
- Vazece akcije i mete, potvrdena cena, razlog blokade i tok preview tokena.
- Uloga, rang, oprema i aktivne tehnike druzine. Uslovi i efekti builda.
- Poeni, nauceni cvorovi, preduslovi, dostupnost i cena vestina.
- Ishod i stvarni rezime, dozvoljene nagrade, checkpoint i sledeci susret.
  Model nagrada iz demonstracije je probni izbor sa RV-13 tipovima resursa.
- Politika istorije i cuvanja podesavanja UI-ja. Demonstracija ih drzi u memoriji.

GFX-16 UI i renderer su predati za povezivanje. Povezivanje i provera u
RV-23 ostaju za gameplay predaju. GFX-06 receipt bridge je sacuvan kao
referenca. Novi UI portovi su provereni na probnom modelu.

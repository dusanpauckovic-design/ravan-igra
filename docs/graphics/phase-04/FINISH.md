# Etapa 4 · graficka predaja na RV-42 preflight

Baza igre: `e234c0bfa733d4485c845acf43393f0da26330d5`. Grana grafike: `graphics/phase04-finish`. HTML ukljucuje vec pinovan UI-19 iz gameplay predaje i naslovni meni iz #88.

- **UI-19**: na stvarnom RV-39 portu prikazuje samo vidljive pokretne grupe. Test pripremljenog kontakta prolazi od prikazane mape do stvarnog RV-40 susreta. Puna desktop sesija i prirodan povratak iz susreta nisu ponovljeni ovom grafickom predajom.
- **UI-20**: stablo cita vidljive putanje i preduslove iz `C.skillTree` i `C.skillStatus`. Pre obuke tri fizicke osnove. Posle obuke, Tier II i nivoa 4 pojavljuju se stvarno dostupni cvorovi. Plan do tri vidljive vestine je lokalni UI izbor i ne trosi poene. Prvo otkrivanje u sesiji ima kratak vizuelni signal sa podrskom za reduced motion. Kupovina, respec i pravila loadout-a ostaju u igri.
- **GFX-21**: adapter prosledjuje geometriju, blato, biome i arhetip iz stvarne borbe, ukljucujuci medjustanja animacije. Razlike koriste postojeci sprite, proporciju i opremu. Teren i kontaktne senke iz #86 ostaju ukljuceni. Gard i lecenje dobijaju razlicit vizuelni signal; promašaj se prikazuje samo ako ga dogadjaj eksplicitno prijavi. Sinteticki zvuk pocinje klikom, sa jačinom, mute i opcijom za manje detalja terena u **Tehnike i detalji**. Zvuk se vezuje za jedan kontakt po dogadjaju. Audio signal je sinteticki Web Audio; nijedan dodatni asset nije preuzet.

## Test

1. Odigraj uvod i udji u Vestine. Na pocetku su samo fizicke osnove. Posle obuke pogledaj nove grane. Dodaj dostupnu vestinu u plan, pa je nauci i proveri poene. U kampu probaj potvrdu respec-a.
2. Na mapi udji u kontakt. Prebaci borbu na 2.5D. Izaberi isto polje u oba prikaza. U detaljima ukljuci zvuk ili smanji detalje terena.
3. Probaj punu rutu kampanje i povratak iz borbe. Nativni fullscreen i Escape se proveravaju u standardnom desktop browseru.

Qt WebEngine kompatibilna kopija: 13/13 na 1280×800, 1024×640 i 390×844 sa pripremljenim stanjima. Node simulacija Canvas-a: 30 generisanih tabli kroz tri bioma, osam arhetipova i centri svih polja u oba moda. Pet tipova simuliranih dogadjaja × tri nacina reprodukcije daje isto stanje i po jedan kontakt. To nisu merenja ukupnog frame vremena ili potvrda zvuka na fizickom izlazu. Desktop fullscreen, dve pune rute, ukupni frame time i prihvatanje ostaju otvoreni.

```sh
python /putanja/do/RV42/build.py
python graphics/phase04/build-finish-preview.py /putanja/do/RV42 /tmp/Ravan_RV42_Grafika.html
node graphics/phase04/qa/battle-renderer.cjs /putanja/do/RV42
```

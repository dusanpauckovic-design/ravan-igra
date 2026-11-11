# GFX-21 · checkpoint materijala i kontakta

- Zajednicka baza RV-35 `4a3b9e933c9f9b933b5d124b042f41c37748681e`. Graficka baza UI-VISUAL, `f12eedfbcd00ad3a19f2e69f7ae7458066c4a8d2`. Grana `graphics/phase04-battle-materials`.
- Isporuceno u `graphics/gfx-sprint-02/renderer.js`. Trava koristi busenje, blato odsjaj u udubljenjima, a kamen senku i osvetljenu ivicu. Razmere otiska prate projekciju postojeceg polja. Polozaji detalja zavise od koordinata i ne koriste gameplay RNG. Materijali se iscrtavaju u kesirani sloj. Oznake polja, opasnosti i ciljevi ostaju iznad detalja.
- Ziva i pala figura dobijaju siroku meku i uzu kontaktnu senku. Otisak se skalira prema prikazanoj figuri i prati njeno kretanje. Izvor postojeceg pejzaza i figura je paket RV-03 koji je vec evidentiran u prethodnim grafickim predajama. Novi tragovi i senke su nacrtani kodom u Canvas-u. Nema preuzetih novih asseta.
- HTML je kumulativni graficki demo na postojecim probnim podacima, ne integrisana etapa 4. Puna provera #84 ceka UI-20, RV-40 i biome iz RV-36/RV-39. Preostaju arhetipovi, susreti na stvarnim tablama, nova obrada animacija i zvuka, uporedni frame time i nativni fullscreen.

## Test

Otvori HTML i klikni **Brza arena**. Uporedi busenje, mokro tlo i kamen, zatim izaberi borca i probaj **Kretanje**. Posle promene prikaza izmedju 2D i 2.5D isti vidljivi heks treba da bira isto logicko polje. Uporedivi snimci koriste isti susret i isti pocetni pogled.

```sh
python graphics/gfx-sprint-02/build.py GFX21-checkpoint /tmp/Ravan_GFX21_Materijali.html
bash graphics/gfx-sprint-02/browser_qa.sh /tmp/Ravan_GFX21_Materijali.html /tmp 27 1280x800
```

# Ravan · naslovni meni

Baza: RV-37 `11122b5fdd2ebc3c53f9e1eb2363f1631aadd4a8` + UI-19 `d420672fc1f7f6378e9e35a7de233095bcd060c2`. Graficka grana: `graphics/phase04-ravan-title`.

Kompozicija kao naslovnica: putnici i dolina preko prozora, naslov, jedna istaknuta akcija i odvojene opcije. Na uskom ekranu kadar prelazi na panoramu dolaska. Bordo, stari zlatni ton i tanki obrub prate postojeci koncept `Ravan: The Traveling Camp.png`. Slika koncepta sluzi kao vizuelna referenca. Igriva verzija koristi vec ugradjene ciste ilustracije `ART.vista` i `ART.story_arrival`, evidentirane u RV izvoru `ASSET_SOURCES.md`. Znak iznad naslova je graficki ukras, bez nove kanonske tvrdnje.

Bez sacuvane partije, glavno dugme je **Nova igra**. Ako save postoji, **Nastavi igru** je prvo, sa prikazanim imenom lika. Uvoz, arena, podesavanja i ceo ekran koriste postojece akcije. Kreator, solo uvod i UI-19 ostaju u istom kumulativnom buildu.

## Reprodukcija

```sh
python graphics/phase04/build-title-preview.py Ravan_RV37_UI19.html Ravan_RV37_Naslovni_Meni.html
```

Proba: klikni **Nova igra** i proveri da se otvara kreator. Otvori **Podesavanja**. Klikni **Borbena arena** i proveri da je otvoren pravi borbeni ekran. Iz igre se vrati na naslovni meni pa klikni **Nastavi igru** i proveri da su ime i seed isti.

Qt test koristi kompatibilnu kopiju. Vidljivost komandi za uvoz i ceo ekran proverena je u DOM-u. Nativni fullscreen i dijalog uvoza nisu deo ovog testa.

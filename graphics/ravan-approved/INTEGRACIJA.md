# RAVAN · Graficka predaja za glavnu verziju

Baza igrivog kandidata je E8 `fc158d7cb3d88c5ecc1d6cbd1e44434953aafaa4`. Izvor te verzije i HD kreatora je u ovom paketu. GitHub `main` pri proveri bio je `aff9f4404a9b9043400c136ea772d409a4f6fd1a` i nema taj igrivi build. Predaja ide integratoru na #135 uz #129 i #130.

## U zajednickom HTML-u

- Zapadna kapija Magovog Dara u stvarnom naslovnom ekranu.
- Identitet i izgled na odvojenim koracima kreatora, 108 HD modela i portreti, oprema, terenske vestine i list lika. Izbor izgleda i opreme prolazi kroz E8 port do kampanje i prve borbe.
- Povezana mapa kampanje sa animacijom putovanja, borbene komande nad metom, 2D/2.5D prikaz, stablo vestina, kamp i UI iz faza 5–8.
- Dugme **3D dolina** u mapi kampanje otvara izolovan WebGL pregled sa gusćom maglom u daljini. Povratak vraca istu kampanju. Staze, sat i gaz 3D pregleda pripadaju njegovom lokalnom stanju.

## Povezivanje koje integrator treba da zavrsi

- Vezati 3D scenu za autoritativni WorldPort: ID lokacije i koordinata, izbor/preview putanje, vreme, otkrivenost, susreti, gaz i serijalizacija. Dugme u ovom buildu služi za odobreni vizuelni pregled.
- Deluxe V4 ima odobren koncept gradje, sest atributa i zasebnih stabala. Kandidat prenosi odvajanje identiteta i izgleda. Produkciono racunanje dodatnih atributa i stabala zahteva mapiranje pravila i save-a. Prototip je [Deluxe V4](https://chatgpt.com/library?file_id=libfile_d6e015638660819199f4771f38f2cc83&account_id=personal).
- Tri alternativna pravca za bojiste, kamp i mapu iz [vizuelnog poredjenja](https://chatgpt.com/library?file_id=libfile_a5f843d436c88191bc89f8cc501d49c1&account_id=personal) imaju status predloga. Potvrdjeni kadar Zapadne kapije vec je u kandidatu. BG3 tema pripada licnoj verziji.

## Gradnja

`python ravan-approved/build.py RAVAN_Dolina_Putovanje.html Ravan_Zajednicki_Graficki_Kandidat.html`

Prvi argument je samostalni HTML 3D mape. HTML se pravi iz E8 i HD modula, bez promene fajlova engine-a. Snimci i QA pripadaju istoj predaji.

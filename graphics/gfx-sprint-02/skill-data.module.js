/* Presentation catalog from RV-13 SKILLS. */
window.RavanSkillCatalog = {
  "marksmanship": {
    "name": "Mirna tetiva",
    "desc": "+2 snage dok koristis luk. Fizicka vestina.",
    "cost": 1,
    "tier": 1,
    "kind": "passive",
    "icon": "bow"
  },
  "longshot": {
    "name": "Daleki hitac",
    "desc": "+1 dometa osnovnom napadu lukom.",
    "cost": 1,
    "tier": 2,
    "requires": "marksmanship",
    "kind": "passive",
    "icon": "bow"
  },
  "steady": {
    "name": "Prisebnost",
    "desc": "Luk izbliza zadrzava 90% snage umesto 75%.",
    "cost": 1,
    "tier": 2,
    "requires": "longshot",
    "kind": "passive",
    "icon": "eye"
  },
  "strength": {
    "name": "Siguran udarac",
    "desc": "+3 snage napada. Pasivno.",
    "cost": 1,
    "tier": 1,
    "kind": "passive",
    "icon": "sword"
  },
  "vitality": {
    "name": "Cvrsto telo",
    "desc": "+18 zivotnih poena. Pasivno.",
    "cost": 1,
    "tier": 1,
    "kind": "passive",
    "icon": "heart"
  },
  "bolt": {
    "name": "Energetski udar",
    "desc": "Magijski napad do 6 polja. Trosi 2 energije.",
    "cost": 1,
    "tier": 1,
    "kind": "active",
    "icon": "spark"
  },
  "heal": {
    "name": "Obnova",
    "desc": "Vraca do 26 zivota, do 5 polja. Trosi 2 energije.",
    "cost": 1,
    "tier": 1,
    "kind": "active",
    "icon": "heal"
  },
  "charge": {
    "name": "Prodor",
    "desc": "Prilazak i udar u jednoj akciji, do 4 polja. Trosi 2 fokusa.",
    "cost": 2,
    "tier": 2,
    "requires": "strength",
    "kind": "active",
    "icon": "sword"
  },
  "slow": {
    "name": "Prekid ritma",
    "desc": "Magijski udar do 6 polja i odlaganje mete. Trosi 2 energije.",
    "cost": 2,
    "tier": 2,
    "requires": "bolt",
    "kind": "active",
    "icon": "clock"
  },
  "armor": {
    "name": "Postojanost",
    "desc": "+3 odbrane. Pasivno.",
    "cost": 1,
    "tier": 2,
    "requires": "vitality",
    "kind": "passive",
    "icon": "shield"
  },
  "precision": {
    "name": "Ostrina",
    "desc": "+2 snage napada. Pasivno.",
    "cost": 1,
    "tier": 2,
    "requires": "charge",
    "kind": "passive",
    "icon": "sword"
  },
  "farreach": {
    "name": "Daleki odjek",
    "desc": "+1 dometa Energetskom udaru i Prekidu ritma (ukupno 7).",
    "cost": 1,
    "tier": 2,
    "requires": "slow",
    "kind": "passive",
    "icon": "eye"
  },
  "mobility": {
    "name": "Lagan korak",
    "desc": "+1 polje kretanja. Pasivno.",
    "cost": 1,
    "tier": 2,
    "requires": "armor",
    "kind": "passive",
    "icon": "map"
  },
  "restoration": {
    "name": "Duboka obnova",
    "desc": "+8 lecenja Obnovom (ukupno 34). Pasivno.",
    "cost": 1,
    "tier": 2,
    "requires": "mastery",
    "kind": "passive",
    "icon": "heal"
  },
  "mastery": {
    "name": "Mirna ruka",
    "desc": "+1 maksimalni fokus. Pasivno.",
    "cost": 1,
    "tier": 2,
    "requires": "heal",
    "kind": "passive",
    "icon": "spark"
  },
  "potisak": {
    "name": "Potisak",
    "desc": "Energetski udar odguruje prezivelu metu jedno legalno polje.",
    "cost": 1,
    "tier": 2,
    "kind": "passive",
    "requires": "bolt",
    "icon": "spark"
  },
  "potisakPlus": {
    "name": "Potisak II",
    "desc": "Ako zid ili borac zaustavi odgurivanje, udar dobija +5 snage.",
    "cost": 1,
    "tier": 2,
    "kind": "passive",
    "requires": "potisak",
    "icon": "spark"
  },
  "otisak": {
    "name": "Otisak",
    "desc": "Energetski udar ostavlja trag na polju pogotka.",
    "cost": 1,
    "tier": 2,
    "kind": "passive",
    "requires": "bolt",
    "icon": "spark"
  },
  "otisakPlus": {
    "name": "Otisak II",
    "desc": "Drugi saveznik moze namerno da aktivira trag Oznakom ili Energetskim udarom na metu na polju.",
    "cost": 1,
    "tier": 2,
    "kind": "passive",
    "requires": "otisak",
    "icon": "spark"
  },
  "prenos": {
    "name": "Prenos",
    "desc": "Sledeci pogodak drugog saveznika obnavlja mu energiju do maksimuma.",
    "cost": 1,
    "tier": 2,
    "kind": "passive",
    "requires": "bolt",
    "icon": "spark"
  },
  "prenosPlus": {
    "name": "Prenos II",
    "desc": "Isti pogodak ima i +4 snage.",
    "cost": 1,
    "tier": 2,
    "kind": "passive",
    "requires": "prenos",
    "icon": "spark"
  }
};

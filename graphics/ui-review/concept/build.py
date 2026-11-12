"""Package the independent visual proposal and its read-only E8 reference."""
from argparse import ArgumentParser
from base64 import b64encode
from hashlib import sha256
from pathlib import Path
import json

parser = ArgumentParser(description=__doc__)
parser.add_argument("base_html", type=Path)
parser.add_argument("assets", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent
base = args.base_html.read_bytes()
if sha256(base).hexdigest() != "4c0e79597d70c5b1401dfda49321c5de461be848bb9016445296979f0af941d0":
    parser.error("Expected the E8 merge fc158d7")

reference = r"""<script>
(() => {
 const scene = '__REF_SCENE__';
 document.body.inert = true;
 document.body.style.pointerEvents = 'none';
 if(scene === 'menu') return;
 const s = RavanCore.newNarrativeGame('Putnica','hero_alt','strength',RavanCore.defaultProfile(),'forest');
 s.completed.push('opening');
 s.narrative.node = 'camp';
 s.narrative.soloIntro = {phase:'trained',version:1};
 s.narrative.magicUnlocked = true;
 s.overworld = RavanOverworld.create('know-4');
 s.screen = 'camp';
 s.resources.wood = 40; s.resources.stone = 25; s.resources.gold = 50;
 RavanCore.meetRadan(s);
 RavanCore.chooseFirstWeapon(s,'knife');
 if(scene === 'battle') RavanCore.startBattle(s,'trail');
 RavanDebug.setState(s);
 if(scene === 'battle' && RavanGameplayUI.snapshot().mode !== '2.5D') {
   document.querySelector('[data-act=live-gfx-toggle]')?.click();
 }
 RavanDebug.stopAI();
})();
</script>"""
baseline = base.decode().replace("</body>", reference+"</body>", 1)
encoded = json.dumps(baseline, ensure_ascii=False).replace("<", "\\u003c")
html = (root/"index.html").read_text().replace("__STYLE__", (root/"concept.css").read_text())
html = html.replace("__SCRIPT__", (root/"concept.js").read_text())
for key, filename in {
    "VISTA":"vista.jpg", "ARRIVAL":"story_arrival.jpg", "BATTLE":"battle_vista.jpg",
    "GROUND":"battle_ground.jpg", "CAMP":"camp_early.jpg", "HERO":"figure_hero.png",
    "WOLF":"figure_wolf.png", "GUARD":"figure_guard.png",
}.items():
    ext = Path(filename).suffix
    mime = "image/jpeg" if ext == ".jpg" else "image/png"
    data = b64encode((args.assets/filename).read_bytes()).decode()
    html = html.replace(f"__{key}__", f"data:{mime};base64,{data}")
args.output.write_text(html.replace("__REFERENCE__", encoded))

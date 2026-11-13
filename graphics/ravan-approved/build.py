"""Build a single offline E8 candidate with the approved visuals and 3D valley preview."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("valley", type=Path, help="Standalone RAVAN_Dolina_Putovanje.html")
parser.add_argument("output", type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent

def replace_once(page, before, after):
    if page.count(before) != 1:
        raise ValueError("Expected one integration point: " + before[:100])
    return page.replace(before, after, 1)

def creator(page):
    # The existing campaign port still owns character validation, loadout and saved identity.
    page = replace_once(page, "const steps=['Izgled','Poreklo','Atributi','Vestine','Oprema','Pregled'];",
                        "const steps=['Identitet','Izgled','Poreklo','Atributi','Vestine','Oprema','Pregled'];")
    page = replace_once(page, "const stepTitles=['Izgled putnika'", "const stepTitles=['Ko si ti?','Izgled putnika'")
    page = replace_once(page, "return [native[0],null,native[2]", "return [native[0],null,null,native[2]")
    start = page.index("const oldCreator=window.RavanCharacterCreation;")
    stop = page.index(" window.RavanSheet=function", start)
    module = page[start:stop]
    for i in reversed(range(1, 6)):
        module = module.replace(f"if(step==={i})", f"if(step==={i+1})")
    module = module.replace("step===5?", "step===6?").replace("step<5", "step<6")
    module = replace_once(module,
        "label.append(input);identity.append(label,choices('look','Tip lika'));panel.append(identity);",
        "label.append(input);identity.append(label,choices('look','Tip lika'));panel.append(identity);\n"
        "   }\n   if(step===1){")
    return page[:start] + module + page[stop:]

with TemporaryDirectory() as tmp:
    campaign = Path(tmp) / "campaign.html"
    subprocess.run([sys.executable, str(root.parent / "ravan-character-ui/build.py"), str(campaign)], check=True)
    page = creator(campaign.read_text())
    personal_audio = page.index("const theme = 'https://open.spotify.com/embed/track/")
    audio_end = page.index("</script>", personal_audio)
    audio_start = page.rindex("<script>", 0, personal_audio)
    menu_layout = """<script>(() => {
      const app=document.getElementById('app');
      function mount(){
        const cover=app.querySelector('.rv-title:not(.rv-private-title)');
        if(!cover)return;
        const settings=cover.querySelector('.rv-title-tools [data-act="settings"]');
        if(settings)cover.querySelector('.rv-title-choices')?.append(settings);
        cover.classList.add('rv-private-title');
      }
      new MutationObserver(mount).observe(app,{childList:true,subtree:true});
      mount();
    })();"""
    page = page[:audio_start] + menu_layout + page[audio_end:]

# Inject only into the real campaign map's HUD. Opening the art preview never sends a campaign command.
page = replace_once(page, "    tools.append(full);",
    "    const valley=toggleButton('3D dolina',()=>window.RavanApprovedValley.open(port)); valley.className='rv-open-approved-valley'; tools.append(full,valley);")
module = (root / "valley-panel.js").read_text()
style = (root / "approved.css").read_text()
page = replace_once(page, "</head>", "<style>" + style + "</style></head>")
valley_json = json.dumps(args.valley.read_text(), ensure_ascii=False).replace("<", r"\u003c")
page = replace_once(page, "</body>", "<script>" + module.replace("/* VALLEY_HTML */ null", valley_json) + "</script></body>")
args.output.write_text(page)

"""Make a visual gallery from the actual RV-36 generator and UI-19 terrain renderer."""
import argparse
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('generator', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
view = Path(__file__).with_name('overworld-view.js').read_text(encoding='utf-8')
generator = args.generator.read_text(encoding='utf-8')
template = """<!doctype html><html lang="sr-Latn"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ravan · Generisane regije</title>
<style>body{margin:0;background:#162420;color:#f2e8d0;font:15px Arial,sans-serif}
main{max-width:1200px;margin:auto;padding:24px}h1{font:38px Georgia,serif;margin:0 0 18px}
h2{font:19px Georgia,serif;margin:12px 0 6px}.maps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
figure{margin:0;padding:6px;border:1px solid #586857;border-radius:6px;background:#22322a}
canvas{width:100%;display:block}figcaption{padding:5px}</style>
<main><h1>Generisane regije</h1><div id="gallery"></div></main>
<script>/* GENERATOR */</script><script>/* VIEW */</script>
<script>
const gallery=document.getElementById('gallery');
for(let i=1;i<=10;i++){
 const seed='UI19-Dolina-'+String(i).padStart(2,'0');
 const heading=document.createElement('h2'), maps=document.createElement('div');
 heading.textContent=seed;maps.className='maps';
 for(const region of RavanOverworld.create(seed).regions){
  const item=document.createElement('figure'), label=document.createElement('figcaption');
  label.textContent=['Recna dolina','Duboka suma','Kameniti prevoj'][region.id];
  item.append(RavanWorldView.regionThumbnail(region),label);maps.append(item);
 }
 gallery.append(heading,maps);
}
</script></html>"""
args.output.write_text(template.replace('/* GENERATOR */', generator).replace('/* VIEW */', view), encoding='utf-8')

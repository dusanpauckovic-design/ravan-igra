"""Build the independent three-family effect study."""
from pathlib import Path
import sys

src = Path(__file__).with_name('energy.js').read_text()
html = '''<!doctype html><html lang="sr-Latn"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ravan · Studija energije</title>
<style>
body{margin:0;background:#15231e;color:#f2e7cc;font:16px Georgia,serif}
main{max-width:960px;margin:auto;padding:32px 20px}
header{border-bottom:1px solid #718471;padding-bottom:20px}
h1{font-size:clamp(32px,6vw,54px);margin:0 0 8px}
section{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:24px 0}
article{border:1px solid #718471;border-radius:8px;padding:12px;background:#203027}
h2{margin:4px 0 10px}
canvas{display:block;width:100%;aspect-ratio:2.4}
button{padding:8px 12px;color:#251d13;background:#e7c68b;border:0;border-radius:4px}
</style><main><header><h1>Studija energije</h1><p>Art QA · odvojeno od kampanje. Neferina dimenzionalna pojava je posebna referenca.</p>
<button type="button" aria-pressed="false" id="motion">Pokreni prikaz</button></header>
<section><article><h2>Bela</h2><canvas data-kind="white"></canvas><p>Hladni filamenti i zlatno jezgro.</p></article>
<article><h2>Siva</h2><canvas data-kind="grey"></canvas><p>Senka i prstenovi prostornog pritiska.</p></article>
<article><h2>Crna</h2><canvas data-kind="black"></canvas><p>Zbijena masa sa nepravilnim rubom.</p></article></section></main>
<script>__ENERGY__
const motion=document.getElementById('motion');
let running=false,frame=0;
function paint(t){
 for(const canvas of document.querySelectorAll('canvas')){
  const c=canvas.getContext('2d');
  c.fillStyle='#a39878';c.fillRect(0,0,150,150);
  c.fillStyle='#172523';c.fillRect(150,0,150,150);
  for(const x of [75,225])RavanE7Energy.draw(c,x,75,canvas.dataset.kind,running?.55+.35*Math.sin(t*.004):.75);
 }
 if(running)frame=requestAnimationFrame(paint);
}
motion.onclick=()=>{
 running=!running;motion.setAttribute('aria-pressed',String(running));
 motion.textContent=running?'Zaustavi prikaz':'Pokreni prikaz';
 cancelAnimationFrame(frame);paint(performance.now());
};
paint(0);
</script></html>'''
Path(sys.argv[1]).write_text(html.replace('__ENERGY__',src),encoding='utf-8')

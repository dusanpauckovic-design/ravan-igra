"""Bundle the graphics module and its local fixture into one offline HTML."""
import argparse
import base64
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('version')
parser.add_argument('output', type=Path)
parser.add_argument('--source')
args = parser.parse_args()
assets = {p.stem: 'data:image/webp;base64,' + base64.b64encode(p.read_bytes()).decode()
          for p in sorted((root / 'assets').glob('*.webp'))}
if len(assets) != 7:
    parser.error("Missing RV-03 art. Use the complete graphics package or run prepare_art.py RV-03/assets.")
parts = { 'STYLE': (root / 'view.css').read_text(), 'ASSETS': 'const ART = ' + json.dumps(assets) + ';',
          'RENDERER': (root / 'renderer.js').read_text(), 'DEMO': '\n'.join(p.read_text() for p in sorted(root.glob('*.module.js'))) + '\n' + (root / 'demo.js').read_text() }
source = args.source or 'sha256:' + hashlib.sha256(''.join(parts.values()).encode()).hexdigest()[:16]
html = (root / 'index.html').read_text()
for token, value in parts.items():
    html = html.replace('/*' + token + '*/', value)
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(html.replace('@VERSION@', args.version).replace('@SOURCE@', source)
                       .replace('@BASE@', 'c93005bb'))

"""Add the Ravan opening screen to the existing RV-37 + UI-19 HTML."""
import argparse
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('base', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent
html = args.base.read_text(encoding='utf-8')
end = html.lower().rfind('</body>')
if end < 0 or 'window.RavanDebug=' not in html or 'data-act="rpg-new"' not in html:
    parser.error('Expected a built Ravan campaign HTML.')
css = (root / 'title-menu.css').read_text(encoding='utf-8')
script = (root / 'title-menu.js').read_text(encoding='utf-8')
args.output.write_text(html[:end] + '<style>' + css + '</style><script>' + script + '</script>\n' + html[end:], encoding='utf-8')

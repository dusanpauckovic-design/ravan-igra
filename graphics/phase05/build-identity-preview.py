"""Assemble a portable E5-D1 review build from a built E5-P1 checkout."""
import argparse
from pathlib import Path
import re

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent
html = (args.source / 'index.html').read_text(encoding='utf-8')
if 'appearanceCatalog' not in html or 'RavanCharacterCreation' not in html:
    parser.error('Expected a built E5-P1 checkout with Identity v1.')
for vendor, owned in {
    'renderer.js': root.parent / 'gfx-sprint-02/renderer.js',
    'battle-adapter.js': root.parent / 'phase04/battle-adapter.js',
}.items():
    original = (args.source / 'vendor/phase04-finish' / vendor).read_text(encoding='utf-8')
    if html.count(original) != 1:
        parser.error(f'Expected one embedded {vendor}.')
    html = html.replace(original, owned.read_text(encoding='utf-8'), 1)
html, replacements = re.subn(
    r'^(const RAVAN_GFX_SOURCES = [^\n]+)$',
    lambda match: match[1] + '\nObject.assign(RAVAN_GFX_SOURCES,{figure_hero:ART.figure_hero,figure_scout:ART.figure_scout});',
    html, count=1, flags=re.M,
)
if replacements != 1:
    parser.error('Expected the owned graphics asset catalog.')
end = html.lower().rfind('</body>')
css = (root / 'appearance.css').read_text(encoding='utf-8')
scripts = '\n'.join((root / name).read_text(encoding='utf-8') for name in ('appearance.js', 'appearance-preview.js'))
html = html[:end] + '<style>' + css + '</style><script>' + scripts + '</script>\n' + html[end:]
args.output.write_text(html, encoding='utf-8')

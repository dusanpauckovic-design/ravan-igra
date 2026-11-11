"""Assemble a portable graphics review build from an E5 gameplay checkout."""
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
for folder, vendor, owned in [(
    'phase04-finish', 'renderer.js', root.parent / 'gfx-sprint-02/renderer.js'
), (
    'phase04-finish', 'battle-adapter.js', root.parent / 'phase04/battle-adapter.js'
), *([(
    'ui19', 'overworld-view.js', root.parent / 'phase04/overworld-view.js'
)] if 'inspect-trace' in html else [])]:
    original = (args.source / 'vendor' / folder / vendor).read_text(encoding='utf-8')
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
if end < 0:
    parser.error('Expected a complete HTML body.')
css = (root / 'appearance.css').read_text(encoding='utf-8')
scripts = '\n'.join((root / name).read_text(encoding='utf-8') for name in ('appearance.js', 'appearance-preview.js'))
if 'inspect-trace' in html:
    css += '\n' + (root / 'world-trace.css').read_text(encoding='utf-8')
    scripts += '\n' + (root / 'world-trace.js').read_text(encoding='utf-8')
if 'interruptPreparation' in html:
    css += '\n' + (root / 'tactical-view.css').read_text(encoding='utf-8')
    scripts += '\n' + (root / 'tactical-view.js').read_text(encoding='utf-8')
html = html[:end] + '<style>' + css + '</style><script>' + scripts + '</script>\n' + html[end:]
args.output.write_text(html, encoding='utf-8')

"""Build a graphics preview on a compatible E6 gameplay checkout."""
import argparse
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('game', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--through', type=int, choices=range(1, 6), default=5)
args = parser.parse_args()
own = Path(__file__).resolve().parent
html = (args.game / 'index.html').read_text()
replacements = {'overworld-view.js': own.parent / 'phase04/overworld-view.js'}
if args.through >= 4:
    replacements.update({'battle-adapter.js': own.parent / 'phase04/battle-adapter.js',
                         'renderer.js': own.parent / 'gfx-sprint-02/renderer.js'})
for name, path in replacements.items():
    original = (args.game / 'vendor/phase05' / name).read_text()
    if html.count(original) != 1:
        parser.error(f'Expected one embedded {name} from the integrated E5 base.')
    html = html.replace(original, path.read_text(), 1)
modules = ('terrain', 'journal', 'groups', 'contact', 'consequences')[:args.through]
css = '\n'.join((own / f'{name}.css').read_text() for name in modules)
js = '\n'.join((own / f'{name}.js').read_text() for name in modules)
end = html.rindex('</body>')
args.output.write_text(html[:end] + f'<style>{css}</style><script>{js}</script>' + html[end:])

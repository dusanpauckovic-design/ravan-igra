"""Build an E7 graphics candidate using an existing built gameplay checkout."""
import argparse
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('game', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--through', type=int, choices=range(1,6), default=5)
args = parser.parse_args()
own = Path(__file__).resolve().parent
html = (args.game/'index.html').read_text()
for name, path in {
    'renderer.js': 'gfx-sprint-02/renderer.js',
    'battle-adapter.js': 'phase04/battle-adapter.js',
    'overworld-view.js': 'phase04/overworld-view.js',
}.items():
    original = (args.game/'vendor/phase05'/name).read_text()
    if html.count(original)!=1:
        parser.error(f'Expected exactly one gameplay copy of {name}.')
    html = html.replace(original,(own.parent/path).read_text(),1)
if args.through >= 5:
    sound = (args.game/'vendor/phase04-finish/battle-audio.js').read_text()
    if html.count(sound)!=1:
        parser.error('Expected exactly one audio module.')
    html = html.replace(sound,(own.parent/'phase04/battle-audio.js').read_text(),1)
css = []
js = []
for directory, names in [(own.parent/'phase06',('terrain','journal','groups','contact','consequences')),
                         (own,('families','elite','energy','mastery','feedback')[:args.through])]:
    for name in names:
        js.append((directory/f'{name}.js').read_text())
        css.append((directory/f'{name}.css').read_text())
end = html.rindex('</body>')
args.output.write_text(html[:end]+'<style>'+'\n'.join(css)+'</style><script>'+'\n'.join(js)+'</script>'+html[end:])

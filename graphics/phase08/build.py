"""Build a graphical E8 candidate without changing the gameplay checkout."""
import argparse
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('game',type=Path)
p.add_argument('output',type=Path)
p.add_argument('--through',type=int,choices=range(1,6),default=5)
a=p.parse_args()
own=Path(__file__).resolve().parent
html=(a.game/'index.html').read_text()
for vendor,dst in [('phase06/renderer.js','gfx-sprint-02/renderer.js'),
                   ('phase06/battle-adapter.js','phase04/battle-adapter.js'),
                   ('phase04-finish/battle-audio.js','phase04/battle-audio.js')]:
    original=(a.game/'vendor'/vendor).read_text()
    if html.count(original)!=1:
        p.error(f'Expected one pinned copy of {vendor}')
    html=html.replace(original,(own.parent/dst).read_text(),1)
scripts=[]
styles=[]
for directory,names in [(own.parent/'phase07',('families','elite','energy','mastery','feedback')),
                        (own,('camp','party','equipment','expedition','final')[:a.through])]:
    for name in names:
        scripts.append((directory/f'{name}.js').read_text())
        styles.append((directory/f'{name}.css').read_text())
end=html.rindex('</body>')
a.output.write_text(html[:end]+'<style>'+'\n'.join(styles)+'</style><script>'+'\n'.join(scripts)+'</script>'+html[end:])

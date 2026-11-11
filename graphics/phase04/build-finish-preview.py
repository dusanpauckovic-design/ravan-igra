"""Layer owned presentation code on a built RV-42 preflight source package."""
import argparse
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('base', type=Path, help='RV-42 source directory with its built index.html')
parser.add_argument('output', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent
html = (args.base / 'index.html').read_text(encoding='utf-8')
for pinned, replacement in (
    ('vendor/ui-fix/renderer.js', root.parent / 'gfx-sprint-02' / 'renderer.js'),
    ('vendor/gfx-06/rv03-adapter.js', root / 'battle-adapter.js'),
):
    source = (args.base / pinned).read_text(encoding='utf-8')
    if html.count(source) != 1:
        parser.error(f'Expected exactly one embedded copy of {pinned}.')
    html = html.replace(source, replacement.read_text(encoding='utf-8'), 1)
css = '\n'.join((root / name).read_text(encoding='utf-8') for name in ('title-menu.css', 'skill-tree-view.css'))
js = '\n'.join((root / name).read_text(encoding='utf-8') for name in (
    'skill-tree-view.js', 'battle-audio.js', 'battle-audio-controls.js', 'title-menu.js'))
end = html.lower().rfind('</body>')
if end < 0:
    parser.error('Expected closing body in RV-42 HTML.')
args.output.write_text(html[:end] + '<style>' + css + '</style><script>' + js + '</script>\n' + html[end:], encoding='utf-8')

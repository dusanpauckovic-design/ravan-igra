"""Attach the visual-only D1 checkpoint to a built Ravan HTML."""
import argparse
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('base', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent
html = args.base.read_text(encoding='utf-8')
end = html.lower().rfind('</body>')
if end < 0 or 'RavanCharacterCreation' not in html:
    parser.error('Expected a built Ravan creator with its existing campaign port.')
css = (root / 'appearance.css').read_text(encoding='utf-8')
scripts = '\n'.join((root / name).read_text(encoding='utf-8') for name in ('appearance.js', 'appearance-preview.js'))
args.output.write_text(html[:end] + '<style>' + css + '</style><script>' + scripts + '</script>\n' + html[end:], encoding='utf-8')

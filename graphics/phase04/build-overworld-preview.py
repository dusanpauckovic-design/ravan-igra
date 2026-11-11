"""Attach the UI-19 presentation to an existing, built RV-36 HTML."""
import argparse
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('base', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent
html = args.base.read_text(encoding='utf-8')
if 'window.RavanWorldPort=Object.freeze(' not in html:
    parser.error('Expected the RV-36 HTML with RavanWorldPort v1.')
css = (root / 'overworld-view.css').read_text(encoding='utf-8')
scripts = '\n'.join((root / name).read_text(encoding='utf-8') for name in ('overworld-view.js', 'overworld-preview.js'))
end = html.lower().rfind('</body>')
if end < 0:
    parser.error('Expected a closing body tag in the RV-36 HTML.')
args.output.write_text(html[:end] + '<style>' + css + '</style><script>' + scripts + '</script>\n' + html[end:], encoding='utf-8')

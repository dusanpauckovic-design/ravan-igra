"""Append the review UI to a pinned playable E8 HTML."""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path

BASE_SHA256 = "4c0e79597d70c5b1401dfda49321c5de461be848bb9016445296979f0af941d0"

parser = ArgumentParser(description=__doc__)
parser.add_argument("base", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()
base = args.base.read_bytes()
if sha256(base).hexdigest() != BASE_SHA256:
    parser.error("Expected Ravan_E8-Merged.html from the E8 merge fc158d7")
root = Path(__file__).resolve().parent
css = (root / "preview.css").read_text()
js = (root / "preview.js").read_text()
html = base.decode()
args.output.write_text(html.replace("</body>", f"<style>{css}</style><script>{js}</script></body>", 1))

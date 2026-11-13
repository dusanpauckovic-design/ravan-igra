"""Build the self-contained browser preview. Requires the pinned npm devDependencies."""
import argparse
import base64
import json
import mimetypes
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument("output", type=Path)
parser.add_argument("--target", default="chrome110")
parser.add_argument("--esbuild", default=str(root / "node_modules/.bin/esbuild"))
args = parser.parse_args()
built = subprocess.check_output([
    args.esbuild, str(root / "main.js"), "--bundle", "--format=iife", "--minify",
    f"--target={args.target}", "--legal-comments=inline"
], cwd=root, text=True)

files = sorted((root / "assets").glob("*")) + [root / "Ravan_Originalni_Teren_Dolina.glb"]
assets = {}
for path in files:
    media = mimetypes.guess_type(path)[0] or "application/octet-stream"
    assets[str(path.relative_to(root))] = f"data:{media};base64," + base64.b64encode(path.read_bytes()).decode()
page = (root / "index.html").read_text()
page = page.replace('<link rel="stylesheet" href="style.css">', '<style>'+ (root / "style.css").read_text() + '</style>')
page = page.replace('<script type="module" src="main.js"></script>',
    '<script>globalThis.RAVAN_ASSETS='+json.dumps(assets, separators=(",", ":"))+';</script>\n<script>'+built.replace("</script","<\\/script")+'</script>')
args.output.write_text(page)

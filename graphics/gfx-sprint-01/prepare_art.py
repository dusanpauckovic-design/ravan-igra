"""Reproduce the WebP atlas inputs from an unpacked RV-03 assets directory."""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('rv03_assets', type=Path)
args = parser.parse_args()
destination = Path(__file__).resolve().parent / 'assets'
destination.mkdir(exist_ok=True)
sizes = {
    'battle_vista': (1180, 650), 'battle_ground': (650, 440),
    'figure_guard': (250, 300), 'figure_archer': (250, 300),
    'figure_caster': (250, 300), 'figure_wolf': (250, 300),
    'terrain_rock': (250, 300),
}
for name, size in sizes.items():
    source = next(args.rv03_assets.glob(name + '.*'))
    with Image.open(source) as original:
        image = original.convert('RGBA' if source.suffix == '.png' else 'RGB')
    if image.mode == 'RGBA':
        bounds = image.getchannel('A').point(lambda alpha: 255 if alpha > 33 else 0).getbbox()
        image = image.crop(bounds)
    image.thumbnail(size, Image.Resampling.LANCZOS)
    image.save(destination / (name + '.webp'), quality=85, method=6)

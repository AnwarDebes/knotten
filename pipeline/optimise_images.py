"""Make the WebP copies the website serves, from the model stills and the owner's original images.

Run from anywhere:  python pipeline/optimise_images.py
Only files newer than their WebP copy are redone. The originals are kept outside the public folder
(assets-src/incoming), so only the optimised copies are served.
"""
import os
from pathlib import Path
from PIL import Image

KN = Path(__file__).resolve().parent.parent
REN = KN / "renders"
SRC = KN / "assets-src" / "incoming"
PUB = KN / "site" / "public"
JOBS = [
    # stills rendered from the live 3D model (pipeline/twin_flyin.js and __twin.still)
    (REN / "site_after.png", PUB / "renders/web/site_after.webp", 1920),
    (REN / "site_after.png", PUB / "renders/web/site_after_960.webp", 960),
    (REN / "grillbu_photo_match.png", PUB / "renders/web/grillbu_photo_match.webp", 1600),
    (REN / "knotten_view_model.jpg", PUB / "renders/web/knotten_view_model.webp", 1600),
    (PUB / "img/kart-terreng-1km.png", PUB / "renders/web/site_map.webp", 1400),
    # the owner's photographs and maps
    (SRC / "view_from_grillbu.jpg", PUB / "assets/incoming/web/view_from_grillbu.webp", 1600),
    (SRC / "cadastral_map.png", PUB / "assets/incoming/web/cadastral_map.webp", 1400),
    (SRC / "grillbu_map.png", PUB / "assets/incoming/web/grillbu_map.webp", 1400),
    (SRC / "knotten_map.png", PUB / "assets/incoming/web/knotten_map.webp", 1400),
    (SRC / "knotten_terrain_map.png", PUB / "assets/incoming/web/knotten_terrain_map.webp", 1400),
    (SRC / "norgeskart_property.png", PUB / "assets/incoming/web/norgeskart_property.webp", 1400),
    (SRC / "sightline_map.png", PUB / "assets/incoming/web/sightline_map.webp", 1400),
    (SRC / "site_plan_sketch.png", PUB / "assets/incoming/web/site_plan_sketch.webp", 1400),
    (SRC / "terrain_profile.png", PUB / "assets/incoming/web/terrain_profile.webp", 1400),
]
Image.MAX_IMAGE_PIXELS = None
for src, dst, w in JOBS:
    if not src.exists():
        continue
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        continue
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=82, method=6)
    print(f"{dst.relative_to(PUB)}  {im.size}  {os.path.getsize(dst) // 1024} KB")
print("done")

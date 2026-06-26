#!/usr/bin/env python3
"""Normalise une image CMS : JPEG, transparence aplatie, redim à 1600px max."""
import sys, os, shutil
from PIL import Image

def normalize(path):
    if not os.path.exists(path):
        print(f"❌ Introuvable : {path}"); return
    img = Image.open(path)
    print(f"Input  : {path}  ({img.mode}, {img.size[0]}x{img.size[1]})")
    backup = path + ".original"
    if not os.path.exists(backup):
        shutil.copy(path, backup)
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
        print("        Transparence aplatie")
    else:
        img = img.convert("RGB")
    if img.size[0] > 1600:
        ratio = 1600 / img.size[0]
        img = img.resize((1600, int(img.size[1] * ratio)), Image.LANCZOS)
        print(f"        Redim → {img.size[0]}x{img.size[1]}")
    img.save(path, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"✅ Output : {path}  ({os.path.getsize(path)//1024} KB)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage : python3 backend/normalize-image.py <chemin>"); sys.exit(1)
    for p in sys.argv[1:]: normalize(p)

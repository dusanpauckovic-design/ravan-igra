"""Recreate the licensed browser assets from the pinned source manifest."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import zipfile

root = Path(__file__).resolve().parent
manifest = json.loads((root / "assets_manifest.json").read_text())

def fetch(spec, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["curl", "--fail", "--location", "--silent", "--show-error",
                    "--retry", "1", "--max-time", "90", spec["url"], "-o", str(path)], check=True)
    if spec.get("sha256"):
        assert hashlib.sha256(path.read_bytes()).hexdigest() == spec["sha256"], path
    if spec.get("md5"):
        assert hashlib.md5(path.read_bytes()).hexdigest() == spec["md5"], path

def pack_model(entry, folder, output):
    files = [(folder / entry["source_name"], entry["download"])]
    files += [(folder / name, spec) for name, spec in entry["download"]["include"].items()]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(lambda item: fetch(item[1], item[0]), files))
    model = json.loads(files[0][0].read_text())
    binary = bytearray((folder / model["buffers"][0]["uri"]).read_bytes())
    for image in model["images"]:
        binary.extend(b"\0" * (-len(binary) % 4))
        data = (folder / image.pop("uri")).read_bytes()
        image.update(bufferView=len(model["bufferViews"]), mimeType="image/jpeg")
        model["bufferViews"].append({"buffer": 0, "byteOffset": len(binary), "byteLength": len(data)})
        binary.extend(data)
    binary.extend(b"\0" * (-len(binary) % 4))
    model["buffers"] = [{"byteLength": len(binary)}]
    meta = json.dumps(model, separators=(",", ":")).encode()
    meta += b" " * (-len(meta) % 4)
    output.write_bytes(struct.pack("<III", 0x46546C67, 2, 28+len(meta)+len(binary)) +
                       struct.pack("<I4s", len(meta), b"JSON") + meta +
                       struct.pack("<I4s", len(binary), b"BIN\0") + binary)

def texture(input_file, output_file, quality):
    subprocess.run(["magick", str(input_file), "-strip", "-quality", str(quality), str(output_file)], check=True)

with tempfile.TemporaryDirectory() as temporary:
    work = Path(temporary)
    for entry in manifest["assets"]:
        if entry["source"] == "RAVAN":
            continue
        if entry["source"] == "ambientCG":
            pack = work / "ground.zip"
            fetch(entry["download"], pack)
            with zipfile.ZipFile(pack) as archive:
                for row in entry["outputs"]:
                    source = work / row["zip_member"]
                    source.write_bytes(archive.read(row["zip_member"]))
                    output = root / row["path"]
                    output.parent.mkdir(parents=True, exist_ok=True)
                    texture(source, output, row["quality"])
            continue
        output = root / entry["path"]
        output.parent.mkdir(parents=True, exist_ok=True)
        if entry["kind"] == "GLB":
            fetch(entry["download"], output)
        elif entry["kind"] == "MakeHuman OBJ":
            source = work / "makehuman-base.obj"
            fetch(entry["download"], source)
            subprocess.run(["blender", "-b", "-t", "3", "--python", str(root / "make_traveler.py"),
                            "--", str(source), str(output)], check=True)
        elif entry["kind"] == "texture":
            source = work / (output.stem + ".jpg")
            fetch(entry["download"], source)
            texture(source, output, entry["quality"])
        elif entry["kind"] == "glTF":
            packed = work / "pine-source.glb" if entry.get("simplify") else output
            pack_model(entry, work / output.stem, packed)
            if entry.get("simplify"):
                subprocess.run(["blender", "-b", "-t", "3", "--python", str(root / "simplify_pine.py"),
                                "--", str(packed), str(output)], check=True)

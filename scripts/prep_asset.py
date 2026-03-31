"""
General-purpose asset preparation for CuttleQuest.
Takes ChatGPT-generated pixel art and outputs game-ready transparent PNGs.

Pipeline: remove background -> auto-trim -> add padding -> resize (NEAREST)

Usage:
  python scripts/prep_asset.py input.png -o creatures -s 64
  python scripts/prep_asset.py sheet.png -o creatures -s 48 --split 4x3 --prefix crab
  python scripts/prep_asset.py *.png -o items -s 32 --no-rembg
  python scripts/prep_asset.py input.png -o bg -s 256 --no-trim

Output goes to public/assets/<output>/
"""

import sys
import os
import re
import argparse
from pathlib import Path
from PIL import Image
import numpy as np


_rembg_remove = None


def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert pixel art images into game-ready transparent PNGs.",
        epilog="Output goes to public/assets/<output>/",
    )
    parser.add_argument("inputs", nargs="+", help="Input image path(s)")
    parser.add_argument(
        "-o", "--output", required=True,
        help="Subdirectory under public/assets/ (created if needed)",
    )
    parser.add_argument(
        "-s", "--size", type=int, required=True,
        help="Target square size in pixels (e.g. 32, 48, 64, 128, 256)",
    )
    parser.add_argument(
        "--split",
        help="Split spritesheet as COLSxROWS (e.g. 4x3)",
    )
    parser.add_argument(
        "-p", "--padding", type=int, default=0,
        help="Transparent padding around content before resize (default: 0)",
    )
    parser.add_argument(
        "--no-trim", action="store_true",
        help="Skip auto-trim (useful for backgrounds)",
    )
    parser.add_argument(
        "--no-rembg", action="store_true",
        help="Skip background removal (if already transparent)",
    )
    parser.add_argument(
        "--prefix",
        help="Prefix for output filenames (e.g. --prefix crab -> crab_0.png)",
    )
    parser.add_argument(
        "--names",
        help="Comma-separated output names without .png (must match sprite count)",
    )

    args = parser.parse_args()

    # Validate --split format
    if args.split:
        if not re.match(r"^\d+x\d+$", args.split):
            parser.error("--split must be in COLSxROWS format (e.g. 4x3)")

    # Parse --names into list
    if args.names:
        args.names = [n.strip() for n in args.names.split(",")]

    return args


def remove_background(img):
    """Remove background using rembg AI model (lazy import)."""
    global _rembg_remove
    if _rembg_remove is None:
        try:
            from rembg import remove
            _rembg_remove = remove
        except ImportError:
            print("ERROR: rembg not installed. Run: pip install rembg")
            print("       Or use --no-rembg to skip background removal.")
            sys.exit(1)
    print("  Removing background...")
    return _rembg_remove(img)


def auto_trim(img):
    """Trim transparent padding to content bounding box."""
    arr = np.array(img)
    alpha = arr[:, :, 3] if arr.shape[2] == 4 else np.ones(arr.shape[:2], dtype=np.uint8) * 255

    # Find rows and columns with content
    row_has_content = np.any(alpha > 10, axis=1)
    col_has_content = np.any(alpha > 10, axis=0)

    rows = np.where(row_has_content)[0]
    cols = np.where(col_has_content)[0]

    if len(rows) == 0 or len(cols) == 0:
        print("  WARNING: No opaque pixels found after trim — skipping")
        return None

    y_start, y_end = rows[0], rows[-1] + 1
    x_start, x_end = cols[0], cols[-1] + 1

    trimmed = img.crop((x_start, y_start, x_end, y_end))
    print(f"  Auto-trimming... {img.width}x{img.height} -> {trimmed.width}x{trimmed.height}")
    return trimmed


def add_padding(img, padding):
    """Add transparent padding around the image."""
    new_w = img.width + 2 * padding
    new_h = img.height + 2 * padding
    canvas = Image.new("RGBA", (new_w, new_h), (0, 0, 0, 0))
    canvas.paste(img, (padding, padding))
    print(f"  Adding {padding}px padding... {img.width}x{img.height} -> {new_w}x{new_h}")
    return canvas


def resize_to_target(img, target):
    """Resize to fit within target x target using NEAREST, centered on transparent canvas."""
    ratio = min(target / img.width, target / img.height)
    new_w = max(1, int(img.width * ratio))
    new_h = max(1, int(img.height * ratio))

    resized = img.resize((new_w, new_h), Image.NEAREST)

    canvas = Image.new("RGBA", (target, target), (0, 0, 0, 0))
    offset_x = (target - new_w) // 2
    offset_y = (target - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y))
    print(f"  Resizing to {target}x{target} (NEAREST)")
    return canvas


def split_spritesheet(img, cols, rows):
    """Split a spritesheet into individual sprites by grid."""
    frame_w = img.width // cols
    frame_h = img.height // rows
    print(f"  Splitting spritesheet: {cols}x{rows} grid ({frame_w}x{frame_h} per frame)")

    sprites = []
    for row in range(rows):
        for col in range(cols):
            x = col * frame_w
            y = row * frame_h
            sprite = img.crop((x, y, x + frame_w, y + frame_h))
            sprites.append(sprite)

    return sprites


def generate_output_name(input_path, index, total, names, prefix):
    """Generate output filename for a sprite."""
    if names and index < len(names):
        return names[index] + ".png"
    stem = Path(input_path).stem
    if prefix:
        stem = prefix
    if total == 1:
        return stem + ".png"
    return f"{stem}_{index}.png"


def process_single(img, args):
    """Run the processing pipeline on a single sprite."""
    if not args.no_rembg:
        img = remove_background(img)

    if not args.no_trim:
        trimmed = auto_trim(img)
        if trimmed is None:
            return None
        img = trimmed

    if args.padding > 0:
        img = add_padding(img, args.padding)

    img = resize_to_target(img, args.size)
    return img


def main():
    args = parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(script_dir, "..", "public", "assets", args.output)
    os.makedirs(out_dir, exist_ok=True)

    # Parse split dimensions
    split_cols, split_rows = 0, 0
    if args.split:
        parts = args.split.split("x")
        split_cols, split_rows = int(parts[0]), int(parts[1])

    # Validate names count
    total_sprites = 0
    valid_inputs = []
    for path in args.inputs:
        if not os.path.exists(path):
            print(f"WARNING: File not found, skipping: {path}")
            continue
        valid_inputs.append(path)
        if args.split:
            total_sprites += split_cols * split_rows
        else:
            total_sprites += 1

    if args.names and len(args.names) != total_sprites:
        print(f"ERROR: --names has {len(args.names)} entries but expected {total_sprites} sprites")
        sys.exit(1)

    if not valid_inputs:
        print("ERROR: No valid input files found")
        sys.exit(1)

    saved_count = 0
    sprite_index = 0

    for file_num, input_path in enumerate(valid_inputs, 1):
        print(f"\nProcessing {input_path} ({file_num}/{len(valid_inputs)})...")
        try:
            img = Image.open(input_path).convert("RGBA")
            print(f"  Image size: {img.width}x{img.height}")

            if args.split:
                sprites = split_spritesheet(img, split_cols, split_rows)
            else:
                sprites = [img]

            for i, sprite in enumerate(sprites):
                label = f"[{i + 1}/{len(sprites)}] " if len(sprites) > 1 else ""

                if len(sprites) > 1:
                    print(f"  {label}Processing sprite...")

                result = process_single(sprite, args)
                if result is None:
                    print(f"  {label}Skipped (empty after processing)")
                    sprite_index += 1
                    continue

                out_name = generate_output_name(
                    input_path, sprite_index, total_sprites, args.names, args.prefix,
                )
                out_path = os.path.join(out_dir, out_name)
                result.save(out_path)
                print(f"  {label}Saved: {out_path}")
                saved_count += 1
                sprite_index += 1

        except Exception as e:
            print(f"  ERROR processing {input_path}: {e}")
            if args.split:
                sprite_index += split_cols * split_rows
            else:
                sprite_index += 1

    print(f"\nDone! {saved_count} asset(s) saved to {out_dir}")


if __name__ == "__main__":
    main()

"""
Automated avatar sprite preparation for CuttleQuest.
Takes the 3-cuttlefish reference image and outputs:
  - Individual PNGs with transparent backgrounds
  - Grayscale "base" versions for color tinting
  - Eyes removed (transparent) so canvas can draw animated eyes

Usage:
  python scripts/prep_avatars.py <path_to_cuttlefish_image>

Output goes to public/assets/avatars/
"""

import sys
import os
from PIL import Image
import numpy as np

try:
    from rembg import remove
except ImportError:
    print("ERROR: rembg not installed. Run: pip install rembg")
    sys.exit(1)


def remove_background(img):
    """Remove blue ocean background using rembg AI."""
    print("  Removing background...")
    result = remove(img)
    return result


def split_into_three(img):
    """Split image into 3 cuttlefish using column density analysis."""
    print("  Splitting into 3 sprites...")
    arr = np.array(img)
    alpha = arr[:, :, 3] if arr.shape[2] == 4 else np.ones(arr.shape[:2], dtype=np.uint8) * 255

    # Count non-transparent pixels per column (density, not just any)
    col_density = np.sum(alpha > 30, axis=0).astype(float)

    # Smooth the density curve to find clear valleys between sprites
    kernel_size = 20
    kernel = np.ones(kernel_size) / kernel_size
    smoothed = np.convolve(col_density, kernel, mode='same')

    # Find the two deepest valleys — these are the splits between the 3 sprites
    # Only look in the middle 80% of the image (avoid edges)
    margin = int(len(smoothed) * 0.1)
    search_area = smoothed[margin:-margin]

    # Find all local minima
    minima = []
    for x in range(1, len(search_area) - 1):
        if search_area[x] <= search_area[x - 1] and search_area[x] <= search_area[x + 1]:
            minima.append((search_area[x], x + margin))

    # Sort by density (lowest = best split point)
    minima.sort(key=lambda m: m[0])

    # Pick the two best valleys that are far enough apart (at least 15% of image width)
    min_separation = int(len(smoothed) * 0.15)
    split_points = []
    for density, x_pos in minima:
        if all(abs(x_pos - sp) >= min_separation for sp in split_points):
            split_points.append(x_pos)
        if len(split_points) == 2:
            break

    if len(split_points) < 2:
        # Fallback: split evenly into thirds
        print("  WARNING: Could not find 2 clear valleys. Splitting evenly into thirds.")
        w = img.width // 3
        split_points = [w, w * 2]

    split_points.sort()

    print(f"    Split points at x={split_points[0]}, x={split_points[1]}")

    # Define the 3 regions
    regions = [
        (0, split_points[0]),
        (split_points[0], split_points[1]),
        (split_points[1], img.width),
    ]

    sprites = []
    names = ["hatchling", "juvenile", "adult"]
    for i, (x_start, x_end) in enumerate(regions):
        # Find actual content bounds within this region
        region_alpha = alpha[:, x_start:x_end]
        col_has_content = np.any(region_alpha > 30, axis=1)
        rows = np.where(col_has_content)[0]
        if len(rows) == 0:
            continue
        y_start, y_end = rows[0], rows[-1] + 1

        # Find horizontal content bounds within region
        row_content = np.any(region_alpha > 30, axis=0)
        cols = np.where(row_content)[0]
        if len(cols) == 0:
            continue
        actual_x_start = x_start + cols[0]
        actual_x_end = x_start + cols[-1] + 1

        # Add small padding
        pad = 5
        actual_x_start = max(0, actual_x_start - pad)
        actual_x_end = min(img.width, actual_x_end + pad)
        y_start = max(0, y_start - pad)
        y_end = min(img.height, y_end + pad)

        sprite = img.crop((actual_x_start, y_start, actual_x_end, y_end))
        sprites.append((names[i], sprite))
        print(f"    {names[i]}: {sprite.width}x{sprite.height} from x={actual_x_start}-{actual_x_end}")

    return sprites


def remove_eyes(img, name):
    """Remove eyes by finding circular bright regions (sclera/iris) in the upper body."""
    print(f"  Removing eyes from {name}...")
    arr = np.array(img).copy()
    h, w = arr.shape[:2]

    # Eyes are in the upper-left area of the sprite
    eye_top = int(h * 0.05)
    eye_bot = int(h * 0.65)
    eye_left = 0
    eye_right = int(w * 0.65)

    # Max eye size relative to sprite (a single eye can't be more than ~8% of sprite area)
    max_eye_pixels = int(h * w * 0.08)
    # Min eye size (must be at least a few pixels to count)
    min_eye_pixels = 8

    # Find seed pixels based on life stage
    seeds = []
    for y in range(eye_top, eye_bot):
        for x in range(eye_left, eye_right):
            r, g, b, a = arr[y, x]
            if a < 50:
                continue

            if name == "hatchling":
                # Hatchling has large dark eyes with blue iris and white sparkle
                # Seed on strongly blue-dominant pixels only (high blue, low red/green)
                is_strong_blue = b > 150 and b > r * 1.5 and b > g * 1.3
                is_highlight = r > 240 and g > 240 and b > 240
                if is_strong_blue or is_highlight:
                    seeds.append((y, x))
            else:
                # Juvenile + Adult have yellow-green iris with dark pupil
                # Pure white/near-white sclera only
                if r > 220 and g > 220 and b > 220:
                    seeds.append((y, x))
                # Bright saturated yellow-green iris center
                elif r > 170 and g > 170 and b < 40:
                    seeds.append((y, x))

    # Flood fill from seeds, but only expand to eye-like pixels
    visited = set()
    eye_regions = []

    for sy, sx in seeds:
        if (sy, sx) in visited:
            continue
        stack = [(sy, sx)]
        region = []
        while stack and len(region) < max_eye_pixels:
            py, px = stack.pop()
            if (py, px) in visited:
                continue
            if py < 0 or py >= h or px < 0 or px >= w:
                continue
            visited.add((py, px))
            r, g, b, a = arr[py, px]
            if a < 30:
                continue

            is_eye = False
            if name == "hatchling":
                # Strong blue iris (much bluer than body)
                if b > 130 and b > r * 1.3 and b > g * 1.1:
                    is_eye = True
                # Black pupil
                elif r < 50 and g < 50 and b < 70 and a > 150:
                    is_eye = True
                # White highlight/sparkle
                elif r > 220 and g > 220 and b > 220:
                    is_eye = True
            else:
                # White/light sclera
                if r > 200 and g > 200 and b > 200:
                    is_eye = True
                # Yellow-green iris
                elif r > 140 and g > 140 and b < 60:
                    is_eye = True
                # Black/dark pupil
                elif r < 50 and g < 50 and b < 50 and a > 150:
                    is_eye = True
                # Light gray (eye edge)
                elif r > 180 and g > 180 and b > 170 and max(r,g,b) - min(r,g,b) < 30:
                    is_eye = True

            if not is_eye:
                continue

            region.append((py, px))
            for dy in [-1, 0, 1]:
                for dx in [-1, 0, 1]:
                    if dy == 0 and dx == 0:
                        continue
                    stack.append((py + dy, px + dx))

        if min_eye_pixels <= len(region) <= max_eye_pixels:
            # Check compactness — eyes are roughly circular, not sprawling
            # A circle has compactness ~1.0, sprawling blobs are much lower
            ys = [p[0] for p in region]
            xs = [p[1] for p in region]
            bbox_w = max(xs) - min(xs) + 1
            bbox_h = max(ys) - min(ys) + 1
            bbox_area = bbox_w * bbox_h
            fill_ratio = len(region) / bbox_area if bbox_area > 0 else 0
            aspect = max(bbox_w, bbox_h) / max(min(bbox_w, bbox_h), 1)

            # Eyes should be roughly round: fill > 30% and not too elongated
            if fill_ratio > 0.3 and aspect < 3.0:
                eye_regions.append(region)
            else:
                print(f"    Skipped non-eye blob: {len(region)}px, fill={fill_ratio:.2f}, aspect={aspect:.1f}")

    # Keep only the 2 largest regions (one per eye)
    if len(eye_regions) > 2:
        eye_regions.sort(key=lambda r: len(r), reverse=True)
        eye_regions = eye_regions[:2]
        print(f"    Kept top 2 largest eye regions")

    # Erase eye pixels with 1px dilation
    eye_mask = set()
    for region in eye_regions:
        for y, x in region:
            for dy in range(-1, 2):
                for dx in range(-1, 2):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w:
                        eye_mask.add((ny, nx))

    for y, x in eye_mask:
        arr[y, x] = [0, 0, 0, 0]

    print(f"    Found {len(eye_regions)} eye region(s), removed {len(eye_mask)} pixels")
    return Image.fromarray(arr)


def make_grayscale(img):
    """Convert to grayscale while preserving alpha and luminosity detail."""
    print("  Creating grayscale base...")
    arr = np.array(img).copy()
    gray = (0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]).astype(np.uint8)
    arr[:, :, 0] = gray
    arr[:, :, 1] = gray
    arr[:, :, 2] = gray
    return Image.fromarray(arr)


def resize_to_target(img, target=300):
    """Resize to fit within target x target, maintaining aspect ratio. Uses NEAREST for pixel art."""
    ratio = min(target / img.width, target / img.height)
    new_w = int(img.width * ratio)
    new_h = int(img.height * ratio)

    resized = img.resize((new_w, new_h), Image.NEAREST)

    # Center on a target x target transparent canvas
    canvas = Image.new("RGBA", (target, target), (0, 0, 0, 0))
    offset_x = (target - new_w) // 2
    offset_y = (target - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y))
    return canvas


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/prep_avatars.py <path_to_image>")
        print("Example: python scripts/prep_avatars.py cuttlefish_reference.png")
        sys.exit(1)

    input_path = sys.argv[1]
    if not os.path.exists(input_path):
        print(f"ERROR: File not found: {input_path}")
        sys.exit(1)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "avatars")
    os.makedirs(out_dir, exist_ok=True)

    print(f"Loading {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    print(f"  Image size: {img.width}x{img.height}")

    # Step 1: Remove background
    img_nobg = remove_background(img)

    # Step 2: Split into 3 sprites
    sprites = split_into_three(img_nobg)

    for name, sprite in sprites:
        print(f"\nProcessing {name}...")

        # Step 3: Remove eyes
        eyeless = remove_eyes(sprite, name)

        # Step 4: Resize to 300x300
        sized = resize_to_target(eyeless, 300)
        sized_with_eyes = resize_to_target(sprite, 300)

        # Step 5: Create grayscale base
        grayscale = make_grayscale(sized)

        # Save outputs
        sized_with_eyes.save(os.path.join(out_dir, f"{name}.png"))
        sized.save(os.path.join(out_dir, f"{name}-eyeless.png"))
        grayscale.save(os.path.join(out_dir, f"{name}-base.png"))
        print(f"  Saved: {name}.png, {name}-eyeless.png, {name}-base.png")

    print(f"\nDone! Output in: {out_dir}")
    print("\nFiles created:")
    print("  *-base.png     — Grayscale, no eyes (for tinting + canvas eyes)")
    print("  *-eyeless.png  — Color, no eyes (default/fallback)")
    print("  *.png           — Original with eyes (reference)")


if __name__ == "__main__":
    main()

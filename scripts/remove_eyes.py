"""
Remove eyes from cuttlefish sprites using flood-fill + inpainting.
Eye positions are manually defined per stage. Outputs eyeless and grayscale versions.

Usage: python scripts/remove_eyes.py
"""

import numpy as np
from PIL import Image
from collections import deque
import os

AVATAR_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'avatars')

# Eye definitions: seed points (x,y) and color-matching thresholds
# Each eye has seeds (pixels known to be inside the eye) and a bounding box for search area
STAGES = {
    'hatchling': {
        'eyes': [
            {
                # Large blue eye on the right side
                'bbox': (120, 100, 210, 190),  # x1, y1, x2, y2 search area
                'seeds': [(165, 145), (160, 140), (170, 150), (155, 145), (175, 145)],
                'is_eye_color': lambda r, g, b, a: (
                    a > 200 and (
                        # Blue iris pixels
                        (b > 120 and b > r and b > g * 0.8) or
                        # Dark pupil pixels
                        (r < 60 and g < 60 and b < 80) or
                        # White/light reflection pixels
                        (r > 200 and g > 200 and b > 200) or
                        # Pale blue highlight
                        (b > 150 and g > 150 and r < 180 and b >= r)
                    )
                ),
                'expand': 2,  # pixels to expand mask outward
            }
        ]
    },
    'juvenile': {
        'eyes': [
            {
                # Yellow-green eye
                'bbox': (80, 65, 160, 145),
                'seeds': [(115, 105), (110, 100), (120, 110), (115, 95), (115, 115),
                          (108, 105), (122, 105), (115, 108), (112, 98)],
                'is_eye_color': lambda r, g, b, a: (
                    a > 200 and (
                        # Yellow-green iris
                        (g > 100 and g > b * 1.2 and r > 60) or
                        # Dark pupil
                        (r < 60 and g < 60 and b < 60) or
                        # White sclera / highlights
                        (r > 180 and g > 180 and b > 150) or
                        # Cyan/teal residue
                        (b > 100 and g > 100 and r < 120 and b > r) or
                        # Dark outline around eye
                        (r < 80 and g < 80 and b < 70 and a > 220)
                    )
                ),
                'expand': 3,
            }
        ]
    },
    'adult': {
        'eyes': [
            {
                # Yellow-green eye
                'bbox': (60, 70, 140, 150),
                'seeds': [(95, 110), (90, 105), (100, 115), (95, 100), (95, 120)],
                'is_eye_color': lambda r, g, b, a: (
                    a > 200 and (
                        # Yellow-green iris
                        (g > 100 and g > b and r > 60) or
                        # Dark pupil
                        (r < 50 and g < 50 and b < 50) or
                        # White/light highlights
                        (r > 190 and g > 190 and b > 160) or
                        # Dark outline
                        (r < 80 and g < 80 and b < 60 and a > 230)
                    )
                ),
                'expand': 2,
            }
        ]
    },
}


def flood_fill_eye(pixels, eye_def, img_w, img_h):
    """Flood fill from seeds to find eye pixels within bbox."""
    x1, y1, x2, y2 = eye_def['bbox']
    is_eye = eye_def['is_eye_color']
    mask = np.zeros((img_h, img_w), dtype=bool)
    visited = set()
    queue = deque()

    for sx, sy in eye_def['seeds']:
        if x1 <= sx < x2 and y1 <= sy < y2:
            queue.append((sx, sy))
            visited.add((sx, sy))

    while queue:
        x, y = queue.popleft()
        r, g, b, a = pixels[y, x]

        if is_eye(int(r), int(g), int(b), int(a)):
            mask[y, x] = True
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, -1), (-1, 1), (1, 1)]:
                nx, ny = x + dx, y + dy
                if x1 <= nx < x2 and y1 <= ny < y2 and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))

    return mask


def expand_mask(mask, pixels, expand=2):
    """Expand mask outward by N pixels, only into non-transparent areas."""
    h, w = mask.shape
    expanded = mask.copy()
    for _ in range(expand):
        new = expanded.copy()
        for y in range(h):
            for x in range(w):
                if not expanded[y, x]:
                    continue
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not expanded[ny, nx]:
                        if pixels[ny, nx, 3] > 128:  # only expand into opaque areas
                            new[ny, nx] = True
        expanded = new
    return expanded


def inpaint_mask(pixels, mask, iterations=20):
    """Fill masked pixels using inverse-distance-weighted interpolation from border pixels."""
    result = pixels.copy()
    h, w = mask.shape

    # Find border pixels (unmasked pixels adjacent to masked pixels)
    border = []
    for y in range(h):
        for x in range(w):
            if mask[y, x]:
                continue
            if pixels[y, x, 3] < 128:
                continue
            # Check if adjacent to any masked pixel
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and mask[ny, nx]:
                    border.append((x, y, pixels[y, x].astype(np.float64)))
                    break

    if not border:
        return result

    # For each masked pixel, compute weighted average of border pixels
    # Weight = 1 / distance^2 (inverse distance weighting)
    border_arr = np.array([(bx, by) for bx, by, _ in border], dtype=np.float64)
    border_colors = np.array([bc for _, _, bc in border], dtype=np.float64)

    masked_ys, masked_xs = np.where(mask)
    for i in range(len(masked_xs)):
        mx, my = masked_xs[i], masked_ys[i]
        dx = border_arr[:, 0] - mx
        dy = border_arr[:, 1] - my
        dist_sq = dx * dx + dy * dy
        dist_sq = np.maximum(dist_sq, 0.5)  # avoid division by zero
        weights = 1.0 / (dist_sq ** 1.5)  # sharper falloff for pixel art
        weights /= weights.sum()
        color = (border_colors * weights[:, np.newaxis]).sum(axis=0)
        result[my, mx] = np.clip(color, 0, 255).astype(np.uint8)

    return result


def process_stage(stage, config):
    """Process a single stage sprite."""
    input_path = os.path.join(AVATAR_DIR, f'{stage}.png')
    if not os.path.exists(input_path):
        print(f'  Skipping {stage}: {input_path} not found')
        return

    img = Image.open(input_path).convert('RGBA')
    pixels = np.array(img)
    h, w = pixels.shape[:2]

    # Build combined eye mask
    combined_mask = np.zeros((h, w), dtype=bool)
    for eye_def in config['eyes']:
        eye_mask = flood_fill_eye(pixels, eye_def, w, h)
        pixel_count = eye_mask.sum()
        print(f'  Eye flood fill: {pixel_count} pixels')

        if pixel_count < 10:
            print(f'  WARNING: Very few pixels found, seeds may be misaligned')
            # Debug: print colors at seed points
            for sx, sy in eye_def['seeds']:
                if 0 <= sx < w and 0 <= sy < h:
                    print(f'    Seed ({sx},{sy}): RGBA = {pixels[sy, sx]}')
            continue

        expanded = expand_mask(eye_mask, pixels, eye_def.get('expand', 2))
        print(f'  After expansion: {expanded.sum()} pixels')
        combined_mask |= expanded

    total = combined_mask.sum()
    print(f'  Total eye pixels to remove: {total}')

    if total == 0:
        print(f'  No eye pixels found for {stage}, skipping')
        return

    # Inpaint
    result_pixels = inpaint_mask(pixels, combined_mask)

    # Save eyeless version (color)
    eyeless = Image.fromarray(result_pixels)
    eyeless_path = os.path.join(AVATAR_DIR, f'{stage}-eyeless.png')
    eyeless.save(eyeless_path)
    print(f'  Saved {eyeless_path}')

    # Save grayscale base version
    gray = eyeless.convert('L').convert('RGBA')
    # Preserve original alpha
    gray_pixels = np.array(gray)
    gray_pixels[:, :, 3] = result_pixels[:, :, 3]
    base = Image.fromarray(gray_pixels)
    base_path = os.path.join(AVATAR_DIR, f'{stage}-base.png')
    base.save(base_path)
    print(f'  Saved {base_path}')


def main():
    print('=== Eye Removal Script ===')
    for stage, config in STAGES.items():
        print(f'\nProcessing {stage}...')
        process_stage(stage, config)
    print('\nDone!')


if __name__ == '__main__':
    main()

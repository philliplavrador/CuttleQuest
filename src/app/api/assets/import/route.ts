import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'asset-library.json');
const INBOX_DIR = path.join(process.cwd(), 'assets_inbox');
const PREVIEW_DIR = path.join(process.cwd(), 'public', 'assets', 'preview', 'inbox');

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(db: Record<string, unknown>) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// POST - scan assets_inbox/, copy images to public, add to library as "new"
export async function POST() {
  if (!fs.existsSync(INBOX_DIR)) {
    return NextResponse.json({ error: 'assets_inbox/ not found' }, { status: 404 });
  }

  // Ensure preview/inbox dir exists
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });

  const files = fs.readdirSync(INBOX_DIR);
  const images = files.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return IMAGE_EXTS.includes(ext) && !f.startsWith('.');
  });

  if (images.length === 0) {
    return NextResponse.json({ imported: 0, message: 'No images found in assets_inbox/' });
  }

  const db = readDB();
  const imported: string[] = [];

  for (const filename of images) {
    const src = path.join(INBOX_DIR, filename);
    const dest = path.join(PREVIEW_DIR, filename);

    // Skip if already imported (same filename exists in preview/inbox)
    const existingAsset = db.assets.find(
      (a: { files: string[] }) => a.files.includes(`/assets/preview/inbox/${filename}`)
    );
    if (existingAsset) continue;

    // Copy file to public/assets/preview/inbox/
    fs.copyFileSync(src, dest);

    // Generate ID from filename
    const baseName = path.basename(filename, path.extname(filename));
    const id = `inbox-${baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    // Pretty name from filename
    const prettyName = baseName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    db.assets.push({
      id,
      name: prettyName,
      status: 'new',
      files: [`/assets/preview/inbox/${filename}`],
      thumbnail: `/assets/preview/inbox/${filename}`,
      createdAt: new Date().toISOString().split('T')[0],
    });

    imported.push(filename);
  }

  if (imported.length > 0) {
    writeDB(db);
  }

  return NextResponse.json({ imported: imported.length, files: imported });
}

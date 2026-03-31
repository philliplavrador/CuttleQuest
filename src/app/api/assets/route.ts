import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'asset-library.json');

interface Slot {
  id: string;
  label: string;
  category: 'avatar-8d' | 'swim-sw';
  stage: 'egg' | 'hatchling' | 'juvenile' | 'adult';
  assignedAssetId: string | null;
}

interface Asset {
  id: string;
  name: string;
  status: 'active' | 'new' | 'storage';
  files: string[];
  thumbnail: string;
  createdAt: string;
}

interface AssetDB {
  slots: Slot[];
  assets: Asset[];
}

function readDB(): AssetDB {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(db: AssetDB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// GET - return all assets and slots
export async function GET() {
  const db = readDB();
  return NextResponse.json(db);
}

// PUT - update asset status OR assign asset to slot
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = readDB();

  // Assign asset to slot
  if (body.slotId !== undefined) {
    const slot = db.slots.find((s) => s.id === body.slotId);
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Unassign: set to null
    if (body.assetId === null) {
      // Move the previously assigned asset back to storage
      if (slot.assignedAssetId) {
        const prev = db.assets.find((a) => a.id === slot.assignedAssetId);
        if (prev) prev.status = 'storage';
      }
      slot.assignedAssetId = null;
      writeDB(db);
      return NextResponse.json({ ok: true, slot });
    }

    // Assign: validate asset exists
    const asset = db.assets.find((a) => a.id === body.assetId);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Unassign from any other slot first
    for (const s of db.slots) {
      if (s.assignedAssetId === body.assetId) {
        s.assignedAssetId = null;
      }
    }

    // Move previous occupant back to storage
    if (slot.assignedAssetId) {
      const prev = db.assets.find((a) => a.id === slot.assignedAssetId);
      if (prev) prev.status = 'storage';
    }

    slot.assignedAssetId = body.assetId;
    asset.status = 'active';
    writeDB(db);
    return NextResponse.json({ ok: true, slot, asset });
  }

  // Move asset between statuses (new/storage)
  const { id, status } = body;
  if (!id || !['new', 'storage'].includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
  }
  const asset = db.assets.find((a) => a.id === id);
  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  // If moving away from active, unassign from slot
  if (asset.status === 'active') {
    for (const s of db.slots) {
      if (s.assignedAssetId === id) {
        s.assignedAssetId = null;
      }
    }
  }

  asset.status = status;
  writeDB(db);
  return NextResponse.json({ ok: true, asset });
}

// DELETE - permanently delete asset and its files
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const db = readDB();
  const idx = db.assets.findIndex((a) => a.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
  const asset = db.assets[idx];

  // Unassign from any slot
  for (const s of db.slots) {
    if (s.assignedAssetId === id) {
      s.assignedAssetId = null;
    }
  }

  // Delete files from public/
  for (const filePath of asset.files) {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    try {
      fs.unlinkSync(fullPath);
    } catch {
      // File may already be gone
    }
  }
  db.assets.splice(idx, 1);
  writeDB(db);
  return NextResponse.json({ ok: true, deleted: asset.id });
}

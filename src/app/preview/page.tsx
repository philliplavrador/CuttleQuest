'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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

const CATEGORY_META: Record<string, { label: string; color: string; description: string }> = {
  'avatar-8d': { label: '8-Direction Avatars', color: 'cyan', description: '8-directional sprite GIFs for each life stage' },
  'swim-sw': { label: 'SW Swimming', color: 'violet', description: 'South-west swimming animation GIFs' },
};

const STAGES = ['egg', 'hatchling', 'juvenile', 'adult'] as const;

function AssetCard({
  asset,
  selected,
  onClick,
  onDelete,
}: {
  asset: Asset;
  selected?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/asset-id', asset.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
        selected
          ? 'border-yellow-400/60 bg-yellow-500/10 ring-2 ring-yellow-400/40'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
      } ${onClick ? 'cursor-pointer' : 'cursor-grab'}`}
    >
      {onDelete && (
        <div className="absolute top-1 right-1 z-10">
          {!confirmDelete ? (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              className="w-5 h-5 rounded text-white/30 hover:text-red-400 hover:bg-white/10 text-[10px] flex items-center justify-center"
            >
              x
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }}
              className="px-1.5 py-0.5 rounded text-[9px] text-red-300 bg-red-500/20 hover:bg-red-500/30 font-bold"
            >
              Delete?
            </button>
          )}
        </div>
      )}

      <div className="w-20 h-20 flex items-center justify-center">
        <img
          src={asset.thumbnail}
          alt={asset.name}
          className="w-full h-full object-contain pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <div className="text-center">
        <div className="text-[10px] text-white/60 font-mono leading-tight">{asset.name}</div>
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  asset,
  isTarget,
  onClick,
  onUnassign,
  onDrop,
}: {
  slot: Slot;
  asset: Asset | null;
  isTarget: boolean;
  onClick: () => void;
  onUnassign: () => void;
  onDrop: (assetId: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const meta = CATEGORY_META[slot.category];
  const colorClass = meta.color === 'cyan' ? 'border-cyan-500/40 text-cyan-300' : 'border-violet-500/40 text-violet-300';
  const bgClass = meta.color === 'cyan' ? 'bg-cyan-500/5' : 'bg-violet-500/5';

  return (
    <div
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const assetId = e.dataTransfer.getData('application/asset-id');
        if (assetId) onDrop(assetId);
      }}
      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${colorClass} ${bgClass} ${
        dragOver
          ? 'ring-2 ring-yellow-400/60 bg-yellow-500/10 scale-105'
          : isTarget ? 'ring-2 ring-yellow-400/60 bg-yellow-500/5' : ''
      }`}
    >
      {asset ? (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onUnassign(); }}
            className="absolute top-1 right-1 w-5 h-5 rounded text-white/30 hover:text-red-400 hover:bg-white/10 text-[10px] flex items-center justify-center"
          >
            x
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src={asset.thumbnail}
              alt={asset.name}
              className="w-full h-full object-contain pointer-events-none"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="text-[10px] text-white/50 font-mono leading-tight text-center truncate w-full">
            {asset.name}
          </div>
        </>
      ) : (
        <>
          <div className={`w-16 h-16 flex items-center justify-center border-2 border-dashed rounded-lg transition-colors ${
            dragOver ? 'border-yellow-400/40' : 'border-white/10'
          }`}>
            <span className={`text-lg transition-colors ${dragOver ? 'text-yellow-400/40' : 'text-white/15'}`}>
              {dragOver ? '+' : '?'}
            </span>
          </div>
          <div className="text-[10px] text-white/25 italic">{dragOver ? 'drop here' : 'empty'}</div>
        </>
      )}
      <div className={`text-[9px] uppercase tracking-wider font-mono ${colorClass}`}>
        {slot.label}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/assets');
    const data = await res.json();
    setSlots(data.slots);
    setAssets(data.assets);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleImport = async () => {
    setImporting(true);
    setImportMsg(null);
    const res = await fetch('/api/assets/import', { method: 'POST' });
    const data = await res.json();
    if (data.imported > 0) {
      setImportMsg(`Imported ${data.imported} asset${data.imported !== 1 ? 's' : ''}`);
      fetchData();
    } else {
      setImportMsg('No new images in assets_inbox/');
    }
    setImporting(false);
    setTimeout(() => setImportMsg(null), 3000);
  };

  const handleAssign = async (slotId: string, assetId: string) => {
    await fetch('/api/assets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, assetId }),
    });
    setAssignTarget(null);
    fetchData();
  };

  const handleUnassign = async (slotId: string) => {
    await fetch('/api/assets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, assetId: null }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/assets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchData();
  };

  const unassignedAssets = assets.filter((a) => a.status !== 'active');
  const categories = Object.keys(CATEGORY_META);

  const filledCount = slots.filter((s) => s.assignedAssetId).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0d1b2a] to-[#1a0a2e] text-white p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-xl font-pixel text-center mb-0.5 text-cyan-300">Asset Library</h1>
        <p className="text-center text-white/30 text-[10px] font-mono">
          {filledCount}/{slots.length} slots filled &middot; drag GIFs onto slots to assign
        </p>
      </div>

      {loading ? (
        <div className="text-center text-white/30 py-20">Loading...</div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Slot Table */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            {/* Stage column headers */}
            <div className="grid grid-cols-[120px_repeat(4,1fr)] border-b border-white/5">
              <div />
              {STAGES.map((stage) => (
                <div key={stage} className="py-2 text-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{stage}</span>
                </div>
              ))}
            </div>

            {/* Category rows */}
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat];
              const catSlots = slots.filter((s) => s.category === cat);
              if (catSlots.length === 0) return null;
              const isCyan = meta.color === 'cyan';

              return (
                <div key={cat} className="grid grid-cols-[120px_repeat(4,1fr)] border-b border-white/5 last:border-b-0">
                  {/* Row label */}
                  <div className="flex flex-col justify-center px-3 py-3">
                    <span className={`text-[10px] font-mono uppercase tracking-wider leading-tight ${
                      isCyan ? 'text-cyan-400/70' : 'text-violet-400/70'
                    }`}>
                      {meta.label}
                    </span>
                    <span className="text-[8px] text-white/20 mt-0.5 leading-tight">{meta.description}</span>
                  </div>

                  {/* Stage cells */}
                  {STAGES.map((stage) => {
                    const slot = catSlots.find((s) => s.stage === stage);
                    if (!slot) return <div key={stage} className="p-2 flex items-center justify-center"><span className="text-white/5 text-[9px]">--</span></div>;
                    const assigned = slot.assignedAssetId
                      ? assets.find((a) => a.id === slot.assignedAssetId) || null
                      : null;
                    return (
                      <div key={slot.id} className="p-2">
                        <SlotCard
                          slot={slot}
                          asset={assigned}
                          isTarget={assignTarget === slot.id}
                          onClick={() => {
                            if (assignTarget === slot.id) setAssignTarget(null);
                            else setAssignTarget(slot.id);
                          }}
                          onUnassign={() => handleUnassign(slot.id)}
                          onDrop={(assetId) => handleAssign(slot.id, assetId)}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Assign prompt */}
          {assignTarget && (
            <div className="mt-4 text-center text-xs text-yellow-300/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg py-2 px-4">
              Select a GIF from the bank below to assign, or{' '}
              <button onClick={() => setAssignTarget(null)} className="underline hover:text-yellow-200">cancel</button>
            </div>
          )}

          {/* GIF Bank */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-white/40">
                GIF Bank <span className="text-white/20">({unassignedAssets.length})</span>
              </h2>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all disabled:opacity-50"
              >
                {importing ? 'Scanning...' : 'Import from assets_inbox/'}
              </button>
            </div>
            {importMsg && (
              <div className="text-xs text-violet-300/70 mb-3">{importMsg}</div>
            )}

            {unassignedAssets.length === 0 ? (
              <div className="text-center text-white/15 py-8 text-[10px] font-mono">
                No GIFs in bank. Import from assets_inbox/ to get started.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {unassignedAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    selected={false}
                    onClick={assignTarget ? () => handleAssign(assignTarget, asset.id) : undefined}
                    onDelete={!assignTarget ? handleDelete : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

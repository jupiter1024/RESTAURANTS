import React, { useState } from 'react';
import type { Branch, DeliveryDistanceTier } from '../db/types';
import { simpleDb } from '../db/simpleDb';
import { MapLocationPicker } from './MapLocationPicker';

interface BranchManagerProps {
  restaurantId: string;
  branches: Branch[];
  onBranchesUpdated: () => void;
}

const DEFAULT_DISTANCE_TIERS: Array<{ minKm: number; maxKm: number; fee: number }> = [
  { minKm: 0, maxKm: 5, fee: 20 },
  { minKm: 5, maxKm: 10, fee: 35 },
  { minKm: 10, maxKm: 20, fee: 50 },
  { minKm: 20, maxKm: 30, fee: 75 },
];

export const BranchManager: React.FC<BranchManagerProps> = ({
  restaurantId,
  branches,
  onBranchesUpdated,
}) => {
  const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('Main Branch');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState(30.0444);
  const [longitude, setLongitude] = useState(31.2357);
  const [isActive, setIsActive] = useState(true);

  // Distance Brackets (Tiers)
  const [tiers, setTiers] = useState<Array<{ id?: string; minKm: number; maxKm: number; fee: number }>>(
    DEFAULT_DISTANCE_TIERS
  );

  const openCreateModal = () => {
    setEditingBranch({ id: undefined });
    setName(branches.length === 0 ? 'Main Branch' : `Branch #${branches.length + 1}`);
    setAddress('');
    setPhone('');
    setLatitude(30.0444);
    setLongitude(31.2357);
    setIsActive(true);
    setTiers([...DEFAULT_DISTANCE_TIERS]);
    setError(null);
    setSuccess(null);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setName(branch.name || 'Main Branch');
    setAddress(branch.address || '');
    setPhone(branch.phone || '');
    setLatitude(branch.latitude || 30.0444);
    setLongitude(branch.longitude || 31.2357);
    setIsActive(branch.isActive !== false);

    if (branch.tiers && branch.tiers.length > 0) {
      setTiers(
        branch.tiers.map((t: DeliveryDistanceTier) => ({
          id: t.id,
          minKm: t.minKm,
          maxKm: t.maxKm,
          fee: t.fee,
        }))
      );
    } else {
      setTiers([...DEFAULT_DISTANCE_TIERS]);
    }

    setError(null);
    setSuccess(null);
  };

  const closeModal = () => {
    setEditingBranch(null);
    setError(null);
  };

  // Distance Tiers Helpers
  const handleTierChange = (index: number, field: 'minKm' | 'maxKm' | 'fee', value: number) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: Math.max(0, value) };
    setTiers(updated);
  };

  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? lastTier.maxKm : 0;
    const newMax = newMin + 10;
    const newFee = lastTier ? lastTier.fee + 25 : 25;
    setTiers([...tiers, { minKm: newMin, maxKm: newMax, fee: newFee }]);
  };

  const handleRemoveTier = (index: number) => {
    if (tiers.length <= 1) {
      setError('You must have at least one delivery distance range.');
      return;
    }
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchName = name.trim() || 'Main Branch';

    setLoading(true);
    setError(null);

    // Calculate max radius from the highest tier
    const maxRadius = tiers.length > 0 ? Math.max(...tiers.map((t) => t.maxKm)) : 30;
    const baseFee = tiers.length > 0 ? tiers[0].fee : 20;

    try {
      await simpleDb.saveBranch(restaurantId, {
        id: editingBranch?.id,
        name: branchName,
        address: address.trim(),
        phone: phone.trim(),
        latitude: Number(latitude) || 30.0444,
        longitude: Number(longitude) || 31.2357,
        deliveryMode: 'radius',
        maxDeliveryRadiusKm: maxRadius,
        baseDeliveryFee: baseFee,
        baseDeliveryDistanceKm: tiers[0]?.maxKm || 5,
        extraFeePerKm: 0,
        isActive,
        zones: [],
        tiers,
      });

      setSuccess('Branch saved successfully!');
      setTimeout(() => {
        closeModal();
        onBranchesUpdated();
      }, 400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    setLoading(true);
    try {
      await simpleDb.deleteBranch(restaurantId, branchId);
      onBranchesUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🏢</span> Branch Locations & Delivery Ranges
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Pin your branch on Google Maps and set delivery fees for each distance range (e.g. 0 to 5 km = 20 EGP, 5 to 10 km = 35 EGP, 10 to 20 km = 50 EGP, 20 to 30 km = 75 EGP).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer"
        >
          <span>➕</span> Add New Branch
        </button>
      </div>

      {/* Branch Cards */}
      {branches.length === 0 ? (
        <div className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">📍</div>
          <h3 className="text-lg font-semibold text-white">No Branches Added Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Click below to add your branch location on the map and configure delivery distance pricing.
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>➕</span> Add First Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`bg-slate-900/70 border rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between transition-all ${
                b.isActive !== false ? 'border-slate-800 hover:border-slate-700' : 'border-red-900/50 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {b.name}
                      {b.isActive === false && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                          Inactive
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <span>📍</span> {b.address || 'Location on map'}
                    </p>
                    {b.phone && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>📞</span> {b.phone}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                    🗺️ Map & Distance
                  </span>
                </div>

                {/* Delivery Pricing Summary */}
                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 my-3 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-300 mb-1">🛵 Distance Delivery Pricing:</div>
                  <div className="space-y-1">
                    {(b.tiers && b.tiers.length > 0 ? b.tiers : DEFAULT_DISTANCE_TIERS).map((t, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span className="text-slate-400">• {t.minKm} to {t.maxKm} km</span>
                        <span className="font-bold text-emerald-400">{t.fee} EGP</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => openEditModal(b)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  ✏️ Edit Location & Fees
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-900/50 text-xs transition-colors cursor-pointer"
                  title="Delete Branch"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{editingBranch.id ? '✏️ Edit Branch' : '🏢 Add New Branch'}</span>
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-xs">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300 text-xs">
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Branch Basics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    1. Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Main Branch, Maadi Outlet"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    2. Branch Phone / WhatsApp (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  3. Address / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15 Road 9, Maadi, Cairo"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Interactive Searchable Map Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                  📍 4. Search Address or Move Pin on Map
                </label>
                <MapLocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  onChange={(lat, lng, addr) => {
                    setLatitude(lat);
                    setLongitude(lng);
                    if (addr && !address) {
                      setAddress(addr);
                    }
                  }}
                  height="260px"
                />
              </div>

              {/* DISTANCE TIERS TABLE */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                      🛵 5. Distance Range Delivery Fees
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Set delivery fees for each distance range from this branch.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    + Add Range
                  </button>
                </div>

                {/* Tiers List */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-400 px-2">
                    <span className="col-span-4">From Distance (km)</span>
                    <span className="col-span-4">To Distance (km)</span>
                    <span className="col-span-3">Delivery Fee (EGP)</span>
                    <span className="col-span-1 text-center">Delete</span>
                  </div>

                  {tiers.map((t, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-900/90 p-2.5 rounded-xl border border-slate-800"
                    >
                      <div className="col-span-4 flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">From</span>
                        <input
                          type="number"
                          min="0"
                          value={t.minKm}
                          onChange={(e) => handleTierChange(idx, 'minKm', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                        />
                        <span className="text-xs text-slate-400">km</span>
                      </div>

                      <div className="col-span-4 flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">To</span>
                        <input
                          type="number"
                          min="1"
                          value={t.maxKm}
                          onChange={(e) => handleTierChange(idx, 'maxKm', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                        />
                        <span className="text-xs text-slate-400">km</span>
                      </div>

                      <div className="col-span-3 flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={t.fee}
                          onChange={(e) => handleTierChange(idx, 'fee', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-orange-500 font-mono"
                        />
                        <span className="text-xs text-slate-400">EGP</span>
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(idx)}
                          className="text-red-400 hover:text-red-300 p-1 text-xs cursor-pointer"
                          title="Delete Range"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 pt-1">
                  ℹ️ Customers located beyond {tiers.length > 0 ? Math.max(...tiers.map((t) => t.maxKm)) : 30} km will be informed they are outside delivery range.
                </p>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveBranch"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-700 text-orange-500 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="isActiveBranch" className="text-xs text-slate-300 cursor-pointer">
                  Active & accepting orders
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

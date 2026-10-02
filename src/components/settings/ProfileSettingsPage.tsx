import {RiderShowcase} from './RiderShowcase';
import { CloudAccountSettings } from '../auth/CloudAccountSettings';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SetupData, WheelMaterial, DeckShape, DeckMold, ObstacleType } from '../../domain/types';
import { Modal } from '../common/Modal';
import { Plus, Trash2, Instagram, AlertCircle, ExternalLink } from 'lucide-react';

const DECK_WIDTH_PRESETS = [26, 29, 31, 32, 33, 33.6, 34, 36];

export const ProfileSettingsPage: React.FC = () => {
  const { profile, updateProfile: saveProfile, showToast } = useApp();

  const updateProfile = (value: Parameters<typeof saveProfile>[0]) => saveProfile(value).catch(error => showToast(error instanceof Error ? error.message : 'Could not save profile.'));

  const [editingSetup, setEditingSetup] = useState<SetupData | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Setup form states
  const [setupForm, setSetupForm] = useState<{
    id?: string;
    name: string;
    widthPreset: string;
    customWidth: string;
    wheelMaterial: WheelMaterial;
    deckModel: string;
    truckModel: string;
    wheelModel: string;
    shape: DeckShape;
    mold: DeckMold;
    notes: string;
  }>({
    name: '',
    widthPreset: '33.6',
    customWidth: '',
    wheelMaterial: 'urethane',
    deckModel: '', truckModel: '', wheelModel: '',
    shape: 'popsicle',
    mold: 'medium',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  if (!profile) return null;

  const handleNameChange = (name: string) => {
    updateProfile({ ...profile, displayName: name });
  };

  const handleInstagramChange = (handle: string) => {
    updateProfile({ ...profile, instagramHandle: handle.trim() });
  };

  const cleanInstagramHandle = (handle?: string) => {
    if (!handle) return '';
    return handle.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').replace(/\/$/, '');
  };

  const instagramUser = cleanInstagramHandle(profile.instagramHandle);

  // Handle available obstacles toggle
  const handleToggleObstacle = (obs: ObstacleType) => {
    const current = profile.availableObstacles;
    let next: ObstacleType[];
    if (current.includes(obs)) {
      if (current.length === 1) {
        showToast('At least one obstacle must remain available.');
        return;
      }
      next = current.filter((o) => o !== obs);
    } else {
      next = [...current, obs];
    }
    updateProfile({ ...profile, availableObstacles: next });
  };

  // Open setup modal
  const handleOpenSetupModal = (setupToEdit?: SetupData) => {
    setFormError(null);
    if (setupToEdit) {
      setEditingSetup(setupToEdit);
      const isPreset = DECK_WIDTH_PRESETS.includes(setupToEdit.deckWidthMm);
      setSetupForm({
        id: setupToEdit.id,
        name: setupToEdit.name,
        widthPreset: isPreset ? setupToEdit.deckWidthMm.toString() : 'custom',
        customWidth: isPreset ? '' : setupToEdit.deckWidthMm.toString(),
        wheelMaterial: setupToEdit.wheelMaterial,
        deckModel: setupToEdit.deckModel || '', truckModel: setupToEdit.truckModel || '', wheelModel: setupToEdit.wheelModel || '',
        shape: setupToEdit.shape || 'popsicle',
        mold: setupToEdit.mold || 'medium',
        notes: setupToEdit.notes || '',
      });
    } else {
      setEditingSetup(null);
      setSetupForm({
        name: 'New Custom Fingerboard',
        widthPreset: '33.6',
        customWidth: '',
        wheelMaterial: 'urethane',
        deckModel: '', truckModel: '', wheelModel: '',
        shape: 'popsicle',
        mold: 'medium',
        notes: '',
      });
    }
    setIsSetupModalOpen(true);
  };

  const handleSaveSetup = () => {
    if (!setupForm.name.trim()) {
      setFormError('Please enter a name for the setup.');
      return;
    }

    let deckWidth = 33.6;
    let isCustom = false;

    if (setupForm.widthPreset === 'custom') {
      const val = parseFloat(setupForm.customWidth);
      if (isNaN(val) || val <= 0 || val > 100) {
        setFormError('Custom deck width must be a valid positive number in millimeters (e.g. 33.3).');
        return;
      }
      deckWidth = val;
      isCustom = true;
    } else {
      deckWidth = parseFloat(setupForm.widthPreset);
    }

    const newSetup: SetupData = {
      ...(editingSetup || {}),
      deckModel: setupForm.deckModel.trim(), truckModel: setupForm.truckModel.trim(), wheelModel: setupForm.wheelModel.trim(),
      id: editingSetup?.id || `setup_${Date.now()}`,
      name: setupForm.name.trim(),
      deckWidthMm: deckWidth,
      isCustomDeckWidth: isCustom,
      wheelMaterial: setupForm.wheelMaterial,
      shape: setupForm.shape,
      mold: setupForm.mold,
      difficultyRating: editingSetup?.difficultyRating || 3,
      notes: setupForm.notes.trim(),
    };

    let updatedSetups: SetupData[];
    if (editingSetup) {
      updatedSetups = profile.savedSetups.map((s) => (s.id === editingSetup.id ? newSetup : s));
    } else {
      updatedSetups = [...profile.savedSetups, newSetup];
    }

    const defaultId = profile.defaultSetupId || (updatedSetups.length > 0 ? updatedSetups[0].id : undefined);
    updateProfile({ ...profile, savedSetups: updatedSetups, defaultSetupId: defaultId });
    setIsSetupModalOpen(false);
    showToast(`Setup "${newSetup.name}" saved.`);
  };

  const handleDeleteSetup = (setupId: string) => {
    const updated = profile.savedSetups.filter((s) => s.id !== setupId);
    let newDefault = profile.defaultSetupId;
    if (newDefault === setupId) {
      newDefault = updated[0]?.id;
    }

    updateProfile({ ...profile, savedSetups: updated, defaultSetupId: newDefault });
    showToast('Setup removed.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <RiderShowcase />
      {/* Rider Profile & Instagram Link */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Rider Profile
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Personalize your skater name and connect your Instagram profile.
            </p>
          </div>

          {/* Instagram link badge */}
          {instagramUser && (
            <a
              href={`https://instagram.com/${instagramUser}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-xs font-medium transition-colors border border-neutral-200 dark:border-neutral-700 cursor-pointer"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              <span>@{instagramUser}</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Rider Display Name
            </label>
            <input
              type="text"
              defaultValue={profile.displayName}
              onBlur={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Dark Slide Rider"
              className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-1.5 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Instagram Handle or URL
            </label>
            <div className="relative">
              <input
                type="text"
                defaultValue={profile.instagramHandle || ''}
                onBlur={(e) => handleInstagramChange(e.target.value)}
                placeholder="@username or profile link"
                className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-1.5 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white pl-8"
              />
              <Instagram className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Setups Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Hardware Setups ({profile.savedSetups.length})
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Manage your fingerboard decks, shapes, molds, and wheel configurations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenSetupModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Setup
          </button>
        </div>

        {profile.savedSetups.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              No hardware setups saved yet.
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Add your fingerboard decks, trucks, and wheels to track tricks per setup.
            </p>
            <button
              type="button"
              onClick={() => handleOpenSetupModal()}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Your First Setup
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.savedSetups.map((setup) => {
              const isDefault = profile.defaultSetupId === setup.id;

              return (
                <div
                  key={setup.id}
                  className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {setup.name}
                      </span>
                      {isDefault && (
                        <span className="text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-600 dark:text-neutral-400 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-neutral-900 dark:text-neutral-200 font-semibold">
                        {setup.deckWidthMm}mm
                      </span>
                      <span>·</span>
                      <span className="capitalize">{setup.wheelMaterial} wheels</span>
                      {setup.shape && (
                        <>
                          <span>·</span>
                          <span className="capitalize font-mono">{setup.shape} shape</span>
                        </>
                      )}
                      {setup.mold && (
                        <>
                          <span>·</span>
                          <span className="capitalize font-mono">{setup.mold} mold</span>
                        </>
                      )}
                    </div>
                    {(setup.deckModel || setup.truckModel || setup.wheelModel) && <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                      {[setup.deckModel && `Deck: ${setup.deckModel}`,setup.truckModel && `Trucks: ${setup.truckModel}`,setup.wheelModel && `Wheels: ${setup.wheelModel}`].filter(Boolean).join(' · ')}
                    </p>}
                    {setup.notes && (
                      <div className="text-[11px] text-neutral-500 italic">
                        "{setup.notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => updateProfile({ ...profile, defaultSetupId: setup.id })}
                        className="px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenSetupModal(setup)}
                      className="px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSetup(setup.id)}
                      title="Delete setup"
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Obstacles in Spot */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Available Obstacles in Your Lab
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Uncheck obstacles you do not own to keep generation realistic to your physical spot.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { id: 'flatground', label: 'Flatground Desk' },
              { id: 'ledge', label: 'Ledge / Box' },
              { id: 'rail', label: 'Round Rail' },
              { id: 'manual_pad', label: 'Manual Pad' },
            ] as const
          ).map((item) => {
            const isSelected = profile.availableObstacles.includes(item.id);
            return (
              <label
                key={item.id}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 text-xs font-medium cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleObstacle(item.id)}
                  className="rounded text-neutral-900 focus:ring-0"
                />
                <span className="text-neutral-900 dark:text-white">{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <CloudAccountSettings />

      {/* Setup Modal */}
      <Modal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        title={editingSetup ? 'Edit Hardware Setup' : 'Add New Hardware Setup'}
      >
        <div className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Setup Name
            </label>
            <input
              type="text"
              value={setupForm.name}
              onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
              placeholder="e.g. Berlinwood 33.6mm Deep Concave"
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Deck Width (mm)
              </label>
              <select
                value={setupForm.widthPreset}
                onChange={(e) => setSetupForm({ ...setupForm, widthPreset: e.target.value })}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                {DECK_WIDTH_PRESETS.map((w) => (
                  <option key={w} value={w}>
                    {w}mm Preset
                  </option>
                ))}
                <option value="custom">Custom Width</option>
              </select>
            </div>

            {setupForm.widthPreset === 'custom' && (
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Custom Width (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="100"
                  value={setupForm.customWidth}
                  onChange={(e) => setSetupForm({ ...setupForm, customWidth: e.target.value })}
                  placeholder="e.g. 33.3"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            {([
              ['deckModel','Deck brand / model','e.g. FlatFace G16'],
              ['truckModel','Truck brand / model','e.g. Dynamic 34mm'],
              ['wheelModel','Wheel brand / model','e.g. Piro Performance'],
            ] as const).map(([key,label,placeholder]) => <label key={key} className="block">
              <span className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">{label} (optional)</span>
              <input type="text" aria-label={label} value={setupForm[key]} maxLength={100} placeholder={placeholder}
                onChange={e => setSetupForm({...setupForm,[key]:e.target.value})}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white" />
            </label>)}
          </div>

          {/* Shape & Mold Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Deck Shape
              </label>
              <select
                value={setupForm.shape}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, shape: e.target.value as DeckShape })
                }
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                <option value="popsicle">Popsicle (Standard)</option>
                <option value="boxy">Boxy / Street</option>
                <option value="cruiser">Cruiser Profile</option>
                <option value="egg">Egg Shape</option>
                <option value="old_school">Old School Retro</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Deck Mold
              </label>
              <select
                value={setupForm.mold}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, mold: e.target.value as DeckMold })
                }
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
              >
                <option value="medium">Medium Concave / Medium Kicks</option>
                <option value="low">Low Concave / Low Kicks</option>
                <option value="high">High Concave / Steep Kicks</option>
                <option value="flat">Flat / Mellow</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Wheel Material
            </label>
            <select
              value={setupForm.wheelMaterial}
              onChange={(e) =>
                setSetupForm({ ...setupForm, wheelMaterial: e.target.value as WheelMaterial })
              }
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white"
            >
              <option value="plastic">Plastic (Hard / Slick)</option>
              <option value="urethane">Urethane (Grippy / Squeak)</option>
              <option value="resin">Resin (Durable / Smooth)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Setup Notes / Specifications
            </label>
            <textarea
              value={setupForm.notes}
              onChange={(e) => setSetupForm({ ...setupForm, notes: e.target.value })}
              placeholder="Truck type, bushings, tuning, grip..."
              rows={2}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2.5 py-1.5 text-neutral-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsSetupModalOpen(false)}
              className="px-3.5 py-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveSetup}
              className="px-4 py-2 font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 rounded-md transition-colors shadow-xs"
            >
              Save Setup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

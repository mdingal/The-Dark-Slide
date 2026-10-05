import {RiderOnboarding} from '../auth/RiderOnboarding';
import {riderSetupAnswers,RIDER_DETAIL_LABELS} from '../../domain/riderSetup';
import {HardwareManager,HW_BUTTON} from './HardwareManager';
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

  const [editingDetails,setEditingDetails]=useState(false);
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


  if(editingDetails)return <RiderOnboarding editing onExit={()=>setEditingDetails(false)}/>;

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

      <section className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3"><h2 className="text-lg font-semibold">Rider Details</h2>{Object.entries(riderSetupAnswers(profile.onboarding?.answers,profile.savedSetups)).map(([k,v])=><p key={k} className="text-sm"><span className="capitalize text-neutral-500">{RIDER_DETAIL_LABELS[k]||k.replace(/([A-Z])/g,' $1')}: </span>{Array.isArray(v)?v.join(', '):v||'Skipped'}</p>)}<button className={HW_BUTTON} onClick={()=>setEditingDetails(true)}>Update rider details</button></section>
      <HardwareManager />
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


    </div>
  );
};

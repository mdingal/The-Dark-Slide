import { IStorageService } from './storageInterface';
import { PracticeSession, UserProfile } from '../domain/types';
import { INITIAL_PROFILES, INITIAL_SESSIONS_ALEX } from './seedData';

const PROFILES_KEY = 'fb_app_profiles_v1';
const ACTIVE_PROFILE_ID_KEY = 'fb_app_active_profile_id_v1';

function getSessionStorageKey(profileId: string): string {
  return `fb_app_sessions_v1_${profileId}`;
}

export class LocalStorageService implements IStorageService {
  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    try {
      const storedProfiles = localStorage.getItem(PROFILES_KEY);
      if (!storedProfiles) {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(INITIAL_PROFILES));
        localStorage.setItem(ACTIVE_PROFILE_ID_KEY, INITIAL_PROFILES[0].id);
        localStorage.setItem(
          getSessionStorageKey(INITIAL_PROFILES[0].id),
          JSON.stringify(INITIAL_SESSIONS_ALEX)
        );
      }
    } catch (e) {
      console.warn('LocalStorage error during initialization:', e);
    }
  }

  async getProfiles(): Promise<UserProfile[]> {
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (!raw) return INITIAL_PROFILES;
      return JSON.parse(raw);
    } catch {
      return INITIAL_PROFILES;
    }
  }

  async getActiveProfile(): Promise<UserProfile> {
    const profiles = await this.getProfiles();
    const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
    const matched = profiles.find((p) => p.id === activeId);
    return matched || profiles[0] || INITIAL_PROFILES[0];
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const profiles = await this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }

  async switchProfile(profileId: string): Promise<UserProfile> {
    const profiles = await this.getProfiles();
    const found = profiles.find((p) => p.id === profileId);
    if (!found) {
      throw new Error(`Profile ${profileId} not found`);
    }
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
    return found;
  }

  async getSessions(profileId: string): Promise<PracticeSession[]> {
    try {
      const key = getSessionStorageKey(profileId);
      const raw = localStorage.getItem(key);
      if (!raw) {
        if (profileId === 'profile_alex') {
          return INITIAL_SESSIONS_ALEX;
        }
        return [];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async saveSession(profileId: string, session: PracticeSession): Promise<void> {
    const sessions = await this.getSessions(profileId);
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    const key = getSessionStorageKey(profileId);
    localStorage.setItem(key, JSON.stringify(sessions));
  }

  async deleteSession(profileId: string, sessionId: string): Promise<void> {
    const sessions = await this.getSessions(profileId);
    const filtered = sessions.filter((s) => s.id !== sessionId);
    const key = getSessionStorageKey(profileId);
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  async resetToDemoSeed(profileId: string): Promise<void> {
    const key = getSessionStorageKey(profileId);
    if (profileId === 'profile_alex') {
      localStorage.setItem(key, JSON.stringify(INITIAL_SESSIONS_ALEX));
    } else {
      localStorage.setItem(key, JSON.stringify([]));
    }
  }
}

export const storageService = new LocalStorageService();

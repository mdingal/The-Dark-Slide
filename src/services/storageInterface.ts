import { PracticeSession, UserProfile } from '../domain/types';

export interface IStorageService {
  getProfiles(): Promise<UserProfile[]>;
  getActiveProfile(): Promise<UserProfile>;
  saveProfile(profile: UserProfile): Promise<void>;
  switchProfile(profileId: string): Promise<UserProfile>;
  getSessions(profileId: string): Promise<PracticeSession[]>;
  saveSession(profileId: string, session: PracticeSession): Promise<void>;
  deleteSession(profileId: string, sessionId: string): Promise<void>;
  resetToDemoSeed(profileId: string): Promise<void>;
}

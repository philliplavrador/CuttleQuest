'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  PlayerProfile,
  createDefaultProfile,
  createTestProfile,
  loadProfileFromLocal,
  saveProfileToLocal,
  completeScene,
  mergeProfiles,
} from '@/lib/playerProfile';
import { getIsMockMode, initFirebase, getFirebaseAuth, getFirebaseDb, getGoogleProvider } from '@/lib/firebase';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ProfileContextType {
  profile: PlayerProfile;
  isMockMode: boolean;
  isLoading: boolean;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  handleSceneComplete: (sceneId: string, stars: number) => PlayerProfile;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  enterTestMode: () => void;
  resetProgress: () => void;
  addCosmetic: (cosmeticId: string) => void;
  equipCosmetic: (type: 'color' | 'pattern' | 'fin' | 'mantle', id: string | null) => void;
  markFactCardShown: (cardId: string) => void;
  unlockCodexEntry: (entryId: string) => void;
  markCodexViewed: (entryId: string) => void;
  incrementAttempt: (sceneId: string) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfileFromLocal() || createDefaultProfile());
  const [isMock, setIsMock] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Firebase and check mock mode
  useEffect(() => {
    initFirebase();
    setIsMock(getIsMockMode());
    setIsLoading(false);

    // Listen for Firebase auth changes if not mock mode
    const auth = getFirebaseAuth();
    if (auth) {
      const unsub = onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          await loadCloudProfile(user);
        }
      });
      return () => unsub();
    }
  }, []);

  // Save to localStorage on profile changes
  useEffect(() => {
    if (!isLoading) {
      saveProfileToLocal(profile);
      syncToCloud(profile);
    }
  }, [profile, isLoading]);

  async function loadCloudProfile(user: User) {
    const db = getFirebaseDb();
    if (!db) return;

    const docRef = doc(db, 'players', user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const cloudProfile = snap.data() as PlayerProfile;
      const localProfile = loadProfileFromLocal();

      if (localProfile && localProfile.isGuest && localProfile.completedScenes.length > 0) {
        // Guest has progress - ask user (handled by UI component)
        // For now, merge keeping guest progress
        const merged = mergeProfiles(localProfile, cloudProfile, 'keepGuest');
        setProfile(merged);
      } else {
        setProfile({
          ...cloudProfile,
          displayName: user.displayName || cloudProfile.displayName,
          photoURL: user.photoURL || cloudProfile.photoURL,
        });
      }
    } else {
      // No cloud profile - upload current
      const updated = {
        ...profile,
        uid: user.uid,
        isGuest: false,
        displayName: user.displayName || 'Player',
        photoURL: user.photoURL,
      };
      setProfile(updated);
      await setDoc(docRef, updated);
    }
  }

  async function syncToCloud(p: PlayerProfile) {
    if (p.isGuest || getIsMockMode()) return;
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await setDoc(doc(db, 'players', p.uid), p);
    } catch {
      // Silent fail - will sync next time
    }
  }

  const updateProfile = useCallback((updates: Partial<PlayerProfile>) => {
    setProfile(prev => ({ ...prev, ...updates, lastActive: Date.now() }));
  }, []);

  const handleSceneComplete = useCallback((sceneId: string, stars: number): PlayerProfile => {
    const updated = completeScene(profile, sceneId, stars);
    setProfile(updated);
    return updated;
  }, [profile]);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = getGoogleProvider();
    if (!auth || !provider) return;
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Sign-in failed:', err);
    }
  }, []);

  const signOutFn = useCallback(() => {
    const auth = getFirebaseAuth();
    if (auth) {
      auth.signOut();
    }
    const newProfile = createDefaultProfile();
    setProfile(newProfile);
    saveProfileToLocal(newProfile);
  }, []);

  const enterTestMode = useCallback(() => {
    const testProfile = createTestProfile();
    setProfile(testProfile);
    saveProfileToLocal(testProfile);
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = createDefaultProfile();
    setProfile(fresh);
    saveProfileToLocal(fresh);
  }, []);

  const addCosmetic = useCallback((cosmeticId: string) => {
    setProfile(prev => {
      if (prev.unlockedCosmetics.includes(cosmeticId)) return prev;
      return {
        ...prev,
        unlockedCosmetics: [...prev.unlockedCosmetics, cosmeticId],
        cosmeticsUnlocked: prev.unlockedCosmetics.length + 1,
        lastActive: Date.now(),
      };
    });
  }, []);

  const equipCosmetic = useCallback((type: 'color' | 'pattern' | 'fin' | 'mantle', id: string | null) => {
    setProfile(prev => ({
      ...prev,
      equippedCosmetics: { ...prev.equippedCosmetics, [type]: id },
      lastActive: Date.now(),
    }));
  }, []);

  const markFactCardShown = useCallback((cardId: string) => {
    setProfile(prev => {
      if (prev.shownFactCards.includes(cardId)) return prev;
      return {
        ...prev,
        shownFactCards: [...prev.shownFactCards, cardId],
        lastActive: Date.now(),
      };
    });
  }, []);

  const unlockCodexEntry = useCallback((entryId: string) => {
    setProfile(prev => {
      if (prev.unlockedCodexEntries.includes(entryId)) return prev;
      return {
        ...prev,
        unlockedCodexEntries: [...prev.unlockedCodexEntries, entryId],
        lastActive: Date.now(),
      };
    });
  }, []);

  const markCodexViewed = useCallback((entryId: string) => {
    setProfile(prev => {
      if (prev.viewedCodexEntries.includes(entryId)) return prev;
      return {
        ...prev,
        viewedCodexEntries: [...prev.viewedCodexEntries, entryId],
        lastActive: Date.now(),
      };
    });
  }, []);

  const incrementAttempt = useCallback((sceneId: string) => {
    setProfile(prev => ({
      ...prev,
      attemptCounts: {
        ...prev.attemptCounts,
        [sceneId]: (prev.attemptCounts[sceneId] || 0) + 1,
      },
      lastActive: Date.now(),
    }));
  }, []);

  return (
    <ProfileContext.Provider value={{
      profile,
      isMockMode: isMock,
      isLoading,
      updateProfile,
      handleSceneComplete,
      signInWithGoogle,
      signOut: signOutFn,
      enterTestMode,
      resetProgress,
      addCosmetic,
      equipCosmetic,
      markFactCardShown,
      unlockCodexEntry,
      markCodexViewed,
      incrementAttempt,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextType {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}

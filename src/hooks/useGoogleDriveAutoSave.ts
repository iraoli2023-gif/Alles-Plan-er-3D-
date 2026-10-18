import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GoogleDriveUser, 
  DriveFileInfo, 
  initGoogleDriveAuth, 
  signInWithGoogleDrive, 
  signOutGoogleDrive, 
  saveProjectToGoogleDrive, 
  listDriveProjectFiles, 
  loadProjectFromGoogleDrive, 
  deleteProjectFromGoogleDrive,
  getGoogleAccessToken
} from '../utils/googleDrive';
import { ProjectState } from '../utils/projectAutoSave';
import { soundSynth } from '../utils/audioSynth';

const GDRIVE_AUTO_SYNC_KEY = 'voltcad_gdrive_autosave_enabled';
const GDRIVE_LAST_SYNCED_KEY = 'voltcad_gdrive_last_synced';

interface UseGoogleDriveAutoSaveProps {
  projectState: ProjectState;
  onRestoreState: (state: ProjectState) => void;
}

export function useGoogleDriveAutoSave({
  projectState,
  onRestoreState,
}: UseGoogleDriveAutoSaveProps) {
  const [user, setUser] = useState<GoogleDriveUser | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GDRIVE_AUTO_SYNC_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(GDRIVE_LAST_SYNCED_KEY);
    } catch {
      return null;
    }
  });
  const [lastSyncedFileUrl, setLastSyncedFileUrl] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentStateRef = useRef<ProjectState>(projectState);
  currentStateRef.current = projectState;

  const previousFingerprintRef = useRef<string>('');
  const isInitialMountRef = useRef<boolean>(true);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initGoogleDriveAuth((authUser, authenticatedWithToken) => {
      setUser(authUser);
      setHasToken(authenticatedWithToken);
      if (authenticatedWithToken) {
        refreshFiles();
      }
    });

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const refreshFiles = useCallback(async () => {
    if (!getGoogleAccessToken()) return;
    try {
      const files = await listDriveProjectFiles();
      setDriveFiles(files);
      if (files.length > 0 && files[0].webViewLink) {
        setLastSyncedFileUrl(files[0].webViewLink);
      }
    } catch (err) {
      console.warn('Could not refresh drive files:', err);
    }
  }, []);

  const toggleAutoSync = useCallback((enabled?: boolean) => {
    const next = typeof enabled === 'boolean' ? enabled : !autoSyncEnabled;
    setAutoSyncEnabled(next);
    try {
      localStorage.setItem(GDRIVE_AUTO_SYNC_KEY, next ? 'true' : 'false');
    } catch {}
  }, [autoSyncEnabled]);

  // Sign in with Google Popup
  const login = useCallback(async () => {
    try {
      setSyncError(null);
      const result = await signInWithGoogleDrive();
      setUser(result.user);
      setHasToken(true);
      soundSynth.playConfirmation();
      
      // Load existing drive files
      const files = await listDriveProjectFiles();
      setDriveFiles(files);

      // Perform initial save after login
      setIsSyncing(true);
      const saveRes = await saveProjectToGoogleDrive(
        currentStateRef.current,
        'Erste Synchronisation nach Google Drive Anmeldung'
      );
      const formatted = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(formatted);
      if (saveRes.webViewLink) setLastSyncedFileUrl(saveRes.webViewLink);
      try {
        localStorage.setItem(GDRIVE_LAST_SYNCED_KEY, formatted);
      } catch {}
      await refreshFiles();
    } catch (err: any) {
      setSyncError(err.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setIsSyncing(false);
    }
  }, [refreshFiles]);

  // Sign out
  const logout = useCallback(async () => {
    try {
      await signOutGoogleDrive();
      setUser(null);
      setHasToken(false);
      setDriveFiles([]);
      soundSynth.playClick();
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  }, []);

  // Manual sync
  const syncNow = useCallback(async (description = 'Manuelle Google Drive Sicherung') => {
    if (!getGoogleAccessToken()) {
      await login();
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);
      const res = await saveProjectToGoogleDrive(currentStateRef.current, description);
      const formatted = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(formatted);
      if (res.webViewLink) setLastSyncedFileUrl(res.webViewLink);
      try {
        localStorage.setItem(GDRIVE_LAST_SYNCED_KEY, formatted);
      } catch {}
      soundSynth.playConfirmation();
      await refreshFiles();
    } catch (err: any) {
      setSyncError(err.message || 'Fehler beim Speichern in Google Drive');
    } finally {
      setIsSyncing(false);
    }
  }, [login, refreshFiles]);

  // Restore snapshot from Google Drive
  const restoreFromDrive = useCallback(async (fileId: string) => {
    try {
      setIsSyncing(true);
      const state = await loadProjectFromGoogleDrive(fileId);
      onRestoreState(state);
      soundSynth.playWelcome();
    } catch (err: any) {
      setSyncError(err.message || 'Wiederherstellung aus Google Drive fehlgeschlagen');
    } finally {
      setIsSyncing(false);
    }
  }, [onRestoreState]);

  // Delete file from Google Drive with confirmation dialog
  const deleteDriveFile = useCallback(async (fileId: string, fileName: string) => {
    const confirmed = window.confirm(
      `Möchtest du die Datei "${fileName}" wirklich unwiderruflich aus deinem Google Drive löschen?`
    );
    if (!confirmed) return;

    try {
      await deleteProjectFromGoogleDrive(fileId);
      await refreshFiles();
      soundSynth.playClick();
    } catch (err: any) {
      setSyncError(err.message || 'Löschen fehlgeschlagen');
    }
  }, [refreshFiles]);

  // Fingerprint calculation for project state
  const computeFingerprint = useCallback((state: ProjectState): string => {
    return JSON.stringify({
      fCount: state.furniture?.length,
      eCount: state.electrical?.length,
      wCount: state.wiring?.length,
      cCount: state.circuits?.length,
      roomDims: `${state.room?.width}x${state.room?.length}x${state.room?.height}`,
      roomsCount: state.rooms?.length,
    });
  }, []);

  // Automatic debounced sync on projectState changes
  useEffect(() => {
    const currentFp = computeFingerprint(projectState);

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousFingerprintRef.current = currentFp;
      return;
    }

    if (currentFp === previousFingerprintRef.current) {
      return;
    }

    previousFingerprintRef.current = currentFp;

    // Only auto-sync if user is signed in, has token and auto-sync is on
    if (!user || !hasToken || !autoSyncEnabled) {
      return;
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // 2500ms debounce to prevent excessive Drive API calls while editing
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        setSyncError(null);
        const res = await saveProjectToGoogleDrive(
          currentStateRef.current,
          'Automatisches Cloud-Backup bei Planungsänderung'
        );
        const formatted = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        setLastSyncedTime(formatted);
        if (res.webViewLink) setLastSyncedFileUrl(res.webViewLink);
        try {
          localStorage.setItem(GDRIVE_LAST_SYNCED_KEY, formatted);
        } catch {}
      } catch (err: any) {
        console.warn('Auto-save to Google Drive error:', err);
        setSyncError(err.message || 'Fehler beim automatischen Speichern in Drive');
      } finally {
        setIsSyncing(false);
      }
    }, 2500);
  }, [projectState, user, hasToken, autoSyncEnabled, computeFingerprint]);

  return {
    user,
    hasToken,
    isSignedIn: !!user && hasToken,
    isSyncing,
    autoSyncEnabled,
    toggleAutoSync,
    lastSyncedTime,
    lastSyncedFileUrl,
    driveFiles,
    syncError,
    login,
    logout,
    syncNow,
    restoreFromDrive,
    deleteDriveFile,
    refreshFiles,
  };
}

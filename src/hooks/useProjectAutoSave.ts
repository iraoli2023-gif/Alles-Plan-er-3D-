import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ProjectState, 
  ProjectSnapshot, 
  CrashInfo, 
  AutoSaveTrigger,
  saveProjectSnapshot, 
  getLatestSnapshot, 
  getBackupHistory, 
  checkCrashRecovery, 
  clearCrashMarker, 
  initSessionTracking,
  isAutoSaveEnabled,
  setAutoSaveEnabled as setAutoSaveEnabledStorage,
  deleteSnapshotFromHistory,
  clearAllSnapshots,
  simulateCrash as simulateCrashStorage
} from '../utils/projectAutoSave';
import { soundSynth } from '../utils/audioSynth';

interface UseProjectAutoSaveProps {
  projectState: ProjectState;
  onRestoreState: (state: ProjectState) => void;
  activeView: string;
}

export function useProjectAutoSave({
  projectState,
  onRestoreState,
  activeView,
}: UseProjectAutoSaveProps) {
  const [autoSaveEnabled, setAutoSaveEnabledState] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<ProjectSnapshot | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveCount, setSaveCount] = useState<number>(0);
  const [history, setHistory] = useState<ProjectSnapshot[]>([]);
  const [crashInfo, setCrashInfo] = useState<CrashInfo | null>(null);

  // References to track previous state fingerprints and avoid redundant saves
  const isInitializedRef = useRef<boolean>(false);
  const previousFingerprintRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentStateRef = useRef<ProjectState>(projectState);
  currentStateRef.current = projectState;

  // Sync autoSaveEnabled from storage on mount
  useEffect(() => {
    setAutoSaveEnabledState(isAutoSaveEnabled());
    const latest = getLatestSnapshot();
    if (latest) {
      setLastSaved(latest);
    }
    setHistory(getBackupHistory());

    // Check for crash recovery BEFORE initializing the new session to inspect previous session cleanExit
    const detectedCrash = checkCrashRecovery();
    if (detectedCrash.wasCrash && detectedCrash.backup) {
      setCrashInfo(detectedCrash);
    }

    // Initialize session heartbeat and crash listeners for the active session
    const cleanupSession = initSessionTracking();

    return () => {
      cleanupSession();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const toggleAutoSave = useCallback((enabled?: boolean) => {
    const next = typeof enabled === 'boolean' ? enabled : !autoSaveEnabled;
    setAutoSaveEnabledStorage(next);
    setAutoSaveEnabledState(next);
  }, [autoSaveEnabled]);

  // Compute a lightweight state fingerprint for change detection
  const computeFingerprint = useCallback((state: ProjectState): string => {
    return JSON.stringify({
      furniture: (state.furniture || []).map(f => `${f.id}:${f.position.x.toFixed(2)},${f.position.y.toFixed(2)},${f.position.z.toFixed(2)}:${f.rotation}:${f.dimensions.width}x${f.dimensions.depth}`),
      electrical: (state.electrical || []).map(e => `${e.id}:${e.type}:${e.position.x.toFixed(2)},${e.position.z.toFixed(2)}:${e.heightFromFloorCm}:${e.circuitId}:${e.state}`),
      wiring: (state.wiring || []).map(w => `${w.id}:${w.fromId}->${w.toId}:${w.cableType}:${w.lengthMeters}:${w.circuitId}`),
      circuits: (state.circuits || []).map(c => `${c.id}:${c.state}:${c.ratedCurrentA}:${c.breakerType}:${c.phase}`),
      room: `${state.room?.width}x${state.room?.length}x${state.room?.height}`,
    });
  }, []);

  // Trigger an immediate or debounced save
  const triggerSave = useCallback((
    trigger: AutoSaveTrigger, 
    description: string, 
    immediate = false
  ) => {
    if (!autoSaveEnabled) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const executeSave = () => {
      setIsSaving(true);
      const snapshot = saveProjectSnapshot(currentStateRef.current, trigger, description);
      if (snapshot) {
        setLastSaved(snapshot);
        setSaveCount(prev => prev + 1);
        setHistory(getBackupHistory());
      }
      setTimeout(() => setIsSaving(false), 400);
    };

    if (immediate) {
      executeSave();
    } else {
      // 600ms debounce to bundle high-frequency edits into a single solid save
      saveTimeoutRef.current = setTimeout(executeSave, 600);
    }
  }, [autoSaveEnabled]);

  // Effect: Detect substantial changes in CAD or Elektroplaner
  useEffect(() => {
    const newFingerprint = computeFingerprint(projectState);

    // Initial mount skip
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      previousFingerprintRef.current = newFingerprint;
      return;
    }

    if (newFingerprint === previousFingerprintRef.current) {
      return; // No relevant structural change
    }

    // Determine the source of change based on active view and modified entity
    const prev = previousFingerprintRef.current;
    previousFingerprintRef.current = newFingerprint;

    let trigger: AutoSaveTrigger = 'cad_change';
    let description = 'Projekt aktualisiert';

    if (activeView === '3d_cad') {
      trigger = 'cad_change';
      description = 'CAD 3D: Grundriss, Möbel oder Platzierung geändert';
    } else if (activeView === 'electrical_planner') {
      trigger = 'electrical_change';
      description = 'Elektroplaner: Bauteile, Leitungswege oder DIN-Zonen geändert';
    } else if (activeView === 'distribution_board') {
      trigger = 'circuit_change';
      description = 'Verteilerkasten: Schutzschalter & Stromkreise angepasst';
    } else {
      trigger = 'cad_change';
      description = 'Projektänderung automatisch gesichert';
    }

    triggerSave(trigger, description, false);
  }, [projectState, activeView, computeFingerprint, triggerSave]);

  // Manual save trigger
  const saveNow = useCallback((customDescription?: string) => {
    soundSynth.playConfirmation();
    triggerSave('manual', customDescription || 'Manuell erstellte Sicherung', true);
  }, [triggerSave]);

  // Restore a specific snapshot
  const restoreSnapshot = useCallback((snapshot: ProjectSnapshot) => {
    if (!snapshot || !snapshot.state) return;
    try {
      soundSynth.playWelcome();
      onRestoreState(snapshot.state);
      clearCrashMarker();
      setCrashInfo(null);
      // Immediately record restored state as latest
      setTimeout(() => {
        saveProjectSnapshot(snapshot.state, 'manual', `Wiederhergestellt von Stand: ${snapshot.savedAtFormatted}`);
        setHistory(getBackupHistory());
      }, 200);
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
    }
  }, [onRestoreState]);

  // Dismiss crash recovery banner
  const dismissCrashRecovery = useCallback(() => {
    clearCrashMarker();
    setCrashInfo(null);
  }, []);

  // Simulate crash for testing
  const simulateCrash = useCallback(() => {
    simulateCrashStorage(currentStateRef.current);
  }, []);

  // Delete single snapshot from history
  const deleteSnapshot = useCallback((id: string) => {
    deleteSnapshotFromHistory(id);
    setHistory(getBackupHistory());
  }, []);

  // Clear all snapshots
  const clearAll = useCallback(() => {
    clearAllSnapshots();
    setLastSaved(null);
    setHistory([]);
  }, []);

  return {
    autoSaveEnabled,
    toggleAutoSave,
    lastSaved,
    isSaving,
    saveCount,
    history,
    crashInfo,
    saveNow,
    restoreSnapshot,
    dismissCrashRecovery,
    simulateCrash,
    deleteSnapshot,
    clearAll,
  };
}

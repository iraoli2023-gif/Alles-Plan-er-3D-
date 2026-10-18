import { 
  RoomConfig, 
  FurnitureItem, 
  ElectricalElement, 
  WiringRoute, 
  BreakerCircuit, 
  RCDDevice, 
  SmartDevice, 
  TerrariumConfig 
} from '../types';

export interface ProjectState {
  room: RoomConfig;
  rooms?: RoomConfig[];
  activeRoomId?: string;
  furniture: FurnitureItem[];
  electrical: ElectricalElement[];
  wiring: WiringRoute[];
  circuits: BreakerCircuit[];
  rcds: RCDDevice[];
  smartDevices: SmartDevice[];
  terrarium: TerrariumConfig;
}

export type AutoSaveTrigger = 
  | 'cad_change' 
  | 'electrical_change' 
  | 'circuit_change' 
  | 'room_change' 
  | 'manual' 
  | 'crash_snapshot';

export interface ProjectSnapshot {
  id: string;
  timestamp: number;
  savedAtFormatted: string;
  trigger: AutoSaveTrigger;
  description: string;
  summary: {
    furnitureCount: number;
    electricalCount: number;
    wiringCount: number;
    circuitsCount: number;
    roomDimensions: string;
    roomAreaSqM: number;
  };
  state: ProjectState;
}

export interface CrashInfo {
  wasCrash: boolean;
  crashTime?: number;
  errorReason?: string;
  backup: ProjectSnapshot | null;
}

const STORAGE_KEYS = {
  LATEST: 'voltcad_project_autosave_latest',
  HISTORY: 'voltcad_project_backup_history',
  SESSION: 'voltcad_active_session',
  CRASH: 'voltcad_crash_detected',
  ENABLED: 'voltcad_autosave_enabled',
};

const MAX_HISTORY_ITEMS = 8;

/**
 * Format timestamp into German readable string: e.g. "20.09.2026, 14:45:12"
 */
export function formatTimestamp(ts: number): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return new Date(ts).toISOString();
  }
}

/**
 * Calculate simple summary for snapshot metadata
 */
function createSummary(state: ProjectState) {
  const rooms = state.rooms && state.rooms.length > 0 ? state.rooms : [state.room];
  const totalArea = rooms.reduce((acc, r) => acc + ((r?.width || 0) * (r?.length || 0)), 0);
  const roomCount = rooms.length;
  return {
    furnitureCount: state.furniture?.length || 0,
    electricalCount: state.electrical?.length || 0,
    wiringCount: state.wiring?.length || 0,
    circuitsCount: state.circuits?.length || 0,
    roomDimensions: roomCount > 1 
      ? `${roomCount} Räume (${Number(totalArea.toFixed(1))} m²)`
      : `${state.room?.width || 0}m × ${state.room?.length || 0}m`,
    roomAreaSqM: Number(totalArea.toFixed(1)),
    roomCount,
  };
}

/**
 * Checks if auto-save is enabled in LocalStorage
 */
export function isAutoSaveEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ENABLED);
    return val !== 'false';
  } catch {
    return true;
  }
}

/**
 * Toggle auto-save enabled
 */
export function setAutoSaveEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ENABLED, enabled ? 'true' : 'false');
  } catch (err) {
    console.warn('LocalStorage error setting auto-save enabled:', err);
  }
}

/**
 * Save project snapshot to LocalStorage
 */
export function saveProjectSnapshot(
  state: ProjectState,
  trigger: AutoSaveTrigger,
  description: string
): ProjectSnapshot | null {
  if (typeof window === 'undefined' || !isAutoSaveEnabled()) return null;

  try {
    const now = Date.now();
    const snapshot: ProjectSnapshot = {
      id: `backup-${now}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      savedAtFormatted: formatTimestamp(now),
      trigger,
      description,
      summary: createSummary(state),
      state: {
        room: JSON.parse(JSON.stringify(state.room || {})),
        furniture: JSON.parse(JSON.stringify(state.furniture || [])),
        electrical: JSON.parse(JSON.stringify(state.electrical || [])),
        wiring: JSON.parse(JSON.stringify(state.wiring || [])),
        circuits: JSON.parse(JSON.stringify(state.circuits || [])),
        rcds: JSON.parse(JSON.stringify(state.rcds || [])),
        smartDevices: JSON.parse(JSON.stringify(state.smartDevices || [])),
        terrarium: JSON.parse(JSON.stringify(state.terrarium || {})),
      },
    };

    // Save latest
    localStorage.setItem(STORAGE_KEYS.LATEST, JSON.stringify(snapshot));

    // Update history (newest first, limit to MAX_HISTORY_ITEMS)
    try {
      const historyRaw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      let history: ProjectSnapshot[] = historyRaw ? JSON.parse(historyRaw) : [];
      if (!Array.isArray(history)) history = [];

      // Avoid saving identical snapshots within 2 seconds
      if (history.length > 0 && Math.abs(history[0].timestamp - now) < 2000) {
        history[0] = snapshot;
      } else {
        history.unshift(snapshot);
      }

      // Cap history to prevent storage quota issues
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (histErr) {
      console.warn('Could not update history, keeping latest snapshot only:', histErr);
    }

    // Update heartbeat timestamp on session
    updateSessionHeartbeat();

    return snapshot;
  } catch (err) {
    console.error('Failed to save project snapshot to LocalStorage:', err);
    // Attempt quota recovery
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * Retrieve the latest auto-saved project snapshot
 */
export function getLatestSnapshot(): ProjectSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LATEST);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.state && parsed.timestamp) {
      return parsed as ProjectSnapshot;
    }
    return null;
  } catch (err) {
    console.error('Failed to load latest snapshot from LocalStorage:', err);
    return null;
  }
}

/**
 * Retrieve backup history list
 */
export function getBackupHistory(): ProjectSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) {
      const latest = getLatestSnapshot();
      return latest ? [latest] : [];
    }
    const history = JSON.parse(raw);
    if (Array.isArray(history) && history.length > 0) {
      return history;
    }
    const latest = getLatestSnapshot();
    return latest ? [latest] : [];
  } catch {
    return [];
  }
}

/**
 * Delete a specific snapshot from history
 */
export function deleteSnapshotFromHistory(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getBackupHistory().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (err) {
    console.warn('Failed to delete snapshot:', err);
  }
}

/**
 * Clear all local autosaves and history
 */
export function clearAllSnapshots(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.LATEST);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.CRASH);
  } catch (err) {
    console.warn('Failed to clear snapshots:', err);
  }
}

/**
 * Session Lifecycle & Crash Monitoring
 */
export function initSessionTracking(): () => void {
  if (typeof window === 'undefined') return () => {};

  const sessionId = `session-${Date.now()}`;
  const now = Date.now();

  try {
    // Record current active session
    localStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify({
        id: sessionId,
        startedAt: now,
        lastHeartbeat: now,
        cleanExit: false,
      })
    );
  } catch {
    // ignore
  }

  // Heartbeat interval every 10 seconds
  const heartbeatInterval = setInterval(() => {
    updateSessionHeartbeat();
  }, 10000);

  // Before unload handler: mark clean exit
  const handleBeforeUnload = () => {
    try {
      const current = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (current) {
        const parsed = JSON.parse(current);
        parsed.cleanExit = true;
        parsed.lastHeartbeat = Date.now();
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }
  };

  // Window error listener: mark crash
  const handleWindowError = (event: ErrorEvent) => {
    markCrash(event.message || 'Unbehandelter JavaScript-Laufzeitfehler');
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = typeof event.reason === 'string' 
      ? event.reason 
      : (event.reason?.message || 'Nicht behandelte Promise-Rejection');
    markCrash(`Async-Fehler: ${reason}`);
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('error', handleWindowError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    clearInterval(heartbeatInterval);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('error', handleWindowError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}

function updateSessionHeartbeat(): void {
  try {
    const current = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (current) {
      const parsed = JSON.parse(current);
      parsed.lastHeartbeat = Date.now();
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

/**
 * Record a crash explicitly
 */
export function markCrash(reason: string, currentState?: ProjectState): void {
  if (typeof window === 'undefined') return;
  try {
    const now = Date.now();
    localStorage.setItem(
      STORAGE_KEYS.CRASH,
      JSON.stringify({
        crashedAt: now,
        reason,
      })
    );

    // If state is supplied at time of crash, execute an emergency snapshot!
    if (currentState) {
      saveProjectSnapshot(currentState, 'crash_snapshot', `Notfall-Sicherung bei Absturz (${reason.substring(0, 40)})`);
    }
  } catch (err) {
    console.error('Failed to mark crash in LocalStorage:', err);
  }
}

/**
 * Clear crash marker once user restored or dismissed
 */
export function clearCrashMarker(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.CRASH);
    // Also mark session clean exit so it won't prompt again
    const current = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (current) {
      const parsed = JSON.parse(current);
      parsed.cleanExit = true;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

/**
 * Check on application start if a crash recovery is available
 */
export function checkCrashRecovery(): CrashInfo {
  if (typeof window === 'undefined') {
    return { wasCrash: false, backup: null };
  }

  try {
    const latestBackup = getLatestSnapshot();
    if (!latestBackup) {
      return { wasCrash: false, backup: null };
    }

    // Check explicit crash marker
    const crashMarkerRaw = localStorage.getItem(STORAGE_KEYS.CRASH);
    if (crashMarkerRaw) {
      const parsed = JSON.parse(crashMarkerRaw);
      return {
        wasCrash: true,
        crashTime: parsed.crashedAt || latestBackup.timestamp,
        errorReason: parsed.reason || 'Unerwarteter Absturz in vorheriger Sitzung',
        backup: latestBackup,
      };
    }

    // Check session marker: was cleanExit false and lastHeartbeat within reasonable past?
    const sessionRaw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      // If the session was not exited cleanly, and the backup is recent (within last 7 days)
      if (session.cleanExit === false && latestBackup.timestamp) {
        const timeDiff = Date.now() - session.lastHeartbeat;
        // If the session died more than 3 seconds ago
        if (timeDiff > 3000) {
          return {
            wasCrash: true,
            crashTime: latestBackup.timestamp,
            errorReason: 'Vorherige Sitzung wurde unerwartet beendet (z.B. Tab-Absturz oder Schließen)',
            backup: latestBackup,
          };
        }
      }
    }

    return { wasCrash: false, backup: null };
  } catch (err) {
    console.warn('Error checking crash recovery status:', err);
    return { wasCrash: false, backup: null };
  }
}

/**
 * Simulate a crash for testing the restore workflow
 */
export function simulateCrash(currentState: ProjectState): void {
  markCrash('Test-Simulation: Simulierter WebGL/CAD-Absturz', currentState);
  // Reload the window or trigger crash state
  window.location.reload();
}

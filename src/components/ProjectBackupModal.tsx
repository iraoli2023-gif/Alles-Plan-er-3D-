import React, { useState } from 'react';
import { ProjectSnapshot } from '../utils/projectAutoSave';
import { GoogleDriveUser, DriveFileInfo } from '../utils/googleDrive';
import { 
  Save, 
  RotateCcw, 
  X, 
  Check, 
  Trash2, 
  ShieldAlert, 
  Box, 
  Zap, 
  Cable, 
  Cpu, 
  AlertTriangle,
  History,
  HardDrive,
  Cloud,
  CloudUpload,
  ExternalLink,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ProjectBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  // LocalStorage Props
  lastSaved: ProjectSnapshot | null;
  history: ProjectSnapshot[];
  autoSaveEnabled: boolean;
  onToggleAutoSave: (enabled: boolean) => void;
  onManualSave: (description?: string) => void;
  onRestore: (snapshot: ProjectSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  onClearAll: () => void;
  onSimulateCrash: () => void;
  // Google Drive Props
  driveUser: GoogleDriveUser | null;
  isDriveConnected: boolean;
  isDriveSyncing: boolean;
  driveAutoSyncEnabled: boolean;
  onToggleDriveAutoSync: (enabled: boolean) => void;
  lastDriveSyncedTime: string | null;
  lastDriveFileUrl: string | null;
  driveFiles: DriveFileInfo[];
  driveError: string | null;
  onDriveLogin: () => Promise<void>;
  onDriveLogout: () => Promise<void>;
  onDriveSyncNow: () => Promise<void>;
  onRestoreFromDrive: (fileId: string) => Promise<void>;
  onDeleteDriveFile: (fileId: string, fileName: string) => Promise<void>;
  initialTab?: 'drive' | 'local';
}

export const ProjectBackupModal: React.FC<ProjectBackupModalProps> = ({
  isOpen,
  onClose,
  lastSaved,
  history,
  autoSaveEnabled,
  onToggleAutoSave,
  onManualSave,
  onRestore,
  onDeleteSnapshot,
  onClearAll,
  onSimulateCrash,
  driveUser,
  isDriveConnected,
  isDriveSyncing,
  driveAutoSyncEnabled,
  onToggleDriveAutoSync,
  lastDriveSyncedTime,
  lastDriveFileUrl,
  driveFiles,
  driveError,
  onDriveLogin,
  onDriveLogout,
  onDriveSyncNow,
  onRestoreFromDrive,
  onDeleteDriveFile,
  initialTab = 'drive',
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'local'>(initialTab);
  const [customDesc, setCustomDesc] = useState('');
  const [showSimulateConfirm, setShowSimulateConfirm] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [confirmDriveRestoreId, setConfirmDriveRestoreId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSave = () => {
    onManualSave(customDesc.trim() || undefined);
    setCustomDesc('');
  };

  const handleConfirmRestore = (snapshot: ProjectSnapshot) => {
    onRestore(snapshot);
    setConfirmRestoreId(null);
    onClose();
  };

  const handleConfirmDriveRestore = async (fileId: string) => {
    await onRestoreFromDrive(fileId);
    setConfirmDriveRestoreId(null);
    onClose();
  };

  const getTriggerBadge = (trigger: ProjectSnapshot['trigger']) => {
    switch (trigger) {
      case 'cad_change':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800/60 flex items-center gap-1">
            <Box className="w-2.5 h-2.5" />
            CAD Änderung
          </span>
        );
      case 'electrical_change':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" />
            Elektroplan
          </span>
        );
      case 'circuit_change':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
            <Cpu className="w-2.5 h-2.5" />
            Verteilerkasten
          </span>
        );
      case 'crash_snapshot':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/60 flex items-center gap-1 animate-pulse">
            <ShieldAlert className="w-2.5 h-2.5" />
            Absturz-Snapshot
          </span>
        );
      case 'manual':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800/60 flex items-center gap-1">
            <Save className="w-2.5 h-2.5" />
            Manuell
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-sky-400 border border-sky-500/30">
              <Cloud className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Projekt-Sicherung & Synchronisation
              </h2>
              <p className="text-xs text-slate-400">
                Automatisches Speichern in Google Drive und lokaler Notfall-Verlauf
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'drive'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Google Drive (Cloud-Sync)</span>
            {isDriveConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('local')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'local'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Lokaler Speicher ({history.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {driveError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{driveError}</div>
            </div>
          )}

          {/* TAB 1: GOOGLE DRIVE CLOUD-SYNC */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              {!isDriveConnected ? (
                /* Google Drive Not Connected Banner */
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-500/30 shadow-xl space-y-4 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3 shadow-inner">
                    <svg className="w-8 h-8" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  </div>

                  <div className="max-w-md">
                    <h3 className="text-sm font-bold text-white">
                      Automatisches Speichern in Google Drive
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Verbinde dein persönliches Google Drive, um deine 3D-CAD Pläne, Raumansätze und Elektro-Installationen nach DIN 18015 bei jeder Änderung automatisch in der Cloud zu sichern.
                    </p>
                  </div>

                  {/* Official Google Sign-In Button */}
                  <button
                    onClick={onDriveLogin}
                    disabled={isDriveSyncing}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-3 shadow-lg hover:shadow-xl transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>Mit Google anmelden & Drive aktivieren</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Sicher: VoltCAD erhält nur Zugriff auf selbst erstellte Projektdateien</span>
                  </div>
                </div>
              ) : (
                /* Google Drive Connected View */
                <div className="space-y-4">
                  {/* Account Card */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {driveUser?.photoURL ? (
                        <img 
                          src={driveUser.photoURL} 
                          alt="Google Profile" 
                          className="w-10 h-10 rounded-full border border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm border border-sky-500/30">
                          {driveUser?.displayName?.charAt(0) || 'G'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {driveUser?.displayName || 'Google Drive Nutzer'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Verbunden
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {driveUser?.email || ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={onDriveLogout}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-400 border border-slate-800 text-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="Google Drive Verbindung trennen"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Trennen</span>
                    </button>
                  </div>

                  {/* Auto-Sync Toggle & Sync Status */}
                  <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">
                          Automatisches Speichern in Google Drive
                        </span>
                        {isDriveSyncing && (
                          <span className="text-[10px] font-mono text-sky-400 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Wird gesichert...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {lastDriveSyncedTime ? (
                          <>Letzte Cloud-Sicherung: <strong className="text-sky-300">{lastDriveSyncedTime} Uhr</strong></>
                        ) : (
                          'Noch keine Synchronisation durchgeführt'
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={onDriveSyncNow}
                        disabled={isDriveSyncing}
                        className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <CloudUpload className="w-3.5 h-3.5" />
                        <span>Jetzt sichern</span>
                      </button>

                      <button
                        onClick={() => onToggleDriveAutoSync(!driveAutoSyncEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          driveAutoSyncEnabled ? 'bg-sky-500' : 'bg-slate-700'
                        }`}
                        title={driveAutoSyncEnabled ? 'Cloud Auto-Sync deaktivieren' : 'Cloud Auto-Sync aktivieren'}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            driveAutoSyncEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Last Synced File Link */}
                  {lastDriveFileUrl && (
                    <div className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Cloud-Datei: <strong className="text-slate-200">VoltCAD_AutoSave_Project.json</strong>
                      </span>
                      <a
                        href={lastDriveFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:text-sky-300 font-semibold text-[11px] flex items-center gap-1 hover:underline"
                      >
                        <span>In Google Drive ansehen</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Drive Files History */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-sky-400" />
                      In Google Drive gespeicherte Pläne ({driveFiles.length})
                    </h4>

                    {driveFiles.length === 0 ? (
                      <div className="p-6 text-center rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-xs text-slate-500">
                        Noch keine Dateien in Google Drive vorhanden. Klicke auf &quot;Jetzt sichern&quot;, um den ersten Stand in der Cloud zu speichern.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {driveFiles.map(file => (
                          <div
                            key={file.id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Box className="w-3.5 h-3.5 text-sky-400" />
                                {file.name}
                              </span>
                              <p className="text-[11px] text-slate-400">
                                Zuletzt geändert: {new Date(file.modifiedTime).toLocaleString('de-DE')}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {confirmDriveRestoreId === file.id ? (
                                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 p-1 rounded-lg">
                                  <span className="text-[10px] text-amber-300 font-bold px-1">Überschreiben?</span>
                                  <button
                                    onClick={() => handleConfirmDriveRestore(file.id)}
                                    className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold transition cursor-pointer"
                                  >
                                    Ja, laden
                                  </button>
                                  <button
                                    onClick={() => setConfirmDriveRestoreId(null)}
                                    className="px-1.5 py-1 rounded text-slate-400 hover:text-white text-[10px] transition cursor-pointer"
                                  >
                                    Abbr.
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDriveRestoreId(file.id)}
                                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                  title="Projekt aus Google Drive laden"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Laden</span>
                                </button>
                              )}

                              <button
                                onClick={() => onDeleteDriveFile(file.id, file.name)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10 cursor-pointer"
                                title="Aus Google Drive entfernen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOCAL STORAGE BACKUP HISTORY */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              {/* Local Auto-Save Status Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      Lokales HTML5 Auto-Save
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      autoSaveEnabled 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {autoSaveEnabled ? 'Aktiviert' : 'Pausiert'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {lastSaved 
                      ? `Zuletzt lokal gesichert: ${lastSaved.savedAtFormatted}` 
                      : 'Noch kein Snapshot im Browser-Speicher'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleAutoSave(!autoSaveEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      autoSaveEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        autoSaveEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Manual Snapshot Input */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Manuellen lokalen Sicherungspunkt erstellen
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="Beschreibung (z.B. Vor Verlegung der Küchen-Kabeltrasse)..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSave()}
                  />
                  <button
                    onClick={handleManualSave}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Sichern</span>
                  </button>
                </div>
              </div>

              {/* Local Snapshot History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    Gespeicherte Wiederherstellungspunkte ({history.length})
                  </h3>
                  {history.length > 0 && (
                    <button
                      onClick={onClearAll}
                      className="text-[11px] text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Verlauf leeren
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-xs text-slate-500">
                    Noch keine Sicherungen im LocalStorage vorhanden.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {history.map(snapshot => (
                      <div 
                        key={snapshot.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getTriggerBadge(snapshot.trigger)}
                            <span className="text-xs font-bold text-slate-200">
                              {snapshot.savedAtFormatted}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400">
                            {snapshot.description}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                            <span>{snapshot.summary.furnitureCount} Möbel</span>
                            <span>•</span>
                            <span>{snapshot.summary.electricalCount} Elektro</span>
                            <span>•</span>
                            <span>{snapshot.summary.wiringCount} Leitungen</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {confirmRestoreId === snapshot.id ? (
                            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 p-1 rounded-lg">
                              <span className="text-[10px] text-amber-300 font-bold px-1">Sicher?</span>
                              <button
                                onClick={() => handleConfirmRestore(snapshot)}
                                className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold transition cursor-pointer"
                              >
                                Ja, laden
                              </button>
                              <button
                                onClick={() => setConfirmRestoreId(null)}
                                className="px-1.5 py-1 rounded text-slate-400 hover:text-white text-[10px] transition cursor-pointer"
                              >
                                Abbr.
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRestoreId(snapshot.id)}
                              className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                              title="Projekt auf diesen Stand zurücksetzen"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Wiederherstellen</span>
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteSnapshot(snapshot.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10 cursor-pointer"
                            title="Diesen Speicherpunkt löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Crash Testing & Simulation Tool */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Absturz-Wiederherstellung testen</span>
                  </div>
                  <span className="text-[10px] text-amber-400/80 font-mono">Test & Verifikation</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Testet die Notfall-Wiederherstellung: Speichert den aktuellen Zustand als Notfall-Snapshot ab, simuliert einen unerwarteten Sitzungsabbruch und lädt die Seite neu.
                </p>

                {showSimulateConfirm ? (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={onSimulateCrash}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Ja, Absturz jetzt simulieren
                    </button>
                    <button
                      onClick={() => setShowSimulateConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSimulateConfirm(true)}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Absturz-Szenario simulieren</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            {activeTab === 'drive' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span>Synchronisiert mit Google Drive Cloud Storage</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gesichert im HTML5 LocalStorage deines Endgeräts</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  RotateCcw, 
  Home, 
  Sparkles, 
  RefreshCw, 
  X, 
  Check, 
  AlertTriangle,
  Zap,
  Box,
  Save,
  Clock,
  HardDrive
} from 'lucide-react';
import { soundSynth } from '../utils/audioSynth';
import { ProjectSnapshot } from '../utils/projectAutoSave';

interface ResetProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToDemo: () => void;
  onResetToEmpty: () => void;
  lastSaved?: ProjectSnapshot | null;
  onRestoreBackup?: (snapshot: ProjectSnapshot) => void;
  onOpenBackupHistory?: () => void;
}

export const ResetProjectModal: React.FC<ResetProjectModalProps> = ({
  isOpen,
  onClose,
  onResetToDemo,
  onResetToEmpty,
  lastSaved,
  onRestoreBackup,
  onOpenBackupHistory,
}) => {
  if (!isOpen) return null;

  const handleRestore = () => {
    if (lastSaved && onRestoreBackup) {
      soundSynth.playWelcome();
      onRestoreBackup(lastSaved);
      onClose();
    }
  };

  const handleDemo = () => {
    soundSynth.playSoundByType('welcome');
    onResetToDemo();
    onClose();
  };

  const handleEmpty = () => {
    soundSynth.playSoundByType('ding');
    onResetToEmpty();
    onClose();
  };

  const handleReload = () => {
    soundSynth.playSoundByType('ding');
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/60 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Projekt Neustart & Zurücksetzen
              </h2>
              <p className="text-xs text-slate-400">
                Wähle den gewünschten Zustand für die Neuinitialisierung von VoltCAD 3D
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Option Cards */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Option 0: Auto-Save Recovery (if available) */}
          {lastSaved && onRestoreBackup && (
            <div 
              onClick={handleRestore}
              className="group p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/40 hover:border-emerald-400 hover:bg-slate-950/90 transition-all cursor-pointer relative shadow-lg shadow-emerald-950/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition flex items-center gap-2">
                      <span>Letzten Auto-Save Stand wiederherstellen</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      Auto-Save
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Stellt den automatisch im LocalStorage gesicherten Projektstand vom <strong className="text-emerald-300">{lastSaved.savedAtFormatted}</strong> wieder her ({lastSaved.summary.furnitureCount} Möbel, {lastSaved.summary.electricalCount} Elektro-Elemente, {lastSaved.summary.wiringCount} Leitungswege).
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <span>Projektstand sofort laden</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                    {onOpenBackupHistory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onOpenBackupHistory();
                        }}
                        className="text-[11px] text-slate-400 hover:text-white underline underline-offset-2"
                      >
                        Alle Sicherungen anzeigen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Option 1: Full Demo Apartment */}
          <div 
            onClick={handleDemo}
            className="group p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/60 hover:bg-slate-950/90 transition-all cursor-pointer relative"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Home className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition">
                    Musterwohnung mit Terrarium (Standard)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800/60">
                    Empfohlen
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Stellt die vollständige Musterwohnung mit Wohnlandschaft, ExoTerra Terrarium, DIN 18015 Elektroinstallation, Hutschiene-Unterverteilung und Smart-Home-Regeln wieder her.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-sky-400">
                  <span>Musterwohnung jetzt laden</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Empty Room for Scratch Planning */}
          <div 
            onClick={handleEmpty}
            className="group p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-950/90 transition-all cursor-pointer relative"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Box className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                    Leeres Projekt starten (Tabula Rasa)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60">
                    Neubeginn
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Startet mit einem leeren Raum (7,8m × 5,6m). Entfernt alle Möbel, Steckdosen, Schalter und Leitungswege, damit du dein eigenes Projekt von Grund auf planen kannst.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <span>Leere Wohnung beginnen</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </div>

          {/* Option 3: Browser Reload */}
          <div 
            onClick={handleReload}
            className="group p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-950/90 transition-all cursor-pointer relative"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  Web-App komplett neu laden
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Führt einen vollständigen Refresh der Anwendung im Browser durch und setzt alle temporären Zustände zurück.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <span>Browser-Seite neu laden</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>VoltCAD 3D Engine v2.4 • DIN 18015 konform</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

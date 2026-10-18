import React from 'react';
import { CrashInfo, ProjectSnapshot } from '../utils/projectAutoSave';
import { 
  AlertTriangle, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Box, 
  Zap, 
  Clock 
} from 'lucide-react';

interface CrashRecoveryBannerProps {
  crashInfo: CrashInfo;
  onRestore: (snapshot: ProjectSnapshot) => void;
  onDismiss: () => void;
}

export const CrashRecoveryBanner: React.FC<CrashRecoveryBannerProps> = ({
  crashInfo,
  onRestore,
  onDismiss,
}) => {
  const backup = crashInfo.backup;
  if (!backup) return null;

  return (
    <div 
      className="relative z-50 w-full bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 px-4 py-3 shadow-xl shadow-slate-950/80 animate-in slide-in-from-top duration-300"
      role="alert"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left side: Icon & explanation */}
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-300">
                Wiederherstellung nach Absturz / Unterbrechung verfügbar
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                LocalStorage Sicherung
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-amber-400" />
                Stand: <strong className="text-slate-200">{backup.savedAtFormatted}</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span>
                {backup.summary.furnitureCount} Möbel, {backup.summary.electricalCount} Elektro-Elemente, {backup.summary.wiringCount} Leitungen
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400/90 italic">
                {backup.description}
              </span>
            </p>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={() => onRestore(backup)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Jetzt wiederherstellen</span>
          </button>

          <button
            onClick={onDismiss}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            title="Sicherung ignorieren und mit aktuellem Stand fortfahren"
          >
            <X className="w-3.5 h-3.5" />
            <span>Verwerfen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  Wifi, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  PenTool, 
  Hand, 
  ShieldCheck, 
  Zap, 
  Activity, 
  HardDrive,
  Maximize2,
  Sliders,
  Check
} from 'lucide-react';

interface WindowsQuickSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  touchInputMode: 'touch' | 'pencil';
  onToggleTouchInputMode: (mode: 'touch' | 'pencil') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentWatts: number;
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
}

export const WindowsQuickSettings: React.FC<WindowsQuickSettingsProps> = ({
  isOpen,
  onClose,
  touchInputMode,
  onToggleTouchInputMode,
  soundEnabled,
  onToggleSound,
  currentWatts,
  autoSaveEnabled,
  onToggleAutoSave,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed bottom-14 right-3 w-[92vw] max-w-[360px] bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl z-50 p-4 text-slate-100 flex flex-col gap-4 select-none animate-in fade-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            Windows 11 Schnelleinstellungen
          </span>
          <span className="text-[10px] text-slate-400">VoltCAD Control Center</span>
        </div>

        {/* Quick Toggles Grid (Windows 11 Action Center Tiles) */}
        <div className="grid grid-cols-3 gap-2">
          {/* Tile 1: WLAN / Netzwerk */}
          <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400/50 flex flex-col items-center justify-center gap-1.5 text-center">
            <Wifi className="w-5 h-5 text-sky-400" />
            <span className="text-[11px] font-semibold text-white">WLAN</span>
            <span className="text-[9px] text-sky-300">Verbunden</span>
          </div>

          {/* Tile 2: Windows Ink / Touch Modus */}
          <button
            onClick={() => onToggleTouchInputMode(touchInputMode === 'touch' ? 'pencil' : 'touch')}
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition ${
              touchInputMode === 'pencil'
                ? 'bg-amber-500/20 border-amber-400/50 text-white'
                : 'bg-slate-950/60 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            {touchInputMode === 'pencil' ? (
              <PenTool className="w-5 h-5 text-amber-400" />
            ) : (
              <Hand className="w-5 h-5 text-slate-400" />
            )}
            <span className="text-[11px] font-semibold">
              {touchInputMode === 'pencil' ? 'Stift/Ink' : 'Touch'}
            </span>
            <span className="text-[9px] text-slate-400">
              {touchInputMode === 'pencil' ? 'DIN Raster' : 'Frei'}
            </span>
          </button>

          {/* Tile 3: Sound Synth / Audio Effekte */}
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition ${
              soundEnabled
                ? 'bg-sky-500/20 border-sky-400/50 text-white'
                : 'bg-slate-950/60 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-sky-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
            <span className="text-[11px] font-semibold">Audio</span>
            <span className="text-[9px] text-slate-400">
              {soundEnabled ? 'Aktiv' : 'Stumm'}
            </span>
          </button>

          {/* Tile 4: Auto-Save LocalStorage */}
          <button
            onClick={onToggleAutoSave}
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition ${
              autoSaveEnabled
                ? 'bg-emerald-500/20 border-emerald-400/50 text-white'
                : 'bg-slate-950/60 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            <HardDrive className={`w-5 h-5 ${autoSaveEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="text-[11px] font-semibold">Auto-Save</span>
            <span className="text-[9px] text-slate-400">
              {autoSaveEnabled ? 'Lokal Ein' : 'Aus'}
            </span>
          </button>

          {/* Tile 5: DIN 18015 Schutz */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col items-center justify-center gap-1.5 text-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-white">DIN 18015</span>
            <span className="text-[9px] text-emerald-400">Überwacht</span>
          </div>

          {/* Tile 6: 230V Netzlast */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col items-center justify-center gap-1.5 text-center">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-[11px] font-semibold text-white">{currentWatts} W</span>
            <span className="text-[9px] text-slate-400">230V / 50Hz</span>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
          <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
          <input 
            type="range" 
            min="0" 
            max="100" 
            defaultValue="75"
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-2">
          <span>Netzstrom: 230V AC stabil</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Check className="w-3 h-3" /> System bereit
          </span>
        </div>
      </div>
    </>
  );
};

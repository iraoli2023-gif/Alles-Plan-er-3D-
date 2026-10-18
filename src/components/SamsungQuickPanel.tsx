import React from 'react';
import { 
  X, 
  Moon, 
  PenTool, 
  Vibrate, 
  Zap, 
  ShieldCheck, 
  Monitor, 
  FileText, 
  Flashlight, 
  SunMedium, 
  RotateCcw,
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';
import { triggerSamsungHaptic } from '../utils/samsungHaptics';
import { soundSynth } from '../utils/audioSynth';

interface SamsungQuickPanelProps {
  isOpen: boolean;
  onClose: () => void;
  amoledBlack: boolean;
  onToggleAmoled: () => void;
  touchInputMode: 'touch' | 'pencil';
  onToggleTouchInputMode: (mode: 'touch' | 'pencil') => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  highRefreshRate: boolean;
  onToggleHighRefreshRate: () => void;
  isTorchActive: boolean;
  onToggleTorch: () => void;
  onOpenDINModal?: () => void;
  onOpenDesktopModal?: () => void;
  onOpenSamsungInstall: () => void;
}

export const SamsungQuickPanel: React.FC<SamsungQuickPanelProps> = ({
  isOpen,
  onClose,
  amoledBlack,
  onToggleAmoled,
  touchInputMode,
  onToggleTouchInputMode,
  hapticsEnabled,
  onToggleHaptics,
  highRefreshRate,
  onToggleHighRefreshRate,
  isTorchActive,
  onToggleTorch,
  onOpenDINModal,
  onOpenDesktopModal,
  onOpenSamsungInstall,
}) => {
  if (!isOpen) return null;

  const quickToggles = [
    {
      id: 'amoled',
      label: 'AMOLED Pure Black',
      sub: amoledBlack ? '#000000 Aktiv' : 'Standard Dunkel',
      icon: Moon,
      active: amoledBlack,
      action: () => {
        triggerSamsungHaptic('light');
        onToggleAmoled();
      },
      color: 'bg-indigo-500 text-white',
    },
    {
      id: 'spen',
      label: 'S-Pen Präzision',
      sub: touchInputMode === 'pencil' ? 'S-Pen aktiv' : 'Finger-Orbit',
      icon: PenTool,
      active: touchInputMode === 'pencil',
      action: () => {
        triggerSamsungHaptic('medium');
        onToggleTouchInputMode(touchInputMode === 'pencil' ? 'touch' : 'pencil');
      },
      color: 'bg-sky-500 text-slate-950',
    },
    {
      id: 'torch',
      label: 'Baustellen-Leuchte',
      sub: isTorchActive ? 'Screen Torch AN' : 'Aus',
      icon: Flashlight,
      active: isTorchActive,
      action: () => {
        triggerSamsungHaptic('heavy');
        onToggleTorch();
      },
      color: 'bg-amber-400 text-slate-950',
    },
    {
      id: 'haptics',
      label: 'Haptik & Vibration',
      sub: hapticsEnabled ? 'Samsung Motor AN' : 'Lautlos',
      icon: Vibrate,
      active: hapticsEnabled,
      action: () => {
        triggerSamsungHaptic('selection');
        onToggleHaptics();
      },
      color: 'bg-emerald-500 text-slate-950',
    },
    {
      id: 'refresh',
      label: '120Hz Ultra-Smooth',
      sub: highRefreshRate ? 'Dynamisch 120Hz' : 'Standard 60Hz',
      icon: Zap,
      active: highRefreshRate,
      action: () => {
        triggerSamsungHaptic('light');
        onToggleHighRefreshRate();
      },
      color: 'bg-cyan-500 text-slate-950',
    },
    {
      id: 'knox',
      label: 'Knox Offline-Schutz',
      sub: 'Lokal verschlüsselt',
      icon: ShieldCheck,
      active: true,
      action: () => {
        triggerSamsungHaptic('light');
      },
      color: 'bg-blue-600 text-white',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col justify-start p-3 sm:p-5 animate-in slide-in-from-top-4 duration-200">
      {/* Container inside max width for tablet / desktop preview */}
      <div className={`w-full max-w-md mx-auto ${amoledBlack ? 'bg-black border-zinc-800' : 'bg-slate-900 border-slate-800'} rounded-3xl border shadow-2xl p-4 sm:p-5 flex flex-col gap-4`}>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Samsung One UI Quick Panel
              </h3>
              <span className="text-[10px] text-slate-400">Schnelleinstellungen & Display</span>
            </div>
          </div>
          <button
            onClick={() => {
              triggerSamsungHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6-Grid Quick Toggles (One UI Style) */}
        <div className="grid grid-cols-3 gap-2.5">
          {quickToggles.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={t.action}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center transition active:scale-95 border ${
                  t.active
                    ? `${t.color} border-transparent shadow-md`
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-400 border-slate-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-bold leading-tight block truncate max-w-full">
                  {t.label}
                </span>
                <span className={`text-[9px] ${t.active ? 'opacity-90 font-medium' : 'text-slate-500'}`}>
                  {t.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Display Brightness Slider (One UI Authentic Aesthetic) */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <SunMedium className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
              <span>Display-Helligkeit</span>
              <span className="font-mono text-sky-400">100% High-CRI</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
              <div className="w-full h-full bg-gradient-to-r from-amber-500 to-sky-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Bottom Fast Links */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => {
              triggerSamsungHaptic('medium');
              onClose();
              onOpenSamsungInstall();
            }}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition"
          >
            <span>📱 Galaxy APK & DeX</span>
          </button>

          {onOpenDINModal && (
            <button
              onClick={() => {
                triggerSamsungHaptic('light');
                onClose();
                onOpenDINModal();
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-emerald-400 font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>📄 DIN 18015 PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

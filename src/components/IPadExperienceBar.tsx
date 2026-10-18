import React, { useState } from 'react';
import { ActiveAppView } from '../types';
import { soundSynth } from '../utils/audioSynth';
import { 
  Tablet, 
  PenTool, 
  Hand, 
  Maximize2, 
  HelpCircle, 
  Zap, 
  Box, 
  Cpu, 
  Sun, 
  Activity, 
  RotateCw, 
  RotateCcw,
  Check, 
  Sliders, 
  X,
  Compass,
  Smartphone,
  Bot
} from 'lucide-react';

export type IPadViewportMode = 'fullscreen' | 'ipad_pro_13' | 'ipad_air_11' | 'ipad_mini';

interface IPadExperienceBarProps {
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  viewportMode: IPadViewportMode;
  onChangeViewportMode: (mode: IPadViewportMode) => void;
  touchInputMode: 'touch' | 'pencil';
  onToggleTouchInputMode: (mode: 'touch' | 'pencil') => void;
  onOpenResetModal?: () => void;
}

export const IPadExperienceBar: React.FC<IPadExperienceBarProps> = ({
  activeView,
  onSelectView,
  viewportMode,
  onChangeViewportMode,
  touchInputMode,
  onToggleTouchInputMode,
  onOpenResetModal,
}) => {
  const [showGestureGuide, setShowGestureGuide] = useState(false);
  const [showViewportMenu, setShowViewportMenu] = useState(false);

  const handleDockClick = (view: ActiveAppView) => {
    soundSynth.playConfirmation();
    onSelectView(view);
  };

  const viewportLabels: Record<IPadViewportMode, string> = {
    fullscreen: 'iPad Vollbild (Native)',
    ipad_pro_13: 'iPad Pro 12.9″ / 13″',
    ipad_air_11: 'iPad Air / Pro 11″',
    ipad_mini: 'iPad Mini (8.3″)',
  };

  return (
    <>
      {/* Floating iPadOS Bottom Dock Navigation */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-2 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 pb-[max(env(safe-area-inset-bottom),0.5rem)] transition-all">
        {/* CAD 3D */}
        <button
          onClick={() => handleDockClick('3d_cad')}
          className={`h-11 px-3 rounded-xl flex items-center gap-2 text-xs font-bold transition active:scale-95 ${
            activeView === '3d_cad'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="3D CAD Wohnung"
        >
          <Box className="w-4 h-4" />
          <span className="hidden sm:inline">3D CAD</span>
        </button>

        {/* Elektro DIN */}
        <button
          onClick={() => handleDockClick('electrical_planner')}
          className={`h-11 px-3 rounded-xl flex items-center gap-2 text-xs font-bold transition active:scale-95 ${
            activeView === 'electrical_planner'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="DIN 18015 Elektropläne"
        >
          <Zap className="w-4 h-4" />
          <span className="hidden sm:inline">DIN Elektro</span>
        </button>

        {/* Verteilerschrank */}
        <button
          onClick={() => handleDockClick('distribution_board')}
          className={`h-11 px-3 rounded-xl flex items-center gap-2 text-xs font-bold transition active:scale-95 ${
            activeView === 'distribution_board'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Verteilerschrank & Hutschiene"
        >
          <Cpu className="w-4 h-4" />
          <span className="hidden sm:inline">Hutschiene</span>
        </button>

        {/* Smart Home & Logik-Editor */}
        <button
          onClick={() => handleDockClick('smart_home')}
          className={`h-11 px-3 rounded-xl flex items-center gap-2 text-xs font-bold transition active:scale-95 relative ${
            activeView === 'smart_home'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Smart Home Gateway & Logik-Editor"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span className="hidden sm:inline">Logik & Smart</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        </button>

        {/* Terrarium */}
        <button
          onClick={() => handleDockClick('terrarium')}
          className={`h-11 px-3 rounded-xl flex items-center gap-2 text-xs font-bold transition active:scale-95 ${
            activeView === 'terrarium'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Terrarium Steuerung"
        >
          <Sun className="w-4 h-4" />
          <span className="hidden sm:inline">Terrarium</span>
        </button>

        {/* Energie */}
        <button
          onClick={() => handleDockClick('energy_realtime')}
          className={`h-11 px-3 rounded-xl flex items-center gap-2 text-xs font-bold transition active:scale-95 ${
            activeView === 'energy_realtime'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Echtzeit-Energie"
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Energie</span>
        </button>

        {/* KI-Auditor */}
        <button
          onClick={() => handleDockClick('ai_auditor')}
          className={`h-11 px-3 rounded-xl flex items-center gap-2 text-xs font-bold transition active:scale-95 ${
            activeView === 'ai_auditor'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-amber-400 hover:text-white hover:bg-white/5'
          }`}
          title="KI-Auditor (DIN 18015 & Lastmanagement)"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">KI-Auditor</span>
        </button>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-slate-700 mx-1 hidden sm:block" />

        {/* Apple Pencil vs Touch Mode Quick Switcher */}
        <button
          onClick={() => {
            const next = touchInputMode === 'touch' ? 'pencil' : 'touch';
            soundSynth.playConfirmation();
            onToggleTouchInputMode(next);
          }}
          className={`h-11 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition active:scale-95 ${
            touchInputMode === 'pencil'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'bg-slate-800 text-sky-300 hover:bg-slate-700'
          }`}
          title={touchInputMode === 'pencil' ? 'Apple Pencil Präzisions-Modus aktiv' : 'Finger-Touch Modus aktiv'}
        >
          {touchInputMode === 'pencil' ? (
            <>
              <PenTool className="w-4 h-4" />
              <span className="hidden md:inline">Apple Pencil</span>
            </>
          ) : (
            <>
              <Hand className="w-4 h-4" />
              <span className="hidden md:inline">Touch Modus</span>
            </>
          )}
        </button>

        {/* Gestures Help button */}
        <button
          onClick={() => {
            soundSynth.playConfirmation();
            setShowGestureGuide(true);
          }}
          className="w-11 h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition active:scale-95"
          title="iPad Touch & Gesten-Hilfe"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Neustart / Reset button */}
        {onOpenResetModal && (
          <button
            onClick={() => {
              soundSynth.playConfirmation();
              onOpenResetModal();
            }}
            className="w-11 h-11 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-amber-500/20 flex items-center justify-center transition active:scale-95"
            title="Projekt Neustart & Zurücksetzen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* iPad Touch & Gesture Guide Sheet / Modal */}
      {showGestureGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowGestureGuide(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Tablet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">iPad & Apple Pencil Gesten</h3>
                <p className="text-xs text-slate-400">Optimiert für Apple iPad Pro, iPad Air & iPad Mini</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="p-2 rounded-xl bg-sky-950/80 text-sky-400 text-sm">👆</span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">1-Finger Touch (Drehen & Platzieren)</h4>
                  <p className="text-slate-400">
                    Wische im 3D-Viewer mit einem Finger, um die Wohnung stufenlos zu drehen. Tippe auf Steckdosen, Leuchten oder Möbel zum Auswählen.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="p-2 rounded-xl bg-amber-950/80 text-amber-400 text-sm">✌️</span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">2-Finger Geste (Pinch-to-Zoom & Schwenken)</h4>
                  <p className="text-slate-400">
                    Ziehe zwei Finger zusammen oder auseinander zum Zoomen. Verschiebe mit zwei Fingern die Schnittebene oder den Grundriss.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="p-2 rounded-xl bg-purple-950/80 text-purple-400 text-sm">✍️</span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Apple Pencil Unterstützung</h4>
                  <p className="text-slate-400">
                    Mit dem Apple Pencil lassen sich Leitungsrouten nach DIN 18015 zentimetergenau verlegen und Logik-Bausteine pixelgenau verknüpfen.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 text-sm">📱</span>
                <div>
                  <h4 className="font-bold text-white mb-0.5">iPadOS Split View & Slide Over</h4>
                  <p className="text-slate-400">
                    VoltCAD 3D passt sich flexibel an Multitasking im Querformat oder Hochformat an.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowGestureGuide(false)}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

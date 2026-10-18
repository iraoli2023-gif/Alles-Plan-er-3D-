import React, { useState } from 'react';
import { 
  Zap, 
  Box, 
  PenTool, 
  Flashlight, 
  Calculator, 
  Smartphone, 
  Save, 
  Layers, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Check,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  ToggleLeft
} from 'lucide-react';
import { RoomConfig, ElectricalElement, FurnitureItem } from '../types';
import { triggerSamsungHaptic } from '../utils/samsungHaptics';
import { soundSynth } from '../utils/audioSynth';

interface SamsungEdgePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  activeRoom: RoomConfig;
  touchInputMode: 'touch' | 'pencil';
  onToggleTouchInputMode: (mode: 'touch' | 'pencil') => void;
  onAddElectrical?: (element: Partial<ElectricalElement>) => void;
  onAddFurniture?: (item: Partial<FurnitureItem>) => void;
  onToggleTorch: () => void;
  isTorchActive: boolean;
  onOpenDINModal?: () => void;
  onOpenSamsungInstall: () => void;
  onSaveNow: () => void;
  onOpenRoomManager: () => void;
  amoledBlack: boolean;
  onToggleAmoled: () => void;
}

export const SamsungEdgePanel: React.FC<SamsungEdgePanelProps> = ({
  isOpen,
  onToggle,
  onClose,
  activeRoom,
  touchInputMode,
  onToggleTouchInputMode,
  onAddElectrical,
  onAddFurniture,
  onToggleTorch,
  isTorchActive,
  onOpenDINModal,
  onOpenSamsungInstall,
  onSaveNow,
  onOpenRoomManager,
  amoledBlack,
  onToggleAmoled,
}) => {
  const [activeTab, setActiveTab] = useState<'quick_add' | 'spen' | 'tools'>('quick_add');
  const [insertedFeedback, setInsertedFeedback] = useState<string | null>(null);

  const handleQuickAddElectrical = (type: string, name: string, power: number, heightCm: number) => {
    triggerSamsungHaptic('medium');
    soundSynth.playConfirmation();

    if (onAddElectrical) {
      onAddElectrical({
        type: type as any,
        name: `${name} (${activeRoom.name})`,
        powerWatts: power,
        heightFromFloorCm: heightCm,
        state: true,
        wallSnapped: type === 'light_ceiling' ? 'ceiling' : 'north',
        position: {
          x: (Math.random() - 0.5) * (activeRoom.width * 0.6),
          y: heightCm / 100,
          z: (Math.random() - 0.5) * (activeRoom.length * 0.6),
        },
      });
    }

    setInsertedFeedback(`${name} eingefügt!`);
    setTimeout(() => setInsertedFeedback(null), 2000);
  };

  const handleQuickAddFurniture = (type: string, name: string, w: number, d: number, h: number, color: string) => {
    triggerSamsungHaptic('medium');
    soundSynth.playConfirmation();

    if (onAddFurniture) {
      onAddFurniture({
        type: type as any,
        name: `${name} (${activeRoom.name})`,
        dimensions: { width: w, depth: d, height: h },
        color,
        rotation: 0,
        position: {
          x: (Math.random() - 0.5) * (activeRoom.width * 0.5),
          y: h / 2,
          z: (Math.random() - 0.5) * (activeRoom.length * 0.5),
        },
      });
    }

    setInsertedFeedback(`${name} platziert!`);
    setTimeout(() => setInsertedFeedback(null), 2000);
  };

  return (
    <>
      {/* SAMSUNG EDGE PANEL PULL-HANDLE (Semi-transparent handle on right edge) */}
      <div 
        className={`fixed right-0 top-1/3 -translate-y-1/2 z-40 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        <button
          onClick={() => {
            triggerSamsungHaptic('selection');
            onToggle();
          }}
          className="group relative flex items-center justify-center w-4 sm:w-5 h-20 rounded-l-2xl bg-gradient-to-b from-sky-400/80 via-blue-500/80 to-indigo-600/80 hover:from-sky-400 hover:to-indigo-500 backdrop-blur-md shadow-lg shadow-sky-950/60 border-y border-l border-white/40 cursor-pointer transition active:scale-95"
          title="Samsung Seiten-Paneel öffnen (Edge Panel)"
          aria-label="Samsung Edge Panel"
        >
          <div className="w-1 h-6 rounded-full bg-white/80 group-hover:bg-white" />
          <span className="sr-only">Seiten-Paneel öffnen</span>
        </button>
      </div>

      {/* BACKDROP OVERLAY */}
      {isOpen && (
        <div 
          onClick={() => {
            triggerSamsungHaptic('light');
            onClose();
          }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity"
        />
      )}

      {/* SAMSUNG EDGE DRAWER */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 sm:w-80 ${
          amoledBlack ? 'bg-black border-slate-900' : 'bg-slate-900/95 border-slate-800'
        } backdrop-blur-xl border-l shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
                Samsung Seiten-Paneel
              </h3>
              <p className="text-[11px] text-slate-400">
                Galaxy Edge Werkzeuge & CAD
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerSamsungHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/60 border-b border-slate-800/60 text-xs shrink-0">
          <button
            onClick={() => {
              triggerSamsungHaptic('light');
              setActiveTab('quick_add');
            }}
            className={`py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition ${
              activeTab === 'quick_add' 
                ? 'bg-sky-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Elemente</span>
          </button>
          <button
            onClick={() => {
              triggerSamsungHaptic('light');
              setActiveTab('spen');
            }}
            className={`py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition ${
              activeTab === 'spen' 
                ? 'bg-sky-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>S-Pen</span>
          </button>
          <button
            onClick={() => {
              triggerSamsungHaptic('light');
              setActiveTab('tools');
            }}
            className={`py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition ${
              activeTab === 'tools' 
                ? 'bg-sky-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flashlight className="w-3.5 h-3.5" />
            <span>Tools</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {insertedFeedback && (
          <div className="mx-3 mt-3 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{insertedFeedback}</span>
          </div>
        )}

        {/* Tab Contents (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* TAB 1: QUICK ADD (ELEKTRO & MÖBEL) */}
          {activeTab === 'quick_add' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Elektro Schnell-Platzierung
                  </span>
                  <span className="text-[10px] text-slate-500">{activeRoom.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleQuickAddElectrical('socket_double', 'Schuko-Doppelsteckdose', 150, 30)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex flex-col gap-1 active:scale-95"
                  >
                    <span className="font-bold text-white flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Doppelsteckdose
                    </span>
                    <span className="text-[10px] text-slate-400">H: 30cm • 230V DIN</span>
                  </button>

                  <button
                    onClick={() => handleQuickAddElectrical('switch_series', 'Serienschalter (2-fach)', 0, 105)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex flex-col gap-1 active:scale-95"
                  >
                    <span className="font-bold text-white flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      Serienschalter
                    </span>
                    <span className="text-[10px] text-slate-400">H: 105cm • Türzone</span>
                  </button>

                  <button
                    onClick={() => handleQuickAddElectrical('light_ceiling', 'LED Deckenleuchte', 35, 260)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex flex-col gap-1 active:scale-95"
                  >
                    <span className="font-bold text-white flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-300" />
                      LED Decke
                    </span>
                    <span className="text-[10px] text-slate-400">Zentral • 35W</span>
                  </button>

                  <button
                    onClick={() => handleQuickAddElectrical('room_thermostat', 'Smart Thermostat', 5, 130)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex flex-col gap-1 active:scale-95"
                  >
                    <span className="font-bold text-white flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Thermostat
                    </span>
                    <span className="text-[10px] text-slate-400">H: 130cm • Digital</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Box className="w-3.5 h-3.5 text-sky-400" />
                  Möbel Schnell-Platzierung
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleQuickAddFurniture('sofa', 'Eck-Sofa Modern', 2.4, 1.6, 0.85, '#334155')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex flex-col gap-1 active:scale-95"
                  >
                    <span className="font-bold text-white">Sofa</span>
                    <span className="text-[10px] text-slate-400">2.4m x 1.6m</span>
                  </button>

                  <button
                    onClick={() => handleQuickAddFurniture('table', 'Esstisch Eiche', 1.6, 0.9, 0.76, '#78350f')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex flex-col gap-1 active:scale-95"
                  >
                    <span className="font-bold text-white">Esstisch</span>
                    <span className="text-[10px] text-slate-400">1.6m x 0.9m</span>
                  </button>

                  <button
                    onClick={() => handleQuickAddFurniture('desk', 'Arbeitstisch', 1.4, 0.7, 0.74, '#1e293b')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex flex-col gap-1 active:scale-95"
                  >
                    <span className="font-bold text-white">Schreibtisch</span>
                    <span className="text-[10px] text-slate-400">1.4m x 0.7m</span>
                  </button>

                  <button
                    onClick={() => handleQuickAddFurniture('wardrobe', 'Kleiderschrank 3-türig', 1.8, 0.6, 2.2, '#0f172a')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex flex-col gap-1 active:scale-95"
                  >
                    <span className="font-bold text-white">Schrank</span>
                    <span className="text-[10px] text-slate-400">1.8m x 2.2m</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAMSUNG S-PEN WORKFLOW */}
          {activeTab === 'spen' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-sky-950/60 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Samsung S-Pen Status</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    touchInputMode === 'pencil' 
                      ? 'bg-sky-500 text-slate-950' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {touchInputMode === 'pencil' ? 'S-Pen Aktiv' : 'Finger-Touch'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Im S-Pen Modus können Sie Leitungen, Installationszonen und Bemaßungen mit Sub-Millimeter-Genauigkeit millimetergenau zeichnen. Handflächenberührungen (Palm Rejection) werden ignoriert.
                </p>
                <button
                  onClick={() => {
                    const next = touchInputMode === 'pencil' ? 'touch' : 'pencil';
                    triggerSamsungHaptic('medium');
                    onToggleTouchInputMode(next);
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                    touchInputMode === 'pencil'
                      ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{touchInputMode === 'pencil' ? 'Zu Finger-Orbit wechseln' : 'S-Pen Präzisionsmodus aktivieren'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-300 block">S-Pen Gesten in VoltCAD:</span>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span><strong>Spitze antippen:</strong> Element anwählen / platzieren</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span><strong>Ziehen:</strong> Leitung nach DIN 18015 verlegen</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span><strong>S-Pen Taste:</strong> Kontextmenü / Drehung 45°</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: SAMSUNG TOOLS & UTILITIES */}
          {activeTab === 'tools' && (
            <div className="space-y-3">
              {/* Screen Flashlight Torch */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flashlight className={`w-4 h-4 ${isTorchActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white">Baustellen-Leuchte (Torch)</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isTorchActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isTorchActive ? 'AN' : 'AUS'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Schaltet einen blendfreien High-CRI Weißbildschirm zur Beleuchtung dunkler Zählerkästen oder Installationsschächte ein.
                </p>
                <button
                  onClick={() => {
                    triggerSamsungHaptic('heavy');
                    onToggleTorch();
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                    isTorchActive
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                  }`}
                >
                  <Flashlight className="w-3.5 h-3.5" />
                  <span>{isTorchActive ? 'Leuchte ausschalten' : 'Screen Torch aktivieren'}</span>
                </button>
              </div>

              {/* AMOLED Pure Black Toggle */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">AMOLED Pure Black</span>
                  <span className="text-[10px] text-slate-400 block">Echtes Schwarz (#000000) für Galaxy Akkusparmodus</span>
                </div>
                <button
                  onClick={() => {
                    triggerSamsungHaptic('light');
                    onToggleAmoled();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    amoledBlack ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {amoledBlack ? 'Aktiv' : 'Aus'}
                </button>
              </div>

              {/* Samsung APK & Galaxy Install */}
              <button
                onClick={() => {
                  triggerSamsungHaptic('medium');
                  onClose();
                  onOpenSamsungInstall();
                }}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 hover:from-sky-900/60 hover:to-indigo-900/60 border border-sky-500/40 text-left transition flex items-center justify-between active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Samsung APK & DeX Guide</span>
                    <span className="text-[10px] text-sky-300 block">Galaxy Installation & APK Download</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-400" />
              </button>

              {/* DIN 18015 Quick Calculator */}
              {onOpenDINModal && (
                <button
                  onClick={() => {
                    triggerSamsungHaptic('light');
                    onClose();
                    onOpenDINModal();
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-left transition flex items-center justify-between active:scale-95"
                >
                  <div className="flex items-center gap-2.5">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">DIN 18015 Mindestausstattung</span>
                      <span className="text-[10px] text-slate-400 block">Raum-Prüfung & Stückliste</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Room Manager Shortcut */}
              <button
                onClick={() => {
                  triggerSamsungHaptic('light');
                  onClose();
                  onOpenRoomManager();
                }}
                className="w-full p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-left transition flex items-center justify-between active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Zimmer & Räume verwalten</span>
                    <span className="text-[10px] text-slate-400 block">Mehrraum-Anbau & Maße</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Quick Action */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
          <button
            onClick={() => {
              triggerSamsungHaptic('success');
              onSaveNow();
              setInsertedFeedback('Projekt sofort lokal & in Cloud gespeichert!');
              setTimeout(() => setInsertedFeedback(null), 2500);
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-sky-600/20 active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Projekt schnell sichern</span>
          </button>
        </div>
      </aside>
    </>
  );
};

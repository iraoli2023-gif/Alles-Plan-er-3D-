import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Zap, 
  Cpu, 
  Network, 
  MoreHorizontal, 
  Activity, 
  Bot, 
  Sun, 
  FileText, 
  ShieldCheck, 
  Layers, 
  Search, 
  Sliders, 
  PenTool, 
  RotateCcw, 
  Smartphone, 
  Monitor, 
  Wifi, 
  Battery, 
  Volume2, 
  Save, 
  Sparkles,
  ChevronDown,
  X,
  Plus,
  Tablet
} from 'lucide-react';
import { ActiveAppView, RoomConfig, ElectricalElement, FurnitureItem } from '../types';
import { SamsungEdgePanel } from './SamsungEdgePanel';
import { SamsungTaskSwitcher } from './SamsungTaskSwitcher';
import { SamsungQuickPanel } from './SamsungQuickPanel';
import { triggerSamsungHaptic } from '../utils/samsungHaptics';
import { soundSynth } from '../utils/audioSynth';

interface SamsungMobileShellProps {
  children: React.ReactNode;
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  activeRoom: RoomConfig;
  rooms: RoomConfig[];
  onSelectRoom: (roomId: string) => void;
  onOpenRoomManager: () => void;
  onOpenCommandPalette: () => void;
  onOpenDesktopModal: () => void;
  onOpenExportModal: () => void;
  onOpenBackupModal: () => void;
  onOpenResetModal: () => void;
  onOpenSamsungInstall: () => void;
  onSwitchToWindowsMode: () => void;
  onSwitchToIOSTablet?: () => void;
  touchInputMode: 'touch' | 'pencil';
  onToggleTouchInputMode: (mode: 'touch' | 'pencil') => void;
  onAddElectrical?: (element: Partial<ElectricalElement>) => void;
  onAddFurniture?: (item: Partial<FurnitureItem>) => void;
  onSaveNow: () => void;
  isSaving: boolean;
  currentWatts: number;
  amoledBlack: boolean;
  onToggleAmoled: () => void;
}

export const SamsungMobileShell: React.FC<SamsungMobileShellProps> = ({
  children,
  activeView,
  onSelectView,
  activeRoom,
  rooms,
  onSelectRoom,
  onOpenRoomManager,
  onOpenCommandPalette,
  onOpenDesktopModal,
  onOpenExportModal,
  onOpenBackupModal,
  onOpenResetModal,
  onOpenSamsungInstall,
  onSwitchToWindowsMode,
  onSwitchToIOSTablet,
  touchInputMode,
  onToggleTouchInputMode,
  onAddElectrical,
  onAddFurniture,
  onSaveNow,
  isSaving,
  currentWatts,
  amoledBlack,
  onToggleAmoled,
}) => {
  // Mobile UI States
  const [isEdgePanelOpen, setIsEdgePanelOpen] = useState(false);
  const [isTaskSwitcherOpen, setIsTaskSwitcherOpen] = useState(false);
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [isTorchActive, setIsTorchActive] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [highRefreshRate, setHighRefreshRate] = useState(true);
  const [navBarType, setNavBarType] = useState<'3buttons' | 'gestures'>('3buttons');

  // Clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  // Listen to physical pointer events for S-Pen detection
  const [isPenDetected, setIsPenDetected] = useState(false);
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'pen') {
        setIsPenDetected(true);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // Back button handler (One UI standard)
  const handlePhysicalBack = () => {
    triggerSamsungHaptic('light');
    if (isTorchActive) {
      setIsTorchActive(false);
      return;
    }
    if (isQuickPanelOpen) {
      setIsQuickPanelOpen(false);
      return;
    }
    if (isEdgePanelOpen) {
      setIsEdgePanelOpen(false);
      return;
    }
    if (isMoreSheetOpen) {
      setIsMoreSheetOpen(false);
      return;
    }
    if (isRoomDropdownOpen) {
      setIsRoomDropdownOpen(false);
      return;
    }
    if (isTaskSwitcherOpen) {
      setIsTaskSwitcherOpen(false);
      return;
    }
    if (activeView !== '3d_cad') {
      onSelectView('3d_cad');
    }
  };

  const primaryNavItems: { id: ActiveAppView; label: string; icon: any; color: string }[] = [
    { id: '3d_cad', label: '3D CAD', icon: Box, color: 'text-sky-400' },
    { id: 'electrical_planner', label: 'Elektro', icon: Zap, color: 'text-amber-400' },
    { id: 'distribution_board', label: 'UV Schrank', icon: Cpu, color: 'text-indigo-400' },
    { id: 'smart_home', label: 'Smart Home', icon: Network, color: 'text-emerald-400' },
  ];

  const viewTitles: Record<ActiveAppView, string> = {
    '3d_cad': '3D CAD Raum & Möbel',
    'electrical_planner': 'Elektro- & Verlegepläne',
    'distribution_board': 'Verteilerschrank & UV',
    'smart_home': 'Smart Home Logik-Editor',
    'energy_realtime': 'Echtzeit-Energiemonitor',
    'ai_auditor': 'KI DIN 18015 Auditor',
    'terrarium': 'Terrarium-Klimasteuerung',
  };

  return (
    <div 
      className={`w-full h-full flex flex-col justify-between overflow-hidden select-none font-sans relative ${
        amoledBlack ? 'bg-black text-white' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* 1. SAMSUNG ONE UI TOP STATUS BAR */}
      <header className="w-full shrink-0 pt-1.5 px-3.5 pb-1 flex items-center justify-between text-xs z-30 border-b border-white/5">
        {/* Left: Clock */}
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-[11px] text-slate-200">
            {timeString}
          </span>
          {isPenDetected && (
            <span className="flex items-center gap-1 text-[10px] text-sky-400 font-bold bg-sky-950/80 px-1.5 py-0.2 rounded-full border border-sky-800/60">
              <PenTool className="w-2.5 h-2.5" />
              <span>S-Pen</span>
            </span>
          )}
        </div>

        {/* Right: Samsung Status Icons (VoLTE, 5G, Wi-Fi, Battery) */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
          <span className="text-[10px] font-bold tracking-widest text-slate-400">5G</span>
          <Wifi className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-mono font-bold">98%</span>
            <div className="w-4 h-2 rounded-[3px] border border-slate-300 p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
            </div>
          </div>
        </div>
      </header>

      {/* 2. SAMSUNG ONE UI APP HEADER & ROOM BAR */}
      <div className="w-full shrink-0 px-3 py-1.5 flex items-center justify-between gap-2 z-30 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/70">
        {/* Active View & Room Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5">
              <span>{viewTitles[activeView]}</span>
            </h1>

            {/* Room Selector Pill */}
            <div className="relative mt-0.5">
              <button
                onClick={() => {
                  triggerSamsungHaptic('selection');
                  setIsRoomDropdownOpen(!isRoomDropdownOpen);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-sky-300 border border-slate-700/80 transition"
              >
                <span className="truncate max-w-[120px] sm:max-w-[180px]">{activeRoom.name}</span>
                <ChevronDown className="w-3 h-3 text-sky-400 shrink-0" />
              </button>

              {/* Room Dropdown Menu */}
              {isRoomDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 text-xs space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Räume im Projekt ({rooms.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {rooms.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          triggerSamsungHaptic('light');
                          onSelectRoom(r.id);
                          setIsRoomDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-xl font-medium flex items-center justify-between transition ${
                          r.id === activeRoom.id
                            ? 'bg-sky-500 text-slate-950 font-bold'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{r.name}</span>
                        <span className="text-[10px] opacity-80 font-mono">
                          {(r.width * r.length).toFixed(0)}m²
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setIsRoomDropdownOpen(false);
                      onOpenRoomManager();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-[11px] flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Raum-Manager & Anbau</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Quick Controls: S-Pen, Quick Panel, Command Palette, Windows Switch */}
        <div className="flex items-center gap-1 shrink-0">
          {/* S-Pen Precision Toggle */}
          <button
            onClick={() => {
              const next = touchInputMode === 'pencil' ? 'touch' : 'pencil';
              triggerSamsungHaptic('medium');
              onToggleTouchInputMode(next);
            }}
            className={`p-1.5 rounded-xl border transition ${
              touchInputMode === 'pencil'
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
            title="S-Pen Präzisionsmodus umschalten"
            aria-label="S-Pen Modus"
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>

          {/* Quick Panel Toggle */}
          <button
            onClick={() => {
              triggerSamsungHaptic('light');
              setIsQuickPanelOpen(true);
            }}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Samsung One UI Quick Panel öffnen"
            aria-label="Quick Panel"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Command Palette Search */}
          <button
            onClick={() => {
              triggerSamsungHaptic('light');
              onOpenCommandPalette();
            }}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Schnellsuche (Befehle)"
            aria-label="Suche"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Switch to iPadOS Tablett Mode */}
          {onSwitchToIOSTablet && (
            <button
              onClick={() => {
                triggerSamsungHaptic('medium');
                onSwitchToIOSTablet();
              }}
              className="px-2 py-1 rounded-xl bg-gradient-to-r from-slate-900 to-sky-950 border border-sky-400/40 text-[10px] font-bold text-sky-300 hover:text-white flex items-center gap-1 transition"
              title="Zu Apple iPad Tablett-Version wechseln"
            >
              <Tablet className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">iPad</span>
            </button>
          )}

          {/* Switch back to Windows 11 Desktop Mode */}
          <button
            onClick={() => {
              triggerSamsungHaptic('medium');
              onSwitchToWindowsMode();
            }}
            className="px-2 py-1 rounded-xl bg-gradient-to-r from-sky-950 to-indigo-950 border border-sky-500/40 text-[10px] font-bold text-sky-300 hover:text-white flex items-center gap-1 transition"
            title="Zu Windows 11 Desktop-Ansicht wechseln"
          >
            <Monitor className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">Windows 11</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE VIEWPORT (Takes all available space) */}
      <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col justify-center">
        {children}

        {/* Samsung Edge Panel Handle & Drawer */}
        <SamsungEdgePanel
          isOpen={isEdgePanelOpen}
          onToggle={() => setIsEdgePanelOpen(!isEdgePanelOpen)}
          onClose={() => setIsEdgePanelOpen(false)}
          activeRoom={activeRoom}
          touchInputMode={touchInputMode}
          onToggleTouchInputMode={onToggleTouchInputMode}
          onAddElectrical={onAddElectrical}
          onAddFurniture={onAddFurniture}
          onToggleTorch={() => setIsTorchActive(!isTorchActive)}
          isTorchActive={isTorchActive}
          onOpenDINModal={onOpenExportModal}
          onOpenSamsungInstall={onOpenSamsungInstall}
          onSaveNow={onSaveNow}
          onOpenRoomManager={onOpenRoomManager}
          amoledBlack={amoledBlack}
          onToggleAmoled={onToggleAmoled}
        />

        {/* BAUSTELLEN-TASCHENLAMPE (Screen Torch) Full Screen High-CRI White */}
        {isTorchActive && (
          <div 
            onClick={() => setIsTorchActive(false)}
            className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-6 text-slate-950 select-none cursor-pointer"
          >
            <div className="text-center pt-8">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600 block">
                Samsung High-CRI Baustellen-Leuchte
              </span>
              <h2 className="text-2xl font-black mt-1">100% Display-Helligkeit</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Tippe irgendwo auf den Bildschirm, um die Leuchte auszuschalten.
              </p>
            </div>
            <button
              onClick={() => setIsTorchActive(false)}
              className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-xl active:scale-95"
            >
              Leuchte ausschalten
            </button>
          </div>
        )}
      </main>

      {/* 4. SAMSUNG ONE UI BOTTOM NAVIGATION BAR */}
      <nav 
        className={`w-full shrink-0 px-2 py-1.5 z-30 border-t ${
          amoledBlack ? 'bg-black border-zinc-900' : 'bg-slate-900/90 border-slate-800'
        } backdrop-blur-xl flex items-center justify-around shadow-2xl`}
      >
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                triggerSamsungHaptic('selection');
                soundSynth.playConfirmation();
                onSelectView(item.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition cursor-pointer active:scale-90 ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-sky-400 scale-110' : 'text-slate-400'} transition-transform`} />
              <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-0.5" />
              )}
            </button>
          );
        })}

        {/* "Mehr" Button (Bottom Sheet Trigger) */}
        <button
          onClick={() => {
            triggerSamsungHaptic('selection');
            setIsMoreSheetOpen(true);
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition cursor-pointer active:scale-90 ${
            ['energy_realtime', 'ai_auditor', 'terrarium'].includes(activeView)
              ? 'bg-sky-500/15 text-sky-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] mt-0.5 leading-none">Mehr</span>
        </button>
      </nav>

      {/* 5. SAMSUNG 3-BUTTON NAVIGATION BAR (Recents, Home, Back) */}
      <footer 
        className={`w-full shrink-0 h-9 px-8 z-30 flex items-center justify-between ${
          amoledBlack ? 'bg-black' : 'bg-slate-950'
        } border-t border-white/5 select-none`}
      >
        {/* Recents ||| Button */}
        <button
          onClick={() => {
            triggerSamsungHaptic('medium');
            setIsTaskSwitcherOpen(true);
          }}
          className="p-2 text-slate-400 hover:text-white active:scale-75 transition cursor-pointer flex items-center justify-center"
          title="Samsung One UI App-Switcher (Recents)"
          aria-label="Kürzliche Apps"
        >
          <span className="text-base tracking-tighter font-mono font-bold leading-none select-none">
            |||
          </span>
        </button>

        {/* Home ⌂ Button */}
        <button
          onClick={() => {
            triggerSamsungHaptic('heavy');
            soundSynth.playConfirmation();
            onSelectView('3d_cad');
          }}
          className="p-2 text-slate-400 hover:text-white active:scale-75 transition cursor-pointer flex items-center justify-center"
          title="Startbildschirm (3D CAD)"
          aria-label="Home"
        >
          <div className="w-3.5 h-3.5 rounded-[4px] border-2 border-current" />
        </button>

        {/* Back < Button */}
        <button
          onClick={handlePhysicalBack}
          className="p-2 text-slate-400 hover:text-white active:scale-75 transition cursor-pointer flex items-center justify-center"
          title="Zurück"
          aria-label="Zurück"
        >
          <span className="text-base font-bold leading-none select-none">
            ‹
          </span>
        </button>
      </footer>

      {/* ONE UI "MEHR" BOTTOM SHEET */}
      {isMoreSheetOpen && (
        <div 
          onClick={() => setIsMoreSheetOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end p-2 sm:p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg mx-auto rounded-3xl ${
              amoledBlack ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-800'
            } border shadow-2xl p-4 space-y-3 animate-in slide-in-from-bottom-6`}
          >
            {/* Sheet Handle */}
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Weitere VoltCAD Module & Werkzeuge
              </h3>
              <button
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  onSelectView('ai_auditor');
                  setIsMoreSheetOpen(false);
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex items-center gap-2.5"
              >
                <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">KI DIN Auditor</span>
                  <span className="text-[10px] text-slate-400 block">Normenprüfung</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectView('energy_realtime');
                  setIsMoreSheetOpen(false);
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex items-center gap-2.5"
              >
                <Activity className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Energiemonitor</span>
                  <span className="text-[10px] text-slate-400 block">{currentWatts} W Echtzeit</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectView('terrarium');
                  setIsMoreSheetOpen(false);
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex items-center gap-2.5"
              >
                <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Terrarium Labor</span>
                  <span className="text-[10px] text-slate-400 block">IoT Klimaregler</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  onOpenExportModal();
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex items-center gap-2.5"
              >
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">DIN PDF Bericht</span>
                  <span className="text-[10px] text-slate-400 block">Baudokumentation</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  onOpenSamsungInstall();
                }}
                className="p-3 rounded-2xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/40 text-left transition flex items-center gap-2.5"
              >
                <Smartphone className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Samsung Galaxy APK</span>
                  <span className="text-[10px] text-sky-300 block">App-Installation & DeX</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  onOpenBackupModal();
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition flex items-center gap-2.5"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Cloud & Backup</span>
                  <span className="text-[10px] text-slate-400 block">Google Drive Sync</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAMSUNG ONE UI RECENTS APP SWITCHER MODAL */}
      <SamsungTaskSwitcher
        isOpen={isTaskSwitcherOpen}
        onClose={() => setIsTaskSwitcherOpen(false)}
        activeView={activeView}
        onSelectView={onSelectView}
        amoledBlack={amoledBlack}
      />

      {/* SAMSUNG ONE UI QUICK PANEL (SCHNELLEINSTELLUNGEN) */}
      <SamsungQuickPanel
        isOpen={isQuickPanelOpen}
        onClose={() => setIsQuickPanelOpen(false)}
        amoledBlack={amoledBlack}
        onToggleAmoled={onToggleAmoled}
        touchInputMode={touchInputMode}
        onToggleTouchInputMode={onToggleTouchInputMode}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={() => setHapticsEnabled(!hapticsEnabled)}
        highRefreshRate={highRefreshRate}
        onToggleHighRefreshRate={() => setHighRefreshRate(!highRefreshRate)}
        isTorchActive={isTorchActive}
        onToggleTorch={() => setIsTorchActive(!isTorchActive)}
        onOpenDINModal={onOpenExportModal}
        onOpenDesktopModal={onOpenDesktopModal}
        onOpenSamsungInstall={onOpenSamsungInstall}
      />
    </div>
  );
};

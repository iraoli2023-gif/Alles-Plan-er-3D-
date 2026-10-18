import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Zap, 
  Cpu, 
  Network, 
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
  Tablet, 
  Maximize2, 
  Info,
  Download,
  Share2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Volume2,
  Wifi,
  Battery,
  SlidersHorizontal
} from 'lucide-react';
import { ActiveAppView, RoomConfig } from '../types';
import { soundSynth } from '../utils/audioSynth';

interface IPadOSShellProps {
  children: React.ReactNode;
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  activeRoom: RoomConfig;
  allRooms: RoomConfig[];
  onSelectRoom?: (roomId: string) => void;
  onOpenRoomManager?: () => void;
  onOpenIOSInstall: () => void;
  onSwitchToWindows: () => void;
  onSwitchToSamsung: () => void;
  onOpenResetModal: () => void;
}

export const IPadOSShell: React.FC<IPadOSShellProps> = ({
  children,
  activeView,
  onSelectView,
  activeRoom,
  allRooms,
  onSelectRoom,
  onOpenRoomManager,
  onOpenIOSInstall,
  onSwitchToWindows,
  onSwitchToSamsung,
  onOpenResetModal,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  const [currentDate, setCurrentDate] = useState<string>('Mo., 18. Okt.');
  const [applePencilMode, setApplePencilMode] = useState<'touch' | 'pencil_precision'>('touch');
  const [pencilBattery, setPencilBattery] = useState<number>(98);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showMultitaskingMenu, setShowMultitaskingMenu] = useState(false);
  const [stageManagerLayout, setStageManagerLayout] = useState<'fullscreen' | 'split_view' | 'slide_over'>('fullscreen');
  const [pencilTipPressed, setPencilTipPressed] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (view: ActiveAppView) => {
    soundSynth.playConfirmation();
    onSelectView(view);
  };

  const handleTogglePencil = () => {
    soundSynth.playClick();
    setApplePencilMode(prev => prev === 'touch' ? 'pencil_precision' : 'touch');
  };

  const viewLabels: Record<ActiveAppView, string> = {
    '3d_cad': '3D CAD Raumansicht',
    'electrical_planner': 'DIN 18015 Elektroplaner',
    'distribution_board': 'Stromkreisverteiler UV-1',
    'smart_home': 'Smart Home Automation',
    'energy_realtime': 'Energie & Lastmanagement',
    'terrarium': 'Terrarium Steuerzentrale',
    'ai_auditor': 'DIN 18015 KI-Auditor',
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden relative font-sans">
      
      {/* 1. iPadOS Top Status Bar */}
      <div className="h-7 w-full px-5 flex items-center justify-between text-xs text-white/90 bg-slate-950/80 backdrop-blur-md z-40 border-b border-white/5 shrink-0">
        {/* Left: Time & Date */}
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-[13px]">{currentTime}</span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">{currentDate}</span>
        </div>

        {/* Center: iPad Multitasking 3-Dots Pill */}
        <div className="relative">
          <button
            onClick={() => setShowMultitaskingMenu(!showMultitaskingMenu)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition active:scale-95"
            title="iPadOS Multitasking (Split View / Slide Over)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
          </button>

          {/* Multitasking Dropdown */}
          {showMultitaskingMenu && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                iPadOS Multitasking Modus
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setStageManagerLayout('fullscreen');
                    setShowMultitaskingMenu(false);
                    soundSynth.playConfirmation();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                    stageManagerLayout === 'fullscreen' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Vollbild (ProMotion 120Hz)</span>
                  {stageManagerLayout === 'fullscreen' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
                <button
                  onClick={() => {
                    setStageManagerLayout('split_view');
                    setShowMultitaskingMenu(false);
                    soundSynth.playConfirmation();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                    stageManagerLayout === 'split_view' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Split View (50 / 50 CAD & DIN)</span>
                  {stageManagerLayout === 'split_view' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
                <button
                  onClick={() => {
                    setStageManagerLayout('slide_over');
                    setShowMultitaskingMenu(false);
                    soundSynth.playConfirmation();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                    stageManagerLayout === 'slide_over' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Slide Over (Schwebendes Fenster)</span>
                  {stageManagerLayout === 'slide_over' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Apple Pencil, Wi-Fi, Battery */}
        <div className="flex items-center gap-3">
          {/* Apple Pencil Pro Status Badge */}
          <button
            onClick={handleTogglePencil}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold transition ${
              applePencilMode === 'pencil_precision'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-bold'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            }`}
            title="Apple Pencil Modus umschalten"
          >
            <PenTool className="w-2.5 h-2.5" />
            <span className="hidden sm:inline"> Pencil</span>
            <span>{pencilBattery}%</span>
          </button>

          <Wifi className="w-3.5 h-3.5 text-slate-300" />

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono">100%</span>
            <div className="w-5 h-2.5 rounded-sm border border-slate-300 p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-2xs" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Apple iPadOS Navigation Bar (Frosted Glass Vibrancy) */}
      <div className="px-4 py-2.5 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex flex-wrap items-center justify-between gap-3 z-30 shrink-0">
        
        {/* Left: Brand & Room Picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white tracking-wide">VoltCAD 3D Pro</span>
                <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono font-bold">
                  iPadOS
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {viewLabels[activeView]}
              </div>
            </div>
          </div>

          {/* Room Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoomDropdown(!showRoomDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-xs text-sky-300 font-medium transition shadow-sm"
            >
              <Box className="w-3.5 h-3.5 text-sky-400" />
              <span className="max-w-[130px] truncate">{activeRoom.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoomDropdown && (
              <div className="absolute top-9 left-0 w-60 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                  Aktiver Raum ({allRooms.length})
                </span>
                <div className="space-y-1">
                  {allRooms.map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (onSelectRoom) onSelectRoom(r.id);
                        setShowRoomDropdown(false);
                        soundSynth.playConfirmation();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                        r.id === activeRoom.id ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{r.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{(r.width * r.length).toFixed(1)}m²</span>
                    </button>
                  ))}
                  {onOpenRoomManager && (
                    <button
                      onClick={() => {
                        onOpenRoomManager();
                        setShowRoomDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-sky-400 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800/80 mt-1 pt-2 font-semibold"
                    >
                      <span>Räume verwalten...</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Apple Pencil, App Laden & Platform Switchers */}
        <div className="flex items-center gap-2">
          {/* Apple Pencil Mode Switcher */}
          <button
            onClick={handleTogglePencil}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
              applePencilMode === 'pencil_precision'
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Präzisionsmodus für Apple Pencil 2 & Apple Pencil Pro"
          >
            <PenTool className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Pencil Präzision:</span>
            <span>{applePencilMode === 'pencil_precision' ? 'Aktiv' : 'Touch'}</span>
          </button>

          {/* iPad App Download Button */}
          <button
            onClick={onOpenIOSInstall}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition active:scale-95"
            title="iPad-App (.mobileconfig oder Xcode ZIP) herunterladen"
          >
            <Download className="w-3.5 h-3.5" />
            <span>App laden</span>
          </button>

          {/* Switch to Windows or Samsung */}
          <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80 text-xs">
            <button
              onClick={onSwitchToWindows}
              className="px-2 py-1 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1"
              title="Zur Windows 11 Desktop-Version wechseln"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Windows</span>
            </button>
            <button
              onClick={onSwitchToSamsung}
              className="px-2 py-1 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1"
              title="Zur Samsung Galaxy Mobil-Version wechseln"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Samsung</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. Main CAD Content Viewport */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {children}

        {/* Apple Pencil Precision Indicator Banner (Subtle floating pill when in pencil mode) */}
        {applePencilMode === 'pencil_precision' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-sky-500/40 text-[11px] text-sky-300 font-medium flex items-center gap-1.5 shadow-lg">
              <PenTool className="w-3 h-3 text-sky-400 animate-pulse" />
              <span>Apple Pencil Modus: 0.1mm Fangradius & Druckstufen aktiv</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. iPadOS Floating Dock at Bottom */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[95vw]">
        <div className="p-2 rounded-2xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl flex items-center gap-2">
          
          {/* Dock Icon: 3D CAD */}
          <button
            onClick={() => handleNavClick('3d_cad')}
            className={`p-2.5 rounded-xl transition flex flex-col items-center relative group active:scale-95 ${
              activeView === '3d_cad'
                ? 'bg-gradient-to-tr from-sky-600 to-blue-500 text-white shadow-lg shadow-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="3D CAD Raumansicht"
          >
            <Box className="w-5 h-5" />
            {activeView === '3d_cad' && (
              <span className="w-1 h-1 rounded-full bg-white absolute -bottom-1" />
            )}
          </button>

          {/* Dock Icon: DIN 18015 Elektroplaner */}
          <button
            onClick={() => handleNavClick('electrical_planner')}
            className={`p-2.5 rounded-xl transition flex flex-col items-center relative group active:scale-95 ${
              activeView === 'electrical_planner'
                ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="DIN 18015 Elektroplanung & Wandtrassen"
          >
            <Zap className="w-5 h-5" />
            {activeView === 'electrical_planner' && (
              <span className="w-1 h-1 rounded-full bg-white absolute -bottom-1" />
            )}
          </button>

          {/* Dock Icon: Stromkreisverteiler */}
          <button
            onClick={() => handleNavClick('distribution_board')}
            className={`p-2.5 rounded-xl transition flex flex-col items-center relative group active:scale-95 ${
              activeView === 'distribution_board'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Schaltschrank & Stromkreisverteiler"
          >
            <Cpu className="w-5 h-5" />
            {activeView === 'distribution_board' && (
              <span className="w-1 h-1 rounded-full bg-white absolute -bottom-1" />
            )}
          </button>

          {/* Dock Icon: Smart Home */}
          <button
            onClick={() => handleNavClick('smart_home')}
            className={`p-2.5 rounded-xl transition flex flex-col items-center relative group active:scale-95 ${
              activeView === 'smart_home'
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Smart Home Steuerung"
          >
            <Network className="w-5 h-5" />
            {activeView === 'smart_home' && (
              <span className="w-1 h-1 rounded-full bg-white absolute -bottom-1" />
            )}
          </button>

          {/* Dock Divider */}
          <div className="w-px h-6 bg-white/15 mx-1" />

          {/* Dock Icon: Energie & Lastmanagement */}
          <button
            onClick={() => handleNavClick('energy_realtime')}
            className={`p-2.5 rounded-xl transition flex flex-col items-center relative group active:scale-95 ${
              activeView === 'energy_realtime'
                ? 'bg-gradient-to-tr from-lime-600 to-emerald-500 text-slate-950 shadow-lg font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Energie & Lastmanagement"
          >
            <Sun className="w-5 h-5" />
            {activeView === 'energy_realtime' && (
              <span className="w-1 h-1 rounded-full bg-white absolute -bottom-1" />
            )}
          </button>

          {/* Dock Icon: Terrarium */}
          <button
            onClick={() => handleNavClick('terrarium')}
            className={`p-2.5 rounded-xl transition flex flex-col items-center relative group active:scale-95 ${
              activeView === 'terrarium'
                ? 'bg-gradient-to-tr from-emerald-600 to-cyan-500 text-slate-950 shadow-lg font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Terrarium Steuerzentrale"
          >
            <Activity className="w-5 h-5" />
            {activeView === 'terrarium' && (
              <span className="w-1 h-1 rounded-full bg-white absolute -bottom-1" />
            )}
          </button>

          {/* Dock Icon: KI-Auditor */}
          <button
            onClick={() => handleNavClick('ai_auditor')}
            className={`p-2.5 rounded-xl transition flex flex-col items-center relative group active:scale-95 ${
              activeView === 'ai_auditor'
                ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="DIN 18015 KI-Auditor"
          >
            <Bot className="w-5 h-5" />
            {activeView === 'ai_auditor' && (
              <span className="w-1 h-1 rounded-full bg-white absolute -bottom-1" />
            )}
          </button>

          {/* Dock Icon: App Laden */}
          <button
            onClick={onOpenIOSInstall}
            className="p-2.5 rounded-xl text-sky-400 hover:text-white hover:bg-sky-500/20 transition flex flex-col items-center active:scale-95"
            title="iPad App herunterladen"
          >
            <Download className="w-5 h-5" />
          </button>

        </div>
      </div>

      {/* 5. Apple Home Indicator Bar (Swipe gesture indicator) */}
      <div className="h-4 w-full flex items-center justify-center bg-slate-950 shrink-0 relative z-30">
        <div className="w-36 h-1 bg-white/30 rounded-full" />
      </div>

    </div>
  );
};

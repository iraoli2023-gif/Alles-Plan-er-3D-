import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Zap, 
  Cpu, 
  Network, 
  Sun, 
  Activity, 
  Bot, 
  Search, 
  Layers, 
  Wifi, 
  Volume2, 
  VolumeX, 
  BatteryCharging, 
  Bell, 
  PenTool, 
  Hand, 
  HardDrive, 
  Smartphone,
  RotateCcw,
  Tablet
} from 'lucide-react';
import { ActiveAppView } from '../types';

interface WindowsTaskbarProps {
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  isStartMenuOpen: boolean;
  onToggleStartMenu: () => void;
  onOpenCommandPalette: () => void;
  isQuickSettingsOpen: boolean;
  onToggleQuickSettings: () => void;
  isCalendarOpen: boolean;
  onToggleCalendar: () => void;
  touchInputMode: 'touch' | 'pencil';
  onToggleTouchInputMode: (mode: 'touch' | 'pencil') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentWatts: number;
  autoSaveEnabled: boolean;
  isSaving: boolean;
  onOpenBackupModal: () => void;
  onOpenExportModal: () => void;
  onOpenResetModal: () => void;
  onSwitchToSamsungMobile?: () => void;
  onSwitchToIOSTablet?: () => void;
}

export const WindowsTaskbar: React.FC<WindowsTaskbarProps> = ({
  activeView,
  onSelectView,
  isStartMenuOpen,
  onToggleStartMenu,
  onOpenCommandPalette,
  isQuickSettingsOpen,
  onToggleQuickSettings,
  isCalendarOpen,
  onToggleCalendar,
  touchInputMode,
  onToggleTouchInputMode,
  soundEnabled,
  onToggleSound,
  currentWatts,
  autoSaveEnabled,
  isSaving,
  onOpenBackupModal,
  onOpenExportModal,
  onOpenResetModal,
  onSwitchToSamsungMobile,
  onSwitchToIOSTablet,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const taskbarApps = [
    {
      id: '3d_cad',
      name: '3D CAD Wohnung & Möbel',
      icon: Box,
      accent: 'text-sky-400',
    },
    {
      id: 'electrical_planner',
      name: 'Elektro- & Verlegepläne (DIN 18015)',
      icon: Zap,
      accent: 'text-amber-400',
    },
    {
      id: 'distribution_board',
      name: 'Verteilerschrank & UV (Hutschiene)',
      icon: Cpu,
      accent: 'text-indigo-400',
    },
    {
      id: 'smart_home',
      name: 'Smart Home Logik-Editor',
      icon: Network,
      accent: 'text-emerald-400',
    },
    {
      id: 'terrarium',
      name: 'Terrarium Steuerung',
      icon: Sun,
      accent: 'text-lime-400',
    },
    {
      id: 'energy_realtime',
      name: 'Echtzeit-Energieverbrauch',
      icon: Activity,
      accent: 'text-cyan-400',
    },
    {
      id: 'ai_auditor',
      name: 'KI-Auditor (DIN 18015)',
      icon: Bot,
      accent: 'text-rose-400',
    },
  ];

  return (
    <footer className="h-12 bg-slate-900/90 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between px-2 select-none text-slate-200 z-40 fixed bottom-0 left-0 right-0 shadow-2xl">
      {/* LEFT: Windows Widgets / Status info */}
      <div className="flex items-center gap-2 min-w-[140px] hidden md:flex">
        {/* Windows Widgets Mini Tile */}
        <div 
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer text-xs group"
          title="Windows Widgets: Schnelle DIN-Prüfung & Netzlast"
        >
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] text-slate-400">Netzstrom 230V</span>
            <span className="text-xs font-semibold text-emerald-400 font-mono mt-0.5">{currentWatts} W</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </div>
      </div>

      {/* CENTER: Authentic Windows 11 Center-Aligned Taskbar Icons */}
      <div className="flex items-center gap-1 mx-auto">
        {/* Windows 11 Start Button (Iconic 4-tile logo) */}
        <button
          onClick={onToggleStartMenu}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-90 group relative ${
            isStartMenuOpen ? 'bg-white/20 shadow-md' : 'hover:bg-white/10'
          }`}
          title="Start (VoltCAD 3D Startmenü)"
        >
          {/* Windows 11 Logo: 4 glowing colored tiles */}
          <div className="grid grid-cols-2 gap-0.5 w-4 h-4 group-hover:scale-105 transition-transform">
            <div className="bg-sky-400 rounded-[1.5px]" />
            <div className="bg-sky-500 rounded-[1.5px]" />
            <div className="bg-blue-500 rounded-[1.5px]" />
            <div className="bg-indigo-500 rounded-[1.5px]" />
          </div>
          {isStartMenuOpen && (
            <span className="absolute bottom-0.5 w-2 h-0.5 rounded-full bg-sky-400" />
          )}
        </button>

        {/* Windows 11 Search Icon */}
        <button
          onClick={onOpenCommandPalette}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition text-slate-300 hover:text-white active:scale-95"
          title="Suchen (Strg + K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Windows 11 Task View / Module Switcher */}
        <button
          onClick={onToggleStartMenu}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition text-slate-300 hover:text-white active:scale-95 hidden sm:flex"
          title="Aktive Module anzeigen"
        >
          <Layers className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

        {/* Pinned / Running Applications in Taskbar */}
        {taskbarApps.map(app => {
          const Icon = app.icon;
          const isActive = activeView === app.id;
          return (
            <button
              key={app.id}
              onClick={() => onSelectView(app.id as ActiveAppView)}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition active:scale-90 group relative ${
                isActive 
                  ? 'bg-white/15 text-white shadow-inner' 
                  : 'hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title={app.name}
            >
              <Icon className={`w-4 h-4 ${isActive ? app.accent : 'group-hover:' + app.accent} transition-transform group-hover:scale-110`} />
              {/* Windows 11 Active App Indicator Pill */}
              <span 
                className={`transition-all duration-300 rounded-full mt-0.5 ${
                  isActive 
                    ? 'w-4 h-0.5 bg-sky-400 shadow-sm shadow-sky-400' 
                    : 'w-1.5 h-0.5 bg-slate-500 opacity-60 group-hover:opacity-100 group-hover:w-2'
                }`} 
              />
            </button>
          );
        })}

        <div className="w-px h-6 bg-white/10 mx-1 hidden lg:block" />

        {/* Quick Tools Icons in Taskbar */}
        <button
          onClick={onOpenBackupModal}
          className="w-10 h-10 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 text-emerald-400 transition active:scale-90 hidden lg:flex relative"
          title="Projekt-Sicherungsverlauf (LocalStorage)"
        >
          <HardDrive className={`w-4 h-4 ${isSaving ? 'animate-spin text-amber-400' : ''}`} />
          <span className="w-1 h-0.5 rounded-full bg-emerald-400/80 mt-0.5" />
        </button>

        <button
          onClick={onOpenExportModal}
          className="w-10 h-10 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 text-sky-400 transition active:scale-90 hidden lg:flex relative"
          title="APK & Plan-Export"
        >
          <Smartphone className="w-4 h-4" />
          <span className="w-1 h-0.5 rounded-full bg-sky-400/80 mt-0.5" />
        </button>

        <button
          onClick={onOpenResetModal}
          className="w-10 h-10 rounded-xl flex flex-col items-center justify-center hover:bg-white/10 text-amber-400 transition active:scale-90 hidden xl:flex relative"
          title="Neustart / Musterwohnung"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="w-1 h-0.5 rounded-full bg-amber-400/80 mt-0.5" />
        </button>
      </div>

      {/* RIGHT: Windows 11 System Tray (Action Center, Clock, Tray Icons) */}
      <div className="flex items-center gap-1 min-w-[140px] justify-end">
        {/* Samsung Galaxy Mobile Quick Toggle */}
        {onSwitchToSamsungMobile && (
          <button
            onClick={onSwitchToSamsungMobile}
            className="p-1.5 rounded-lg hover:bg-white/10 text-sky-400 hover:text-white transition flex items-center gap-1"
            title="Zu Samsung Galaxy Mobile-Version (One UI / S-Pen / Touch) wechseln"
            aria-label="Samsung Galaxy Mobil-Modus"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Apple iPad Tablett Quick Toggle */}
        {onSwitchToIOSTablet && (
          <button
            onClick={onSwitchToIOSTablet}
            className="p-1.5 rounded-lg hover:bg-white/10 text-sky-400 hover:text-white transition flex items-center gap-1"
            title="Zu Apple iPad Tablett-Version (Liquid Retina & Apple Pencil) wechseln"
            aria-label="Apple iPad Tablett-Modus"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Windows Ink / Touch Input Toggle */}
        <button
          onClick={() => onToggleTouchInputMode(touchInputMode === 'touch' ? 'pencil' : 'touch')}
          className={`px-2 py-1.5 rounded-lg flex items-center gap-1 text-xs transition ${
            touchInputMode === 'pencil' 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' 
              : 'hover:bg-white/10 text-slate-400 hover:text-white'
          } hidden sm:flex`}
          title={touchInputMode === 'pencil' ? 'Windows Ink Stift-Modus aktiv' : 'Touch-Modus'}
        >
          {touchInputMode === 'pencil' ? (
            <PenTool className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Hand className="w-3.5 h-3.5" />
          )}
          <span className="text-[10px] hidden md:inline">
            {touchInputMode === 'pencil' ? 'Ink' : 'Touch'}
          </span>
        </button>

        {/* Windows 11 Action Center Pill (WLAN, Sound, Battery) */}
        <button
          onClick={onToggleQuickSettings}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition active:scale-95 ${
            isQuickSettingsOpen ? 'bg-white/15' : ''
          }`}
          title="Windows Schnelleinstellungen (WLAN, Lautstärke, Netzstrom)"
        >
          <Wifi className="w-3.5 h-3.5 text-slate-300" />
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-slate-300" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          )}
          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
        </button>

        {/* Windows 11 Live Clock & Date Flyout Trigger */}
        <button
          onClick={onToggleCalendar}
          className={`flex flex-col items-end px-2 py-1 rounded-lg hover:bg-white/10 transition leading-tight text-right ${
            isCalendarOpen ? 'bg-white/15' : ''
          }`}
          title="Windows 11 Kalender & Benachrichtigungen"
        >
          <span className="text-xs font-semibold text-slate-200 font-mono">{timeStr}</span>
          <span className="text-[10px] text-slate-400 font-mono">{dateStr}</span>
        </button>

        {/* Windows 11 Notification Bell */}
        <button
          onClick={onToggleCalendar}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white relative transition hidden sm:flex"
          title="Benachrichtigungscenter"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-400" />
        </button>

        {/* Windows 11 "Show Desktop" Bar (Far Right edge line) */}
        <div 
          onClick={onOpenCommandPalette}
          className="w-1.5 h-7 hover:bg-white/30 border-l border-white/20 cursor-pointer ml-1 transition"
          title="Desktop / Schnellansicht"
        />
      </div>
    </footer>
  );
};

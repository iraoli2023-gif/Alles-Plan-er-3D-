import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  Minus, 
  Square, 
  Copy, 
  X, 
  HardDrive, 
  FileText, 
  FolderOpen, 
  Save, 
  RotateCcw, 
  Smartphone, 
  Bot, 
  Sliders, 
  HelpCircle, 
  Check, 
  LayoutGrid,
  ShieldCheck,
  Maximize2,
  Cloud,
  Monitor,
  Tablet
} from 'lucide-react';
import { ActiveAppView } from '../types';

interface WindowsTitleBarProps {
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
  currentWatts: number;
  isSaving: boolean;
  autoSaveEnabled: boolean;
  lastSavedFormatted?: string;
  isDriveConnected?: boolean;
  isDriveSyncing?: boolean;
  driveUserEmail?: string | null;
  onOpenBackupModal: () => void;
  onOpenResetModal: () => void;
  onOpenExportModal: () => void;
  onOpenDesktopModal: () => void;
  onOpenCommandPalette: () => void;
  onOpenRoomManager?: () => void;
  onSwitchToSamsungMobile?: () => void;
  onOpenSamsungInstall?: () => void;
  onSwitchToIOSTablet?: () => void;
  onOpenIOSInstall?: () => void;
  projectName?: string;
  snapLayout: 'full' | 'split-left' | 'split-right' | 'window';
  onSetSnapLayout: (layout: 'full' | 'split-left' | 'split-right' | 'window') => void;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  activeView,
  onSelectView,
  isMaximized,
  onToggleMaximize,
  onMinimize,
  onClose,
  currentWatts,
  isSaving,
  autoSaveEnabled,
  lastSavedFormatted,
  isDriveConnected,
  isDriveSyncing,
  driveUserEmail,
  onOpenBackupModal,
  onOpenResetModal,
  onOpenExportModal,
  onOpenDesktopModal,
  onOpenCommandPalette,
  onOpenRoomManager,
  onSwitchToSamsungMobile,
  onOpenSamsungInstall,
  onSwitchToIOSTablet,
  onOpenIOSInstall,
  projectName = 'Musterwohnung_DIN18015.cad',
  snapLayout,
  onSetSnapLayout,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showSnapFlyout, setShowSnapFlyout] = useState(false);
  const snapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSnapMouseEnter = () => {
    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    setShowSnapFlyout(true);
  };

  const handleSnapMouseLeave = () => {
    snapTimeoutRef.current = setTimeout(() => {
      setShowSnapFlyout(false);
    }, 300);
  };

  return (
    <header className="h-10 bg-slate-900/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-3 select-none text-xs text-slate-200 z-40 relative">
      {/* LEFT: Windows App Icon + Title & Fluent Menu Bar */}
      <div className="flex items-center gap-2" ref={menuRef}>
        {/* Windows Fluent VoltCAD Icon */}
        <div 
          onClick={onOpenResetModal}
          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-white/10 transition cursor-pointer"
          title="VoltCAD 3D Systemmenü"
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-sm shadow-sky-500/20">
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          </div>
          <span className="font-semibold text-white tracking-tight hidden sm:inline">VoltCAD 3D</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/60 font-mono hidden md:inline">
            PRO
          </span>
        </div>

        {/* Project Document Name */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-400 pl-1 border-l border-white/10">
          <span className="text-slate-300 font-medium">[{projectName}]</span>
          {isSaving ? (
            <span className="text-[10px] text-amber-400 animate-pulse font-mono">● Speichert...</span>
          ) : (
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1" title="Im LocalStorage gesichert">
              <Check className="w-3 h-3 text-emerald-400" /> Gesichert
            </span>
          )}
        </div>

        {/* Windows Fluent Menu Bar */}
        <nav className="flex items-center gap-0.5 ml-2 text-slate-300">
          {/* Datei Menü */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
              className={`px-2 py-1 rounded hover:bg-white/10 transition text-xs ${openMenu === 'file' ? 'bg-white/10 text-white' : ''}`}
            >
              Datei
            </button>
            {openMenu === 'file' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-0.5">
                <button
                  onClick={() => { setOpenMenu(null); onOpenResetModal(); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Neues Projekt / Leeren</span>
                  <span className="text-[10px] text-slate-500 font-mono">Strg+N</span>
                </button>
                <button
                  onClick={() => { setOpenMenu(null); onOpenResetModal(); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2"><FolderOpen className="w-3.5 h-3.5 text-sky-400" /> Musterwohnung laden</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => { setOpenMenu(null); onOpenBackupModal(); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2"><Save className="w-3.5 h-3.5 text-emerald-400" /> Manuell sichern</span>
                  <span className="text-[10px] text-slate-500 font-mono">Strg+S</span>
                </button>
                <button
                  onClick={() => { setOpenMenu(null); onOpenBackupModal(); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2"><HardDrive className="w-3.5 h-3.5 text-purple-400" /> Sicherungsverlauf & Backups</span>
                </button>
                <button
                  onClick={() => { setOpenMenu(null); onOpenBackupModal(); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-sky-300 hover:text-white"
                >
                  <span className="flex items-center gap-2"><Cloud className="w-3.5 h-3.5 text-sky-400" /> Google Drive Cloud-Sync</span>
                  {isDriveConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => { setOpenMenu(null); onOpenDesktopModal(); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-amber-300 hover:text-white"
                >
                  <span className="flex items-center gap-2"><Monitor className="w-3.5 h-3.5 text-amber-400" /> Windows Desktop (.exe / Starter)</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Download</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => { setOpenMenu(null); onOpenExportModal(); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5 text-sky-400" /> Exportieren (APK / PDF / CAD)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Strg+E</span>
                </button>
              </div>
            )}
          </div>

          {/* Bearbeiten Menü */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}
              className={`px-2 py-1 rounded hover:bg-white/10 transition text-xs ${openMenu === 'edit' ? 'bg-white/10 text-white' : ''}`}
            >
              Bearbeiten
            </button>
            {openMenu === 'edit' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-0.5">
                {onOpenRoomManager && (
                  <button
                    onClick={() => { setOpenMenu(null); onOpenRoomManager(); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-sky-300 hover:text-white"
                  >
                    <span>Mehrere Räume ansetzen...</span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-mono">Neu</span>
                  </button>
                )}
                <button
                  onClick={() => { setOpenMenu(null); onSelectView('3d_cad'); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs text-slate-200 hover:text-white"
                >
                  Möbel & Raummaße anpassen
                </button>
                <button
                  onClick={() => { setOpenMenu(null); onSelectView('electrical_planner'); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs text-slate-200 hover:text-white"
                >
                  Elektro-Installationszonen (DIN)
                </button>
                <button
                  onClick={() => { setOpenMenu(null); onOpenResetModal(); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-red-300 flex items-center gap-2 text-xs"
                >
                  Projekt zurücksetzen
                </button>
              </div>
            )}
          </div>

          {/* Ansicht Menü */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}
              className={`px-2 py-1 rounded hover:bg-white/10 transition text-xs ${openMenu === 'view' ? 'bg-white/10 text-white' : ''}`}
            >
              Ansicht
            </button>
            {openMenu === 'view' && (
              <div className="absolute top-full left-0 mt-1 w-60 bg-slate-900/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-0.5">
                {[
                  { id: '3d_cad', label: '3D CAD Wohnung & Möbel' },
                  { id: 'electrical_planner', label: 'Elektro- & Verlegepläne (DIN)' },
                  { id: 'distribution_board', label: 'Verteilerschrank & UV' },
                  { id: 'smart_home', label: 'Smart Home & Logik-Editor' },
                  { id: 'terrarium', label: 'Terrarium Steuerung' },
                  { id: 'energy_realtime', label: 'Echtzeit-Energieverbrauch' },
                  { id: 'ai_auditor', label: 'KI-Auditor (DIN 18015)' },
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => { setOpenMenu(null); onSelectView(v.id as ActiveAppView); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between text-xs ${
                      activeView === v.id ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <span>{v.label}</span>
                    {activeView === v.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </button>
                ))}
                {onSwitchToSamsungMobile && (
                  <>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={() => { setOpenMenu(null); onSwitchToSamsungMobile(); }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-sky-500/20 flex items-center justify-between text-xs text-sky-300 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                        <span>Samsung Galaxy Mobil-Modus</span>
                      </span>
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-mono">One UI</span>
                    </button>
                  </>
                )}
                {onSwitchToIOSTablet && (
                  <button
                    onClick={() => { setOpenMenu(null); onSwitchToIOSTablet(); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-sky-500/20 flex items-center justify-between text-xs text-sky-300 hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Tablet className="w-3.5 h-3.5 text-sky-400" />
                      <span>Apple iPad Tablett-Version</span>
                    </span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-mono">iPadOS</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Normen & KI Menü */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setOpenMenu(openMenu === 'standards' ? null : 'standards')}
              className={`px-2 py-1 rounded hover:bg-white/10 transition text-xs ${openMenu === 'standards' ? 'bg-white/10 text-white' : ''}`}
            >
              DIN-Normen
            </button>
            {openMenu === 'standards' && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-0.5">
                <button
                  onClick={() => { setOpenMenu(null); onSelectView('ai_auditor'); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs text-amber-300"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vollständiger DIN 18015 KI-Audit</span>
                </button>
                <button
                  onClick={() => { setOpenMenu(null); onSelectView('electrical_planner'); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs text-slate-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Installationszonen (15/30/115 cm)</span>
                </button>
                <button
                  onClick={() => { setOpenMenu(null); onSelectView('distribution_board'); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs text-slate-200"
                >
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>RCD- & Phasensymmetrie-Prüfung</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* CENTER: Windows 11 Fluent Command Search Box */}
      <div className="flex-1 max-w-md mx-2 hidden sm:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full h-7 px-3 rounded-lg bg-slate-950/70 hover:bg-slate-950 border border-white/10 hover:border-sky-500/50 flex items-center justify-between text-slate-400 hover:text-slate-200 transition shadow-inner group"
          title="Windows Befehls- & Komponentensuche öffnen (Strg + K)"
        >
          <div className="flex items-center gap-2 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition" />
            <span className="truncate">Befehl, Komponente oder DIN-Norm suchen...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-300 border border-white/10">
            Strg+K
          </kbd>
        </button>
      </div>

      {/* RIGHT: Status Gauges, Auto-Save & Windows Window Controls */}
      <div className="flex items-center gap-2">
        {/* Live Power Mini Badge */}
        <div 
          onClick={() => onSelectView('energy_realtime')}
          className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950/60 border border-white/10 hover:border-amber-500/50 cursor-pointer transition text-[11px] font-mono"
          title="Live Netzlast: Klicken für Energie-Dashboard"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Netzlast:</span>
          <strong className="text-amber-400">{currentWatts} W</strong>
        </div>

        {/* Auto-Save Status Mini Badge */}
        <div 
          onClick={onOpenBackupModal}
          className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950/60 border border-white/10 hover:border-emerald-500/50 cursor-pointer transition text-[11px]"
          title="LocalStorage Auto-Save & Sicherungsverlauf"
        >
          <HardDrive className={`w-3 h-3 ${isSaving ? 'text-amber-400 animate-spin' : autoSaveEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="text-slate-400 hidden lg:inline">Lokal:</span>
          <span className="text-emerald-400 font-semibold truncate max-w-[80px]">
            {isSaving ? 'Sichert...' : 'Aktiv'}
          </span>
        </div>

        {/* Google Drive Status Mini Badge */}
        <div 
          onClick={onOpenBackupModal}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950/60 border border-white/10 hover:border-sky-500/50 cursor-pointer transition text-[11px]"
          title={isDriveConnected ? `Google Drive: Verbunden (${driveUserEmail || 'Aktiv'}) - Klicken für Cloud-Backups` : 'Google Drive: Automatische Cloud-Sicherung einrichten'}
        >
          <Cloud className={`w-3 h-3 ${isDriveSyncing ? 'text-sky-400 animate-bounce' : isDriveConnected ? 'text-sky-400' : 'text-slate-500'}`} />
          <span className="text-slate-400 hidden xl:inline">Drive:</span>
          <span className={`font-semibold truncate max-w-[85px] ${isDriveConnected ? 'text-sky-300' : 'text-slate-400'}`}>
            {isDriveSyncing ? 'Sichert...' : isDriveConnected ? 'Verbunden' : 'Drive'}
          </span>
        </div>

        {/* Samsung Galaxy Mobile Button */}
        {onSwitchToSamsungMobile && (
          <button
            onClick={onSwitchToSamsungMobile}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-gradient-to-r from-blue-950 to-indigo-950 border border-sky-500/40 hover:border-sky-400 hover:from-blue-900 hover:to-indigo-900 cursor-pointer transition text-[11px] font-semibold text-sky-300 hover:text-white shadow-sm"
            title="Zu Samsung Galaxy Mobile-Version (One UI / S-Pen / Touch) wechseln"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Samsung Mobil</span>
          </button>
        )}

        {/* Apple iPad Tablett Button */}
        {onSwitchToIOSTablet && (
          <button
            onClick={onSwitchToIOSTablet}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-gradient-to-r from-slate-900 to-sky-950 border border-sky-400/40 hover:border-sky-300 hover:from-slate-850 hover:to-sky-900 cursor-pointer transition text-[11px] font-semibold text-sky-300 hover:text-white shadow-sm"
            title="Zu iOS / iPadOS Tablett Version wechseln (Apple Pencil & Liquid Retina)"
          >
            <Tablet className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">iPad Tablett</span>
          </button>
        )}

        {/* Windows Desktop .EXE Download Button */}
        <button
          onClick={onOpenDesktopModal}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-gradient-to-r from-sky-950 to-indigo-950 border border-sky-500/40 hover:border-sky-400 hover:from-sky-900 hover:to-indigo-900 cursor-pointer transition text-[11px] font-semibold text-sky-300 hover:text-white shadow-sm"
          title="Als Windows-Desktop-Software (.exe / Desktop-Starter) herunterladen"
        >
          <Monitor className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Desktop .EXE</span>
        </button>

        {/* Windows 11 Window Control Buttons */}
        <div className="flex items-center -mr-1 ml-1">
          {/* Minimize Button */}
          <button
            onClick={onMinimize}
            className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Minimieren"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize / Restore / Snap Layouts Button */}
          <div 
            className="relative"
            onMouseEnter={handleSnapMouseEnter}
            onMouseLeave={handleSnapMouseLeave}
          >
            <button
              onClick={onToggleMaximize}
              className="w-10 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
              title={isMaximized ? "Wiederherstellen" : "Maximieren"}
            >
              {isMaximized ? (
                <Copy className="w-3 h-3 rotate-180" />
              ) : (
                <Square className="w-3 h-3" />
              )}
            </button>

            {/* Windows 11 Snap Layouts Flyout */}
            {showSnapFlyout && (
              <div 
                className="absolute right-0 top-full mt-1 p-2 bg-slate-900/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl z-50 w-52 space-y-2 animate-in fade-in zoom-in-95"
                onMouseEnter={handleSnapMouseEnter}
                onMouseLeave={handleSnapMouseLeave}
              >
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Windows 11 Snap Layouts
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Snap: Full Screen */}
                  <button
                    onClick={() => { onSetSnapLayout('full'); setShowSnapFlyout(false); }}
                    className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition ${
                      snapLayout === 'full' ? 'border-sky-400 bg-sky-500/20' : 'border-white/10 hover:border-white/30 bg-slate-950/60'
                    }`}
                  >
                    <div className="w-full h-6 rounded bg-sky-500/30 border border-sky-400/50" />
                    <span className="text-[10px] text-slate-300">Vollbild</span>
                  </button>

                  {/* Snap: Split Left */}
                  <button
                    onClick={() => { onSetSnapLayout('split-left'); setShowSnapFlyout(false); }}
                    className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition ${
                      snapLayout === 'split-left' ? 'border-sky-400 bg-sky-500/20' : 'border-white/10 hover:border-white/30 bg-slate-950/60'
                    }`}
                  >
                    <div className="w-full h-6 rounded flex gap-1">
                      <div className="w-1/2 h-full bg-sky-500/40 border border-sky-400/60 rounded-l" />
                      <div className="w-1/2 h-full bg-slate-800/60 border border-white/10 rounded-r" />
                    </div>
                    <span className="text-[10px] text-slate-300">Links</span>
                  </button>

                  {/* Snap: Split Right */}
                  <button
                    onClick={() => { onSetSnapLayout('split-right'); setShowSnapFlyout(false); }}
                    className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition ${
                      snapLayout === 'split-right' ? 'border-sky-400 bg-sky-500/20' : 'border-white/10 hover:border-white/30 bg-slate-950/60'
                    }`}
                  >
                    <div className="w-full h-6 rounded flex gap-1">
                      <div className="w-1/2 h-full bg-slate-800/60 border border-white/10 rounded-l" />
                      <div className="w-1/2 h-full bg-sky-500/40 border border-sky-400/60 rounded-r" />
                    </div>
                    <span className="text-[10px] text-slate-300">Rechts</span>
                  </button>

                  {/* Snap: Window Mode */}
                  <button
                    onClick={() => { onSetSnapLayout('window'); setShowSnapFlyout(false); }}
                    className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition ${
                      snapLayout === 'window' ? 'border-sky-400 bg-sky-500/20' : 'border-white/10 hover:border-white/30 bg-slate-950/60'
                    }`}
                  >
                    <div className="w-full h-6 rounded flex items-center justify-center p-0.5">
                      <div className="w-3/4 h-full bg-sky-500/30 border border-sky-400/50 rounded shadow" />
                    </div>
                    <span className="text-[10px] text-slate-300">Fenster</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Close Button (Authentic Windows red hover) */}
          <button
            onClick={onClose}
            className="w-11 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition"
            title="Projekt beenden / Neustart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

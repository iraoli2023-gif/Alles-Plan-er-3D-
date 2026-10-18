import React, { useState } from 'react';
import { 
  Box, 
  Zap, 
  Cpu, 
  Network, 
  Sun, 
  Activity, 
  Bot, 
  Smartphone, 
  HardDrive, 
  RotateCcw, 
  Search, 
  Power, 
  User, 
  FolderOpen, 
  ShieldCheck,
  Save,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ActiveAppView } from '../types';

interface WindowsStartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  onOpenResetModal: () => void;
  onOpenBackupModal: () => void;
  onOpenExportModal: () => void;
  lastSavedFormatted?: string;
  onQuickSave: () => void;
}

export const WindowsStartMenu: React.FC<WindowsStartMenuProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  onOpenResetModal,
  onOpenBackupModal,
  onOpenExportModal,
  lastSavedFormatted,
  onQuickSave,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPowerMenu, setShowPowerMenu] = useState(false);

  if (!isOpen) return null;

  const pinnedApps = [
    {
      id: '3d_cad',
      name: '3D CAD Wohnung',
      desc: 'Möbelierung & 3D Raumplaner',
      icon: Box,
      color: 'from-sky-500 to-blue-600',
      badge: '3D',
    },
    {
      id: 'electrical_planner',
      name: 'Elektro-Planer',
      desc: 'DIN 18015 Verlegezonen & Dosen',
      icon: Zap,
      color: 'from-amber-400 to-orange-500',
      badge: 'DIN',
    },
    {
      id: 'distribution_board',
      name: 'Verteilerschrank',
      desc: 'Hutschiene, RCDs & LS-Schalter',
      icon: Cpu,
      color: 'from-indigo-500 to-purple-600',
      badge: 'UV',
    },
    {
      id: 'smart_home',
      name: 'Smart Home Logik',
      desc: 'WENN-DANN Automationen',
      icon: Network,
      color: 'from-emerald-400 to-teal-600',
      badge: 'IoT',
    },
    {
      id: 'terrarium',
      name: 'Terrarium Steuerung',
      desc: 'Klima, UV & Beregnung',
      icon: Sun,
      color: 'from-lime-400 to-emerald-500',
      badge: 'Reptile',
    },
    {
      id: 'energy_realtime',
      name: 'Energie-Dashboard',
      desc: 'Echtzeit-Netzlast & Phasen',
      icon: Activity,
      color: 'from-cyan-400 to-blue-600',
      badge: 'Watts',
    },
    {
      id: 'ai_auditor',
      name: 'KI-Auditor',
      desc: 'DIN 18015 Compliance Prüfer',
      icon: Bot,
      color: 'from-rose-500 to-amber-500',
      badge: 'KI',
    },
  ];

  const filteredApps = pinnedApps.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Backdrop to close when clicking outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
      />

      {/* Windows 11 Start Menu Card */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-[95vw] max-w-[620px] bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl z-50 p-5 text-slate-100 flex flex-col select-none animate-in fade-in slide-in-from-bottom-5 duration-200">
        {/* Search bar inside Start Menu */}
        <div className="relative mb-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Apps, CAD-Pläne, DIN-Normen oder Funktionen suchen..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400/80 transition"
            autoFocus
          />
        </div>

        {/* Section Header: Angeheftet (Pinned) */}
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs font-bold text-slate-300">Angeheftet</span>
          <span className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1">
            Alle Module <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        {/* Grid of Pinned Apps (Windows 11 Icon Grid Style) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5 max-h-[260px] overflow-y-auto pr-1">
          {filteredApps.map(app => {
            const Icon = app.icon;
            const isActive = activeView === app.id;
            return (
              <button
                key={app.id}
                onClick={() => {
                  onSelectView(app.id as ActiveAppView);
                  onClose();
                }}
                className={`p-3 rounded-xl flex flex-col items-center text-center gap-2 transition group relative ${
                  isActive 
                    ? 'bg-sky-500/20 border border-sky-400/50 text-white' 
                    : 'hover:bg-white/10 border border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${app.color} p-0.5 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center`}>
                  <div className="w-full h-full bg-slate-950/40 rounded-[10px] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="w-full">
                  <div className="text-xs font-semibold truncate leading-tight">{app.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{app.badge}</div>
                </div>
                {isActive && (
                  <span className="absolute bottom-1 w-2 h-1 rounded-full bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Section: Empfohlen / Kürzlich verwendet (Windows 11 Recommended) */}
        <div className="border-t border-white/10 pt-3 mb-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-bold text-slate-300">Empfohlen & Kürzlich</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => { onOpenBackupModal(); onClose(); }}
              className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-white/10 border border-white/10 flex items-center gap-3 text-left transition"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">Letzter Auto-Save Stand</div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {lastSavedFormatted || 'Vor wenigen Augenblicken'}
                </div>
              </div>
            </button>

            <button
              onClick={() => { onOpenExportModal(); onClose(); }}
              className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-white/10 border border-white/10 flex items-center gap-3 text-left transition"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">APK & CAD Export</div>
                <div className="text-[10px] text-slate-400 truncate">PDF-Berichte, DXF & Android</div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer: User Profile & Windows Power Button */}
        <div className="border-t border-white/10 pt-3 mt-auto flex items-center justify-between px-1 relative">
          {/* User profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-amber-400 p-0.5 shadow">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold text-white">
                VP
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white">VoltCAD Elektroplaner</div>
              <div className="text-[10px] text-slate-400">DIN 18015 Fachbetrieb</div>
            </div>
          </div>

          {/* Quick Save and Power Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onQuickSave(); }}
              className="p-2 rounded-xl hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition"
              title="Projekt sofort speichern"
            >
              <Save className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowPowerMenu(!showPowerMenu)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Energie- & Projektoptionen"
              >
                <Power className="w-4 h-4 text-rose-400" />
              </button>

              {/* Windows Power Flyout */}
              {showPowerMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1">
                  <button
                    onClick={() => { setShowPowerMenu(false); onClose(); onOpenResetModal(); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white flex items-center gap-2"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                    <span>Musterwohnung neu laden</span>
                  </button>
                  <button
                    onClick={() => { setShowPowerMenu(false); onClose(); onOpenResetModal(); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 hover:text-white flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Leeres Projekt starten</span>
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <button
                    onClick={() => { setShowPowerMenu(false); onClose(); onOpenResetModal(); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-rose-300 flex items-center gap-2"
                  >
                    <Power className="w-3.5 h-3.5 text-rose-400" />
                    <span>Projekt zurücksetzen</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

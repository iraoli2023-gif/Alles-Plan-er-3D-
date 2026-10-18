import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Box, 
  Zap, 
  Cpu, 
  Network, 
  Sun, 
  Activity, 
  Bot, 
  HardDrive, 
  Smartphone, 
  RotateCcw, 
  Save, 
  ShieldCheck,
  X,
  ArrowRight,
  Home,
  Layers,
  Monitor,
  Tablet
} from 'lucide-react';
import { ActiveAppView } from '../types';

interface WindowsCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: ActiveAppView) => void;
  onOpenResetModal: () => void;
  onOpenBackupModal: () => void;
  onOpenExportModal: () => void;
  onOpenDesktopModal?: () => void;
  onOpenSamsungInstall?: () => void;
  onSwitchToSamsungMobile?: () => void;
  onSwitchToIOSTablet?: () => void;
  onOpenIOSInstall?: () => void;
  onOpenRoomManager?: () => void;
  onQuickSave: () => void;
}

export const WindowsCommandPalette: React.FC<WindowsCommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectView,
  onOpenResetModal,
  onOpenBackupModal,
  onOpenExportModal,
  onOpenDesktopModal,
  onOpenSamsungInstall,
  onSwitchToSamsungMobile,
  onSwitchToIOSTablet,
  onOpenIOSInstall,
  onOpenRoomManager,
  onQuickSave,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'view_3d',
      title: '3D CAD Wohnung & Möbel öffnen',
      desc: 'Wohnungsansicht mit 3D Orbit & Möbelierung',
      icon: Box,
      category: 'Ansicht',
      action: () => { onSelectView('3d_cad'); onClose(); },
    },
    {
      id: 'act_rooms',
      title: 'Mehrere Räume ansetzen (Wohnungs-Manager)',
      desc: 'Schlafzimmer, Küche, Bad oder Flur anbauen und Wanddurchbrüche planen',
      icon: Home,
      category: 'Architektur',
      action: () => { onOpenRoomManager?.(); onClose(); },
    },
    {
      id: 'act_layers',
      title: '3D Layer-Manager (Möbel, Elektro, Bemaßungen)',
      desc: 'Ebenen einzeln ein- oder ausblenden (Möbel, Installationen, Maßketten)',
      icon: Layers,
      category: '3D CAD',
      action: () => { onSelectView('3d_cad'); onClose(); },
    },
    {
      id: 'view_elec',
      title: 'Elektro- & Verlegepläne (DIN 18015)',
      desc: 'Steckdosen, Lichtschalter & Installationszonen',
      icon: Zap,
      category: 'Ansicht',
      action: () => { onSelectView('electrical_planner'); onClose(); },
    },
    {
      id: 'view_dist',
      title: 'Verteilerschrank & UV (Hutschiene)',
      desc: 'LS-Schalter, RCDs & Phasenbelegung',
      icon: Cpu,
      category: 'Ansicht',
      action: () => { onSelectView('distribution_board'); onClose(); },
    },
    {
      id: 'view_smart',
      title: 'Smart Home & Logik-Editor',
      desc: 'WENN-DANN Automationen & Gateways',
      icon: Network,
      category: 'Ansicht',
      action: () => { onSelectView('smart_home'); onClose(); },
    },
    {
      id: 'view_terra',
      title: 'Terrarium Steuerung & Klima',
      desc: 'Regenanlage, UV-Lampen & Sensoren',
      icon: Sun,
      category: 'Ansicht',
      action: () => { onSelectView('terrarium'); onClose(); },
    },
    {
      id: 'view_energy',
      title: 'Echtzeit-Energieverbrauch',
      desc: 'Live Watt-Messung & Lastspitzen',
      icon: Activity,
      category: 'Ansicht',
      action: () => { onSelectView('energy_realtime'); onClose(); },
    },
    {
      id: 'view_ai',
      title: 'KI-Auditor: DIN 18015 Schnellprüfung',
      desc: 'Normkonformität & Überlastschutz analysieren',
      icon: Bot,
      category: 'DIN Normen',
      action: () => { onSelectView('ai_auditor'); onClose(); },
    },
    {
      id: 'act_save',
      title: 'Projekt jetzt im LocalStorage sichern',
      desc: 'Manuelles Backup mit Zeitstempel anlegen',
      icon: Save,
      category: 'System',
      action: () => { onQuickSave(); onClose(); },
    },
    {
      id: 'act_backups',
      title: 'Sicherungsverlauf & Backups anzeigen',
      desc: 'Gespeicherte Stände wiederherstellen',
      icon: HardDrive,
      category: 'System',
      action: () => { onOpenBackupModal(); onClose(); },
    },
    {
      id: 'act_desktop',
      title: 'Windows Desktop (.exe) & Starter-Download',
      desc: 'VoltCAD als Windows-Software mit Launcher (.bat), Icon (.vbs) oder Electron-EXE ausführen',
      icon: Monitor,
      category: 'Export',
      action: () => { onOpenDesktopModal?.(); onClose(); },
    },
    {
      id: 'act_samsung_mobile',
      title: 'Samsung Galaxy Mobil-Version starten',
      desc: 'One UI 6/7 Touch-Modus, S-Pen Präzisionswerkzeuge, Edge-Panel & 3-Button-Leiste',
      icon: Smartphone,
      category: 'Ansicht',
      action: () => { onSwitchToSamsungMobile?.(); onClose(); },
    },
    {
      id: 'act_ios_tablet',
      title: 'Apple iPad Tablett-Version starten',
      desc: 'Liquid Retina ProMotion, Apple Pencil Präzisionsmodus, Floating Dock & Stage Manager',
      icon: Tablet,
      category: 'Ansicht',
      action: () => { onSwitchToIOSTablet?.(); onClose(); },
    },
    {
      id: 'act_ios_download',
      title: 'iOS Tablett App herunterladen & installieren',
      desc: 'Apple Konfigurationsprofil (.mobileconfig), Safari PWA oder natives Xcode Swift-Projekt (.zip)',
      icon: Tablet,
      category: 'Export',
      action: () => { onOpenIOSInstall?.(); onClose(); },
    },
    {
      id: 'act_samsung_install',
      title: 'Samsung Galaxy APK & DeX Installationsguide',
      desc: '1-Klick Samsung Internet WebAPK, Knox Konfiguration & DeX Großbildschirm',
      icon: Smartphone,
      category: 'Export',
      action: () => { onOpenSamsungInstall?.(); onClose(); },
    },
    {
      id: 'act_export',
      title: 'APK & Projekt-Export öffnen',
      desc: 'Android APK, PDF-Bericht & CAD Export',
      icon: Smartphone,
      category: 'Export',
      action: () => { onOpenExportModal(); onClose(); },
    },
    {
      id: 'act_reset',
      title: 'Projekt neu starten oder leeren',
      desc: 'Musterwohnung neu laden oder leeres CAD',
      icon: RotateCcw,
      category: 'Projekt',
      action: () => { onOpenResetModal(); onClose(); },
    },
  ];

  const filtered = actions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.desc.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4" onClick={onClose}>
        <div 
          className="w-full max-w-xl bg-slate-900/98 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="p-3 border-b border-white/10 flex items-center gap-3">
            <Search className="w-5 h-5 text-sky-400 shrink-0 ml-1" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Befehl, Modul oder DIN-Norm eingeben... (Esc zum Schließen)"
              className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              autoFocus
            />
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of actions */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Keine Befehle für "{query}" gefunden.
              </div>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full p-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between text-left group transition border border-transparent hover:border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                        {item.category}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer info */}
          <div className="p-2.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 px-4">
            <span>Tipp: <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-300 font-mono">Strg + K</kbd> öffnet die Suche jederzeit</span>
            <span>VoltCAD 3D Pro</span>
          </div>
        </div>
      </div>
    </>
  );
};

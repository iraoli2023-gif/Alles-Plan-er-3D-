import React from 'react';
import { ActiveAppView } from '../types';
import { 
  Box, 
  Zap, 
  Cpu, 
  Network, 
  Sun, 
  Activity, 
  Bot, 
  Maximize2, 
  Minus, 
  Square,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface WindowsAppWindowProps {
  activeView: ActiveAppView;
  snapLayout: 'full' | 'split-left' | 'split-right' | 'window';
  isMinimized: boolean;
  onRestore: () => void;
  children: React.ReactNode;
}

export const WindowsAppWindow: React.FC<WindowsAppWindowProps> = ({
  activeView,
  snapLayout,
  isMinimized,
  onRestore,
  children,
}) => {
  const viewInfo: Record<ActiveAppView, { title: string; subtitle: string; icon: any; color: string }> = {
    '3d_cad': {
      title: '3D CAD Wohnung & Raumplaner',
      subtitle: 'Möbelierung, 3D Orbit, Raummaße & DIN 18015 Zonen',
      icon: Box,
      color: 'text-sky-400',
    },
    'electrical_planner': {
      title: 'Elektro- & Leitungsverlegeplaner (DIN 18015)',
      subtitle: 'Steckdosen, Lichtschalter, Höhenmaße & Verlegezonen',
      icon: Zap,
      color: 'text-amber-400',
    },
    'distribution_board': {
      title: 'Verteilerschrank & Unterverteilung (Hutschiene)',
      subtitle: 'Leitungsschutzschalter, RCDs & Phasenbalance',
      icon: Cpu,
      color: 'text-indigo-400',
    },
    'smart_home': {
      title: 'Smart Home Visual Gateway & Logik-Editor',
      subtitle: 'WENN-DANN Regeln, Automationen & Gerätesteuerung',
      icon: Network,
      color: 'text-emerald-400',
    },
    'terrarium': {
      title: 'Terrarium Controller & Tropenklima',
      subtitle: 'UV-Lampen, Beregnungsautomatik, Heizung & Sensoren',
      icon: Sun,
      color: 'text-lime-400',
    },
    'energy_realtime': {
      title: 'Echtzeit-Energieverbrauch & Netzlast',
      subtitle: 'Live-Wattmessung, Lastspitzen & Kostenanalyse',
      icon: Activity,
      color: 'text-cyan-400',
    },
    'ai_auditor': {
      title: 'KI-Auditor: DIN 18015 & VDE Prüfbericht',
      subtitle: 'Automatisierte Normprüfung, Sicherheitswarnungen & Lastoptimierung',
      icon: Bot,
      color: 'text-rose-400',
    },
  };

  const currentInfo = viewInfo[activeView];
  const Icon = currentInfo.icon;

  if (isMinimized) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{currentInfo.title}</h3>
            <p className="text-xs text-slate-400 mt-1">Das Fenster ist minimiert.</p>
          </div>
          <button
            onClick={onRestore}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95"
          >
            Fenster wiederherstellen
          </button>
        </div>
      </div>
    );
  }

  // Snap layout styles
  let layoutClasses = 'w-full h-full';
  if (snapLayout === 'window') {
    layoutClasses = 'w-[96vw] max-w-7xl h-[calc(100%-1rem)] my-auto mx-auto rounded-2xl border border-white/15 shadow-2xl shadow-slate-950/90 overflow-hidden';
  } else if (snapLayout === 'split-left') {
    layoutClasses = 'w-full lg:w-1/2 h-full border-r border-white/10';
  } else if (snapLayout === 'split-right') {
    layoutClasses = 'w-full lg:w-1/2 h-full ml-auto border-l border-white/10';
  }

  return (
    <div className={`flex flex-col bg-slate-950 relative overflow-hidden transition-all duration-200 ${layoutClasses}`}>
      {/* Windows In-Window Sub-Header / Breadcrumb Toolbar */}
      <div className="h-8 px-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between shrink-0 select-none text-xs">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-slate-400 overflow-hidden">
          <span className="text-slate-500 hover:text-slate-300 transition cursor-pointer">VoltCAD</span>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
          <span className="text-slate-500 hover:text-slate-300 transition cursor-pointer hidden sm:inline">Projekt</span>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 hidden sm:inline" />
          <div className="flex items-center gap-1.5 font-semibold text-slate-200 truncate">
            <Icon className={`w-3.5 h-3.5 ${currentInfo.color} shrink-0`} />
            <span className="truncate">{currentInfo.title}</span>
          </div>
        </div>

        {/* DIN Status Tag in Sub-Header */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950/60 text-sky-400 border border-sky-800/40 hidden md:flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-sky-400" />
            DIN 18015-1/-2
          </span>
          <span className="text-[10px] text-slate-500 hidden xl:inline">
            {currentInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Main Module Content View */}
      <div className="flex-1 w-full h-[calc(100%-2rem)] overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};

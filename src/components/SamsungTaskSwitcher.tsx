import React from 'react';
import { 
  Box, 
  Zap, 
  Cpu, 
  Network, 
  Sun, 
  Activity, 
  Bot, 
  X, 
  Check, 
  Search, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ActiveAppView } from '../types';
import { triggerSamsungHaptic } from '../utils/samsungHaptics';
import { soundSynth } from '../utils/audioSynth';

interface SamsungTaskSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  amoledBlack?: boolean;
}

export const SamsungTaskSwitcher: React.FC<SamsungTaskSwitcherProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  amoledBlack = false,
}) => {
  if (!isOpen) return null;

  const appCards: {
    id: ActiveAppView;
    title: string;
    category: string;
    icon: any;
    color: string;
    accentBg: string;
    description: string;
    previewElements: string[];
  }[] = [
    {
      id: '3d_cad',
      title: '3D CAD Raum & Möbel',
      category: 'Konstruktion',
      icon: Box,
      color: 'text-sky-400',
      accentBg: 'from-sky-950/60 to-slate-900',
      description: '3D Raummodellierung, Möblierung, Wanddurchbrüche & Bemaßung',
      previewElements: ['Wohnzimmer 41.3 m²', 'Wandstärke 18cm', 'Parkett Eiche'],
    },
    {
      id: 'electrical_planner',
      title: 'Elektro- & Verlegepläne',
      category: 'DIN 18015',
      icon: Zap,
      color: 'text-amber-400',
      accentBg: 'from-amber-950/60 to-slate-900',
      description: 'Installationszonen, Schalter, Steckdosen & Leitungsführung',
      previewElements: ['Installationszone 30cm', 'NYM-J 3x1.5', 'ΔU < 3% Konform'],
    },
    {
      id: 'distribution_board',
      title: 'Verteilerschrank & UV',
      category: 'Schaltschrank',
      icon: Cpu,
      color: 'text-indigo-400',
      accentBg: 'from-indigo-950/60 to-slate-900',
      description: 'Hutschienen, RCD/FI-Schutzschalter & Leitungsschutzschalter B16',
      previewElements: ['RCD Typ A 30mA', 'LS B16 1-polig', 'Phasen L1/L2/L3 Symmetrie'],
    },
    {
      id: 'smart_home',
      title: 'Smart Home Logik-Editor',
      category: 'Automatisierung',
      icon: Network,
      color: 'text-emerald-400',
      accentBg: 'from-emerald-950/60 to-slate-900',
      description: 'WENN-DANN Visueller Editor, Zigbee/Matter Aktoren & Szenen',
      previewElements: ['Bewegung -> Licht 80%', 'Nachtmodus aktiv', 'Matter Gateway'],
    },
    {
      id: 'energy_realtime',
      title: 'Echtzeit-Energiemonitor',
      category: 'Monitoring',
      icon: Activity,
      color: 'text-rose-400',
      accentBg: 'from-rose-950/60 to-slate-900',
      description: 'Wirkleistung in Watt, Stromkosten, CO₂-Bilanz & Netzfrequenz',
      previewElements: ['Netzfrequenz 50.01 Hz', 'Phasenlast', 'Kosten 0.38 €/kWh'],
    },
    {
      id: 'ai_auditor',
      title: 'KI DIN 18015 Auditor',
      category: 'Normenprüfung',
      icon: Bot,
      color: 'text-purple-400',
      accentBg: 'from-purple-950/60 to-slate-900',
      description: 'Automatische Normprüfung, Sicherheitsabstände & Fehlersuche',
      previewElements: ['DIN VDE 0100-520', 'Schutzbereich Bad', 'Leitungsreserve'],
    },
    {
      id: 'terrarium',
      title: 'Terrarium Klimasteuerung',
      category: 'IoT Regelung',
      icon: Sun,
      color: 'text-amber-300',
      accentBg: 'from-amber-950/50 to-slate-900',
      description: 'UV-B Beleuchtung, Basking Spot, Nebler & Tag/Nacht-Zyklen',
      previewElements: ['Temperatur 28.5°C', 'Luftfeuchte 68%', 'UV-B Timer AN'],
    },
  ];

  const handleSelect = (view: ActiveAppView) => {
    triggerSamsungHaptic('selection');
    soundSynth.playConfirmation();
    onSelectView(view);
    onClose();
  };

  const handleCloseAll = () => {
    triggerSamsungHaptic('heavy');
    soundSynth.playConfirmation();
    onSelectView('3d_cad');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Top Bar with One UI App Switcher Title */}
      <div className="flex items-center justify-between pt-2 pb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-sky-400 tracking-wider uppercase">
            Samsung One UI
          </span>
          <span className="text-white text-sm font-extrabold">• Kürzlich verwendet</span>
        </div>
        <button
          onClick={() => {
            triggerSamsungHaptic('light');
            onClose();
          }}
          className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Horizontal Scrollable App Cards Carousel */}
      <div className="flex-1 flex items-center overflow-x-auto py-4 px-2 gap-4 sm:gap-6 snap-x snap-mandatory no-scrollbar">
        {appCards.map((app) => {
          const Icon = app.icon;
          const isCurrent = activeView === app.id;

          return (
            <div
              key={app.id}
              onClick={() => handleSelect(app.id)}
              className={`w-[260px] sm:w-[320px] h-[380px] sm:h-[440px] shrink-0 rounded-3xl p-4 flex flex-col justify-between cursor-pointer snap-center transition-all duration-200 active:scale-95 border ${
                isCurrent
                  ? 'border-sky-400 ring-2 ring-sky-500/40 shadow-2xl shadow-sky-500/30'
                  : 'border-slate-800/80 hover:border-slate-700 shadow-xl'
              } ${
                amoledBlack ? 'bg-zinc-950' : 'bg-slate-900/90'
              }`}
            >
              {/* App Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-2xl bg-slate-800/90 ${app.color} shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{app.title}</h4>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      {app.category}
                    </span>
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 font-bold">
                    Aktiv
                  </span>
                )}
              </div>

              {/* App Card Mockup Preview */}
              <div className={`flex-1 my-3 rounded-2xl bg-gradient-to-br ${app.accentBg} border border-slate-800/60 p-3.5 flex flex-col justify-between overflow-hidden relative`}>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {app.description}
                </p>

                {/* Simulated Data Pills */}
                <div className="space-y-1.5">
                  {app.previewElements.map((el, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between"
                    >
                      <span>{el}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tap to switch button */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Tippen zum Öffnen</span>
                <span className="font-bold text-sky-400 flex items-center gap-1">
                  Wechseln →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: One UI "Alle schließen / Hauptansicht" Button */}
      <div className="pt-3 pb-2 flex flex-col items-center gap-2">
        <button
          onClick={handleCloseAll}
          className="px-6 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition cursor-pointer shadow-lg active:scale-95 flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          <span>Alle schließen (Zurück zu 3D CAD)</span>
        </button>
        <span className="text-[10px] text-slate-500">
          Samsung One UI 6.1 Multi-Window Modulverwaltung
        </span>
      </div>
    </div>
  );
};

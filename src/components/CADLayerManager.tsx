import React from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Box, 
  Zap, 
  Ruler, 
  Cable, 
  Droplets, 
  Lightbulb, 
  X, 
  Sparkles,
  Check,
  Minimize2
} from 'lucide-react';
import { soundSynth } from '../utils/audioSynth';

export interface CADLayerManagerProps {
  isOpen: boolean;
  onClose: () => void;
  // Layers
  showFurniture: boolean;
  onToggleFurniture: (val?: boolean) => void;
  showElectrical: boolean;
  onToggleElectrical: (val?: boolean) => void;
  showDimensions: boolean;
  onToggleDimensions: (val?: boolean) => void;
  showWiring: boolean;
  onToggleWiring: (val?: boolean) => void;
  showPipes: boolean;
  onTogglePipes: (val?: boolean) => void;
  showLighting: boolean;
  onToggleLighting: (val?: boolean) => void;
  // Counts & stats
  furnitureCount: number;
  electricalCount: number;
  wiringCount: number;
  pipesCount: number;
  roomCount: number;
  // Quick presets
  onShowAll: () => void;
  onHideAll: () => void;
  onFocusElectrical: () => void;
  onFocusArchitecture: () => void;
}

export const CADLayerManager: React.FC<CADLayerManagerProps> = ({
  isOpen,
  onClose,
  showFurniture,
  onToggleFurniture,
  showElectrical,
  onToggleElectrical,
  showDimensions,
  onToggleDimensions,
  showWiring,
  onToggleWiring,
  showPipes,
  onTogglePipes,
  showLighting,
  onToggleLighting,
  furnitureCount,
  electricalCount,
  wiringCount,
  pipesCount,
  roomCount,
  onShowAll,
  onHideAll,
  onFocusElectrical,
  onFocusArchitecture,
}) => {
  if (!isOpen) return null;

  const layers = [
    {
      id: 'furniture',
      name: 'Möbel & Einrichtung',
      description: 'Möbel, Betten, Schränke, Tische & Spülen',
      count: `${furnitureCount} Objekte`,
      visible: showFurniture,
      color: 'sky',
      icon: Box,
      toggle: () => {
        soundSynth.playClick();
        onToggleFurniture();
      },
    },
    {
      id: 'electrical',
      name: 'Elektro-Installationen',
      description: 'Steckdosen, Schalter, Leuchten & UV (DIN 18015)',
      count: `${electricalCount} Betriebsmittel`,
      visible: showElectrical,
      color: 'amber',
      icon: Zap,
      toggle: () => {
        soundSynth.playClick();
        onToggleElectrical();
      },
    },
    {
      id: 'dimensions',
      name: 'Bemaßungen & Maßketten',
      description: 'Wandlängen, Raummaße & Abstands-Bemaßungen',
      count: `${roomCount} Raummaße`,
      visible: showDimensions,
      color: 'indigo',
      icon: Ruler,
      toggle: () => {
        soundSynth.playClick();
        onToggleDimensions();
      },
    },
    {
      id: 'wiring',
      name: 'Kabeltrassen & Rohre',
      description: 'Verrohrte Leitungszüge & NYM-Leitungen',
      count: `${wiringCount} Trassen`,
      visible: showWiring,
      color: 'emerald',
      icon: Cable,
      toggle: () => {
        soundSynth.playClick();
        onToggleWiring();
      },
    },
    {
      id: 'pipes',
      name: 'Sanitär & Gas (DIN 1988/DVGW)',
      description: 'Kalt-/Warmwasser, Abwasser & Gasrohre',
      count: `${pipesCount} Segmente`,
      visible: showPipes,
      color: 'cyan',
      icon: Droplets,
      toggle: () => {
        soundSynth.playClick();
        onTogglePipes();
      },
    },
    {
      id: 'lighting',
      name: 'Live-Lichtsimulation',
      description: 'Punktstrahler, Deckenleuchten & Lichtkegel',
      count: 'Lichtberechnung',
      visible: showLighting,
      color: 'yellow',
      icon: Lightbulb,
      toggle: () => {
        soundSynth.playClick();
        onToggleLighting();
      },
    },
  ];

  const activeCount = layers.filter(l => l.visible).length;

  return (
    <aside 
      aria-label="CAD Layer-Manager"
      className="absolute top-16 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
              <span>CAD Layer-Manager</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-950 text-sky-300 border border-sky-800/60">
                {activeCount}/{layers.length} aktiv
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Ebenen einzeln ein- oder ausblenden
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Layer-Manager schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Preset Buttons */}
      <div className="p-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => {
            soundSynth.playClick();
            onShowAll();
          }}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-medium flex items-center gap-1 transition shrink-0 cursor-pointer"
          title="Alle Layer anzeigen"
        >
          <Eye className="w-3 h-3 text-sky-400" />
          <span>Alle an</span>
        </button>

        <button
          onClick={() => {
            soundSynth.playClick();
            onHideAll();
          }}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white font-medium flex items-center gap-1 transition shrink-0 cursor-pointer"
          title="Alle Layer ausblenden"
        >
          <EyeOff className="w-3 h-3 text-slate-500" />
          <span>Alle aus</span>
        </button>

        <button
          onClick={() => {
            soundSynth.playConfirmation();
            onFocusElectrical();
          }}
          className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1 transition shrink-0 cursor-pointer"
          title="Fokus auf Elektro & Bemaßung: Möbel ausblenden"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Elektro-Fokus</span>
        </button>

        <button
          onClick={() => {
            soundSynth.playClick();
            onFocusArchitecture();
          }}
          className="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-medium flex items-center gap-1 transition shrink-0 cursor-pointer"
          title="Fokus auf Architektur & Möbel"
        >
          <Box className="w-3 h-3 text-sky-400" />
          <span>Möbel-Fokus</span>
        </button>
      </div>

      {/* Layer List */}
      <div className="p-2 space-y-1.5 max-h-[60vh] overflow-y-auto">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isVisible = layer.visible;

          const colorClasses: Record<string, { badge: string; iconColor: string }> = {
            sky: {
              badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
              iconColor: 'text-sky-400',
            },
            amber: {
              badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
              iconColor: 'text-amber-400',
            },
            indigo: {
              badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
              iconColor: 'text-indigo-400',
            },
            emerald: {
              badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
              iconColor: 'text-emerald-400',
            },
            cyan: {
              badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
              iconColor: 'text-cyan-400',
            },
            yellow: {
              badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
              iconColor: 'text-yellow-300',
            },
          };

          const activeStyling = colorClasses[layer.color] || colorClasses.sky;

          return (
            <div
              key={layer.id}
              onClick={layer.toggle}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                isVisible
                  ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                  : 'bg-slate-950/40 border-slate-800/50 opacity-60 hover:opacity-85'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
                    isVisible
                      ? activeStyling.badge
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isVisible ? activeStyling.iconColor : 'text-slate-500'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isVisible ? 'text-slate-100' : 'text-slate-400 line-through'
                      }`}
                    >
                      {layer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                    <span className="font-mono text-slate-400 truncate">
                      {layer.count}
                    </span>
                    <span>•</span>
                    <span className="truncate text-slate-500 max-w-[130px]">
                      {layer.description}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Switch / Eye */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    layer.toggle();
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isVisible
                      ? 'bg-slate-700/60 hover:bg-slate-750 text-sky-400'
                      : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                  title={isVisible ? 'Ebene ausblenden' : 'Ebene einblenden'}
                >
                  {isVisible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>

                <div
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    isVisible ? 'bg-sky-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                      isVisible ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/70 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Tipp: Klicke auf eine Ebene zum Umschalten</span>
        <button
          onClick={onClose}
          className="text-sky-400 hover:text-sky-300 font-medium hover:underline cursor-pointer"
        >
          Fertig
        </button>
      </div>
    </aside>
  );
};

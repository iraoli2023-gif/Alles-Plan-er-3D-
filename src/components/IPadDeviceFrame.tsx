import React from 'react';
import { Tablet, Maximize2, Smartphone } from 'lucide-react';

export type IPadViewportMode = 'fullscreen' | 'ipad_pro_13' | 'ipad_air_11' | 'ipad_mini';

interface IPadDeviceFrameProps {
  viewportMode: IPadViewportMode;
  onChangeViewportMode: (mode: IPadViewportMode) => void;
  children: React.ReactNode;
}

export const IPadDeviceFrame: React.FC<IPadDeviceFrameProps> = ({
  viewportMode,
  onChangeViewportMode,
  children,
}) => {
  if (viewportMode === 'fullscreen') {
    return <div className="w-full h-full relative overflow-hidden">{children}</div>;
  }

  // Dimension presets for desktop simulation
  const frameConfigs: Record<Exclude<IPadViewportMode, 'fullscreen'>, { 
    aspect: string; 
    maxWidth: string; 
    label: string; 
    sub: string; 
    resolution: string;
    bezelClass: string;
  }> = {
    ipad_pro_13: {
      aspect: 'aspect-[4/3]',
      maxWidth: 'max-w-[1240px]',
      label: 'iPad Pro 12.9″ / 13″',
      sub: 'Liquid Retina XDR • M4 / Pro Workflow',
      resolution: '2732 × 2048 px',
      bezelClass: 'rounded-[38px] p-3.5',
    },
    ipad_air_11: {
      aspect: 'aspect-[10/7]',
      maxWidth: 'max-w-[1100px]',
      label: 'iPad Air / Pro 11″',
      sub: 'Liquid Retina • Allrounder',
      resolution: '2388 × 1668 px',
      bezelClass: 'rounded-[32px] p-3',
    },
    ipad_mini: {
      aspect: 'aspect-[3/2]',
      maxWidth: 'max-w-[960px]',
      label: 'iPad Mini (8.3″)',
      sub: 'Kompakter Baustellen-Begleiter',
      resolution: '2266 × 1488 px',
      bezelClass: 'rounded-[28px] p-2.5',
    },
  };

  const currentConfig = frameConfigs[viewportMode];

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-start overflow-hidden p-2 sm:p-3 select-none">
      {/* Simulation Top Bar Controls */}
      <div className="w-full max-w-[1240px] mb-2 flex items-center justify-between gap-2 px-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-sky-400 font-semibold shadow-sm">
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">iPadOS Simulator:</span>
            <span className="text-white font-bold">{currentConfig.label}</span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">({currentConfig.resolution})</span>
          </div>
        </div>

        {/* Viewport Format Switchers */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs shadow-sm">
          <button
            onClick={() => onChangeViewportMode('ipad_pro_13')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              viewportMode === 'ipad_pro_13'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            13″ Pro
          </button>

          <button
            onClick={() => onChangeViewportMode('ipad_air_11')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              viewportMode === 'ipad_air_11'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            11″ Air
          </button>

          <button
            onClick={() => onChangeViewportMode('ipad_mini')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              viewportMode === 'ipad_mini'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mini
          </button>

          <button
            onClick={() => onChangeViewportMode('fullscreen')}
            className="px-2.5 py-1 rounded-lg font-semibold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition"
            title="Auf vollen Bildschirm erweitern (iPad Native)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vollbild</span>
          </button>
        </div>
      </div>

      {/* iPad Hardware Bezel Frame */}
      <div 
        className={`w-full ${currentConfig.maxWidth} flex-1 min-h-0 bg-slate-900 border-4 border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] shadow-sky-950/20 relative flex flex-col items-center justify-between ${currentConfig.bezelClass} ring-1 ring-white/10 transition-all duration-300 mb-2`}
      >
        {/* Top Edge: Camera / FaceID Sensor */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-50 pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-slate-700" />
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-800/80" />
        </div>

        {/* iPad Screen Area */}
        <div className="w-full h-full bg-slate-950 rounded-[22px] overflow-hidden relative flex flex-col shadow-inner">
          {children}

          {/* iPad Home Indicator Bar */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full pointer-events-none z-50 transition-opacity" />
        </div>
      </div>
    </div>
  );
};

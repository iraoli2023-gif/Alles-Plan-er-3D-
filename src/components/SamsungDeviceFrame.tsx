import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  RotateCw, 
  Maximize2, 
  Monitor, 
  Sparkles,
  ShieldCheck,
  PenTool
} from 'lucide-react';
import { triggerSamsungHaptic } from '../utils/samsungHaptics';

export type SamsungDevicePreset = 'galaxy_s24_ultra' | 'galaxy_z_fold' | 'galaxy_tab_s9' | 'native_fullscreen';

interface SamsungDeviceFrameProps {
  devicePreset: SamsungDevicePreset;
  onChangeDevicePreset: (preset: SamsungDevicePreset) => void;
  onSwitchToWindowsMode: () => void;
  children: React.ReactNode;
}

export const SamsungDeviceFrame: React.FC<SamsungDeviceFrameProps> = ({
  devicePreset,
  onChangeDevicePreset,
  onSwitchToWindowsMode,
  children,
}) => {
  const [isLandscape, setIsLandscape] = useState(false);

  // If native fullscreen is chosen, don't wrap in bezel frame
  if (devicePreset === 'native_fullscreen') {
    return (
      <div className="w-full h-full relative overflow-hidden bg-black">
        {children}
      </div>
    );
  }

  // Configurations for different Samsung Galaxy hardware devices
  const deviceConfigs: Record<Exclude<SamsungDevicePreset, 'native_fullscreen'>, {
    label: string;
    sub: string;
    portraitWidth: string;
    portraitHeight: string;
    landscapeWidth: string;
    landscapeHeight: string;
    bezelClass: string;
    hasCameraPunch: boolean;
    aspectRatioNotice: string;
  }> = {
    galaxy_s24_ultra: {
      label: 'Samsung Galaxy S24 Ultra',
      sub: 'Dynamic AMOLED 2X • 120Hz • S-Pen Titanium',
      portraitWidth: 'w-[390px]',
      portraitHeight: 'h-[820px]',
      landscapeWidth: 'w-[820px]',
      landscapeHeight: 'h-[440px]',
      bezelClass: 'rounded-[32px] border-[10px] border-zinc-800 shadow-2xl shadow-black ring-1 ring-zinc-700/60',
      hasCameraPunch: true,
      aspectRatioNotice: '19.5:9 QHD+',
    },
    galaxy_z_fold: {
      label: 'Samsung Galaxy Z Fold 6 (Entfaltet)',
      sub: '7.6″ Infinity Flex Display • Dual-Screen CAD',
      portraitWidth: 'w-[640px]',
      portraitHeight: 'h-[740px]',
      landscapeWidth: 'w-[740px]',
      landscapeHeight: 'h-[640px]',
      bezelClass: 'rounded-[26px] border-[8px] border-zinc-800 shadow-2xl shadow-black ring-1 ring-zinc-700/60',
      hasCameraPunch: true,
      aspectRatioNotice: '21.6:18 QXGA+',
    },
    galaxy_tab_s9: {
      label: 'Samsung Galaxy Tab S9 Ultra',
      sub: '14.6″ Super AMOLED • Baustellen- & DeX Meister-Tablet',
      portraitWidth: 'w-[720px]',
      portraitHeight: 'h-[920px]',
      landscapeWidth: 'w-[960px]',
      landscapeHeight: 'h-[640px]',
      bezelClass: 'rounded-[24px] border-[10px] border-zinc-800 shadow-2xl shadow-black ring-1 ring-zinc-700/60',
      hasCameraPunch: true,
      aspectRatioNotice: '16:10 WQXGA+',
    },
  };

  const currentConfig = deviceConfigs[devicePreset];

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-between overflow-hidden p-2 sm:p-3 select-none">
      {/* Simulation Top Bar Controls */}
      <div className="w-full max-w-4xl mb-2 flex items-center justify-between gap-2 px-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-sky-400 font-semibold shadow-sm">
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Samsung Galaxy Simulator:</span>
            <span className="text-white font-bold">{currentConfig.label}</span>
            <span className="text-[10px] text-slate-500 hidden md:inline">({currentConfig.aspectRatioNotice})</span>
          </div>
        </div>

        {/* Device Switcher & Rotate & Windows Return */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs shadow-sm">
            <button
              onClick={() => {
                triggerSamsungHaptic('light');
                onChangeDevicePreset('galaxy_s24_ultra');
              }}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                devicePreset === 'galaxy_s24_ultra'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              S24 Ultra
            </button>

            <button
              onClick={() => {
                triggerSamsungHaptic('light');
                onChangeDevicePreset('galaxy_z_fold');
              }}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                devicePreset === 'galaxy_z_fold'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Z Fold 6
            </button>

            <button
              onClick={() => {
                triggerSamsungHaptic('light');
                onChangeDevicePreset('galaxy_tab_s9');
              }}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                devicePreset === 'galaxy_tab_s9'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tab S9
            </button>

            <button
              onClick={() => {
                triggerSamsungHaptic('light');
                onChangeDevicePreset('native_fullscreen');
              }}
              className="px-2 py-1 rounded-lg text-slate-400 hover:text-white font-semibold transition"
              title="Vollbild ohne Rahmen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rotate Portrait / Landscape */}
          <button
            onClick={() => {
              triggerSamsungHaptic('medium');
              setIsLandscape(!isLandscape);
            }}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Display drehen (Hochformat / Querformat)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Return to Windows 11 Desktop */}
          <button
            onClick={() => {
              triggerSamsungHaptic('selection');
              onSwitchToWindowsMode();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-950 to-indigo-950 border border-sky-500/40 text-xs font-bold text-sky-300 hover:text-white flex items-center gap-1.5 transition"
            title="Zu Windows 11 Desktop-Ansicht zurückkehren"
          >
            <Monitor className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Windows 11 Modus</span>
          </button>
        </div>
      </div>

      {/* Hardware Frame Area */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-1">
        <div
          className={`${
            isLandscape
              ? `${currentConfig.landscapeWidth} ${currentConfig.landscapeHeight}`
              : `${currentConfig.portraitWidth} ${currentConfig.portraitHeight}`
          } max-w-full max-h-full ${currentConfig.bezelClass} bg-black relative flex flex-col overflow-hidden transition-all duration-300`}
        >
          {/* Top Camera Punch Hole (Infinity-O) */}
          {currentConfig.hasCameraPunch && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-3 h-3 rounded-full bg-zinc-950 border border-zinc-800 pointer-events-none flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            </div>
          )}

          {/* Screen Content */}
          <div className="w-full h-full relative overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="w-full max-w-4xl mt-1.5 flex items-center justify-between text-[11px] text-slate-500 px-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Samsung One UI 6.1 • S-Pen & Dynamic AMOLED 2X Engine</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Auf einem echten Samsung Galaxy?</span>
          <button
            onClick={() => onChangeDevicePreset('native_fullscreen')}
            className="text-sky-400 hover:underline font-semibold"
          >
            Zu 100% Vollbild wechseln
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { TerrariumConfig } from '../types';
import { 
  Sun, 
  Flame, 
  Droplets, 
  Clock, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Power, 
  AlertCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface TerrariumControllerProps {
  terrarium: TerrariumConfig;
  onUpdateTerrarium: (updated: TerrariumConfig) => void;
}

export const TerrariumController: React.FC<TerrariumControllerProps> = ({
  terrarium,
  onUpdateTerrarium,
}) => {
  const [isSprayingManual, setIsSprayingManual] = useState(false);
  const terrariumRef = useRef(terrarium);
  terrariumRef.current = terrarium;
  const sprayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (sprayTimeoutRef.current) {
        clearTimeout(sprayTimeoutRef.current);
      }
    };
  }, []);

  // Toggle UV Lamp
  const toggleUVLamp = () => {
    onUpdateTerrarium({
      ...terrarium,
      uvLampState: !terrarium.uvLampState,
      statusLog: [
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          message: `UV-B Lampe manuell ${!terrarium.uvLampState ? 'eingeschaltet' : 'ausgeschaltet'}`,
          type: 'action',
        },
        ...terrarium.statusLog,
      ],
    });
  };

  // Toggle Heat Lamp
  const toggleHeatLamp = () => {
    onUpdateTerrarium({
      ...terrarium,
      heatLampState: !terrarium.heatLampState,
      statusLog: [
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          message: `Wärmespot manuell ${!terrarium.heatLampState ? 'eingeschaltet' : 'ausgeschaltet'}`,
          type: 'action',
        },
        ...terrarium.statusLog,
      ],
    });
  };

  // Trigger manual spray for 15 seconds
  const handleManualSpray = () => {
    setIsSprayingManual(true);
    onUpdateTerrarium({
      ...terrarium,
      foggerState: true,
      currentHumidity: Math.min(85, terrarium.currentHumidity + 12),
      statusLog: [
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          message: 'Manuelle Beregnung / Sprühintervall (15s) ausgelöst',
          type: 'action',
        },
        ...terrarium.statusLog,
      ],
    });

    if (sprayTimeoutRef.current) {
      clearTimeout(sprayTimeoutRef.current);
    }
    sprayTimeoutRef.current = setTimeout(() => {
      setIsSprayingManual(false);
      onUpdateTerrarium({
        ...terrariumRef.current,
        foggerState: false,
      });
    }, 15000);
  };

  // Mode Switch
  const handleModeChange = (mode: TerrariumConfig['mode']) => {
    onUpdateTerrarium({
      ...terrarium,
      mode,
      statusLog: [
        {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          message: `Betriebsmodus geändert auf: ${mode}`,
          type: 'info',
        },
        ...terrarium.statusLog,
      ],
    });
  };

  // Calculate live terrarium wattage
  const activeWatts = 
    (terrarium.uvLampState ? terrarium.uvLampWattage : 0) +
    (terrarium.heatLampState ? Math.round(terrarium.heatLampWattage * (terrarium.heatLampDimPct / 100)) : 0) +
    (terrarium.foggerState || isSprayingManual ? terrarium.foggerWattage : 0) +
    12; // Base controller logic & sensors

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sun className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">
              {terrarium.name}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Spezies: <span className="text-emerald-300 font-semibold">{terrarium.species}</span> • Maße: {terrarium.dimensionsCm.w}×{terrarium.dimensionsCm.d}×{terrarium.dimensionsCm.h}cm
          </p>
        </div>

        {/* Mode Selector & Quick Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['Auto (Tag/Nacht)', 'Manuell', 'Wartung / Fütterung'] as const).map(m => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  terrarium.mode === m
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={handleManualSpray}
            disabled={isSprayingManual}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
          >
            <Droplets className="w-3.5 h-3.5" />
            {isSprayingManual ? 'Sprüht aktiv (15s)...' : 'Manuell Sprühen'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-6">
        {/* Telemetry Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sonnenplatz Basking Spot Temp */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Sonnenplatz (Warmzone)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/60 text-[10px] font-bold text-amber-300">
                Soll: {terrarium.targetTempWarm}°C
              </span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white font-mono flex items-baseline gap-1">
              {terrarium.currentTempWarm} <span className="text-sm font-normal text-slate-400">°C</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>PID Regler: <strong className="text-amber-300">{terrarium.heatLampDimPct}%</strong></span>
              <span className="text-emerald-400">Stabil</span>
            </div>
          </div>

          {/* Kaltzone / Schattenbereich Temp */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-sky-400" />
                Schattenbereich (Kaltzone)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-800/60 text-[10px] font-bold text-sky-300">
                Soll: {terrarium.targetTempCold}°C
              </span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white font-mono flex items-baseline gap-1">
              {terrarium.currentTempCold} <span className="text-sm font-normal text-slate-400">°C</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Temperaturgradient:</span>
              <span className="font-semibold text-sky-300">Δ 12.6°C optimal</span>
            </div>
          </div>

          {/* Relative Luftfeuchtigkeit */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Luftfeuchtigkeit
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-[10px] font-bold text-blue-300">
                Soll: {terrarium.targetHumidity}%
              </span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white font-mono flex items-baseline gap-1">
              {terrarium.currentHumidity} <span className="text-sm font-normal text-slate-400">% rF</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Nächster Zyklus:</span>
              <span className="text-slate-300 font-mono">in 1h 45min</span>
            </div>
          </div>

          {/* UV-B Index & Bestrahlung */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                UV-B Solarstrahlung
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/60 text-[10px] font-bold text-purple-300">
                Ferguson Zone 3
              </span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-purple-300 font-mono flex items-baseline gap-1">
              {terrarium.uvIndex} <span className="text-sm font-normal text-slate-400">UVI</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Leuchtmittel:</span>
              <span className="text-purple-300 font-semibold">Bright Sun HID 70W</span>
            </div>
          </div>
        </div>

        {/* ACTUATORS & HARDWARE CHANNELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 1. UV-B Beleuchtungs-Kanal */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-950 border border-purple-800 text-purple-400">
                  <Sun className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">UV-B Solar Metal Halide</h4>
                  <span className="text-[10px] text-slate-400">Vorschaltgerät EVG 70W</span>
                </div>
              </div>
              <button
                onClick={toggleUVLamp}
                className={`p-2 rounded-xl transition ${
                  terrarium.uvLampState
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Zeitplan (Zeitschaltuhr):</span>
                <span className="font-mono text-purple-300 font-bold">{terrarium.dayStart} – {terrarium.nightStart} Uhr</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Leistungsaufnahme:</span>
                <span className="font-mono text-white font-bold">{terrarium.uvLampWattage} W</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Restlebensdauer Brenner:</span>
                <span className="text-emerald-400 font-mono">1.840 Std. (68%)</span>
              </div>
            </div>
          </div>

          {/* 2. Wärmespot & Basking Lampe */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
                  <Flame className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">Basking Spot (Halogen)</h4>
                  <span className="text-[10px] text-slate-400">Phasenanschnitt-Dimmaktor</span>
                </div>
              </div>
              <button
                onClick={toggleHeatLamp}
                className={`p-2 rounded-xl transition ${
                  terrarium.heatLampState
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Dimm-Level:</span>
                <span className="font-mono text-amber-300 font-bold">{terrarium.heatLampDimPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={terrarium.heatLampDimPct}
                onChange={(e) => onUpdateTerrarium({ ...terrarium, heatLampDimPct: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-slate-300">
                <span>Leistungsaufnahme:</span>
                <span className="font-mono text-white font-bold">
                  {Math.round(terrarium.heatLampWattage * (terrarium.heatLampDimPct / 100))} W
                </span>
              </div>
            </div>
          </div>

          {/* 3. Beregnung / Ultraschallvernebler */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-950 border border-blue-800 text-blue-400">
                  <Droplets className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">Regen- & Nebelanlage</h4>
                  <span className="text-[10px] text-slate-400">Druckpumpe 15 bar & Düsen</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                terrarium.foggerState || isSprayingManual ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {terrarium.foggerState || isSprayingManual ? 'AKTIV' : 'STANDBY'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Intervall:</span>
                <span className="font-mono text-blue-300 font-bold">Alle 4 Stunden</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Sprühdauer:</span>
                <span className="font-mono text-white font-bold">{terrarium.foggerDurationSeconds} Sekunden</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Wassertank-Füllstand:</span>
                <span className="text-emerald-400 font-mono">4.2 Liter (84%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: LIVE POWER DRAW & LOGS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Live Terrarium Wattage Breakdown */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Aktuelle Leistungsaufnahme Terrarium
              </span>
              <div className="mt-2 text-3xl font-extrabold text-white font-mono">
                {activeWatts} <span className="text-sm font-normal text-slate-400">Watt</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Angeschlossen an Stromkreis <strong className="text-emerald-400 font-mono">F7 (RCBO B16/0.03A)</strong>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Tages-Energiebedarf:</span>
                <span className="font-mono text-white">~ 2.14 kWh / Tag</span>
              </div>
              <div className="flex justify-between">
                <span>Stromkosten Terrarium:</span>
                <span className="font-mono text-emerald-400 font-bold">~ 0.81 € / Tag</span>
              </div>
            </div>
          </div>

          {/* Automation Event Logs */}
          <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Automations-Ereignisprotokoll & Sensor-Historie
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {terrarium.statusLog.map((log, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="font-mono text-[11px] text-slate-400 mt-0.5">{log.time}</span>
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    log.type === 'action' ? 'bg-amber-400' : log.type === 'warn' ? 'bg-rose-400' : 'bg-sky-400'
                  }`} />
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

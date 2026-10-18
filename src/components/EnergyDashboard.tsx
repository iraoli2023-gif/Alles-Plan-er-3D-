import React, { useState, useEffect } from 'react';
import { EnergyMetrics, BreakerCircuit } from '../types';
import { 
  Zap, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Leaf, 
  Gauge, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Flame,
  Tv,
  Coffee,
  Lightbulb
} from 'lucide-react';

interface EnergyDashboardProps {
  energy: EnergyMetrics;
  circuits: BreakerCircuit[];
  onUpdatePrice?: (price: number) => void;
}

export const EnergyDashboard: React.FC<EnergyDashboardProps> = ({
  energy,
  circuits,
}) => {
  const [livePoints, setLivePoints] = useState<number[]>([
    2150, 2200, 2180, 2350, 2310, 2400, 2376, 2390, 2360, 2380, 2376
  ]);

  // Simulate subtle real-time fluctuations around actual currentTotalWatts
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePoints((prev) => {
        const jitter = (Math.random() - 0.5) * 25;
        const nextVal = Math.max(100, Math.round(energy.currentTotalWatts + jitter));
        const updated = [...prev.slice(1), nextVal];
        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [energy.currentTotalWatts]);

  // Derived financial & carbon estimates
  const dailyKWh = energy.todayKWh;
  const costToday = (dailyKWh * energy.electricityPriceKWh).toFixed(2);
  const costMonth = (dailyKWh * 30 * energy.electricityPriceKWh).toFixed(2);
  const costYear = (dailyKWh * 365 * energy.electricityPriceKWh).toFixed(0);
  const co2TodayKg = ((dailyKWh * energy.co2PerKWhGram) / 1000).toFixed(2);

  // Active circuit consumers ranked by wattage
  const rankedCircuits = [...circuits]
    .filter(c => c.state && c.activeLoadWatts > 0)
    .sort((a, b) => b.activeLoadWatts - a.activeLoadWatts);

  // SVG Chart path calculation
  const chartWidth = 500;
  const chartHeight = 120;
  const minVal = Math.min(...livePoints) * 0.85;
  const maxVal = Math.max(...livePoints) * 1.15 || 3000;
  const range = maxVal - minVal || 1;

  const pointsString = livePoints
    .map((val, idx) => {
      const x = (idx / (livePoints.length - 1)) * chartWidth;
      const y = chartHeight - ((val - minVal) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">Echtzeit-Energieüberwachung & Smart Meter</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Live-Messung via 3-Phasen Modbus Zähler • Netzfrequenz 50.0 Hz • S0-Impuls & Stromkostenanalyse.
          </p>
        </div>

        {/* Live Grid Status Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Netzfrequenz: {energy.gridFrequency} Hz
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-sky-400">
            Netzspannung: {energy.gridVoltage} V
          </span>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex-1 p-5 overflow-y-auto space-y-6">
        {/* TOP ROW: REALTIME TOTAL POWER + LIVE OSCILLOSCOPE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Realtime Power Card */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Momentanleistung (Aktueller Verbrauch)
              </span>
              <div className="mt-3 text-4xl font-extrabold text-white font-mono flex items-baseline gap-2">
                {energy.currentTotalWatts} <span className="text-lg font-normal text-slate-400">Watt</span>
              </div>
              <div className="text-sm font-semibold text-sky-400 font-mono mt-0.5">
                = {(energy.currentTotalWatts / 1000).toFixed(3)} kW
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-amber-400 font-mono font-bold block">L1</span>
                <span className="text-xs font-bold text-white font-mono">{energy.phaseL1Watts}W</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-sky-400 font-mono font-bold block">L2</span>
                <span className="text-xs font-bold text-white font-mono">{energy.phaseL2Watts}W</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-indigo-400 font-mono font-bold block">L3</span>
                <span className="text-xs font-bold text-white font-mono">{energy.phaseL3Watts}W</span>
              </div>
            </div>
          </div>

          {/* Live Dynamic Oscilloscope / Waveform Chart */}
          <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live-Lastganglinie (1,5s Abtastrate)
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE STREAM
              </span>
            </div>

            {/* SVG Waveform */}
            <div className="w-full h-32 bg-slate-950/80 rounded-xl border border-slate-800/80 p-2 flex items-center justify-center relative overflow-hidden">
              {/* Background grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />

              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-full overflow-visible relative z-10"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area fill */}
                <polygon
                  points={`0,${chartHeight} ${pointsString} ${chartWidth},${chartHeight}`}
                  fill="url(#lineGrad)"
                />
                {/* Continuous Line */}
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  points={pointsString}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Min: {Math.round(minVal / 0.85)} W</span>
              <span>Max: {Math.round(maxVal / 1.15)} W</span>
              <span>cos φ: 0.98 induktiv</span>
            </div>
          </div>
        </div>

        {/* FINANCIAL & CARBON FORECAST CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Heute KWh */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Tagesverbrauch
            </span>
            <div className="mt-2 text-2xl font-extrabold text-white font-mono">
              {dailyKWh} <span className="text-sm font-normal text-slate-400">kWh</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Seit 00:00 Uhr heute</span>
          </div>

          {/* Kosten Heute */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Kosten Heute (0.38 €/kWh)
            </span>
            <div className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">
              {costToday} <span className="text-sm font-normal text-slate-400">€</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Monatsprognose: ~{costMonth} €</span>
          </div>

          {/* Jahresschätzung */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              Jahresprognose
            </span>
            <div className="mt-2 text-2xl font-extrabold text-white font-mono">
              ~ {costYear} <span className="text-sm font-normal text-slate-400">€ / Jahr</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Bei aktuellem Nutzungsverhalten</span>
          </div>

          {/* CO2 Fußabdruck */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              CO2 Emission Heute
            </span>
            <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono">
              {co2TodayKg} <span className="text-sm font-normal text-slate-400">kg CO₂</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Deutscher Strommix (385g/kWh)</span>
          </div>
        </div>

        {/* CIRCUIT RANKING TABLE */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-400" />
              Verbraucher im Detail nach Stromkreis geordnet
            </h3>
            <span className="text-xs text-slate-400">Echtzeit-Sortierung nach Watt</span>
          </div>

          <div className="space-y-3">
            {rankedCircuits.map(c => {
              const pctOfTotal = ((c.activeLoadWatts / energy.currentTotalWatts) * 100).toFixed(1);

              return (
                <div key={c.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-sky-400">
                      {c.number}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{c.name}</h4>
                      <span className="text-[10px] text-slate-400">{c.description} • Phase {c.phase}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div className="w-32 hidden sm:block">
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-sky-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pctOfTotal}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{pctOfTotal}% der Gesamtlast</span>
                    </div>

                    <div className="font-mono text-sm font-bold text-amber-400 min-w-16">
                      {c.activeLoadWatts} W
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

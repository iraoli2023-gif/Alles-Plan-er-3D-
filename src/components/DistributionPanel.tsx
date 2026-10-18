import React, { useState } from 'react';
import { 
  BreakerCircuit, 
  RCDDevice, 
  EnergyMetrics 
} from '../types';
import { 
  Cpu, 
  ShieldAlert, 
  Zap, 
  ToggleLeft, 
  ToggleRight, 
  Gauge, 
  Printer, 
  CheckCircle, 
  AlertOctagon, 
  HelpCircle,
  Activity,
  Layers,
  Bot
} from 'lucide-react';

interface DistributionPanelProps {
  circuits: BreakerCircuit[];
  rcds: RCDDevice[];
  energy: EnergyMetrics;
  onToggleCircuit: (circuitId: string) => void;
  onTripRCD: (rcdId: string) => void;
  onResetRCD: (rcdId: string) => void;
  onOpenAIAuditor?: () => void;
}

export const DistributionPanel: React.FC<DistributionPanelProps> = ({
  circuits,
  rcds,
  energy,
  onToggleCircuit,
  onTripRCD,
  onResetRCD,
  onOpenAIAuditor,
}) => {
  const [activeTab, setActiveTab] = useState<'rack' | 'legend' | 'phases'>('rack');

  // Calculate phase currents in Amperes: I = P / (U * cos phi), U = 230V
  const currentL1 = (energy.phaseL1Watts / 230).toFixed(1);
  const currentL2 = (energy.phaseL2Watts / 230).toFixed(1);
  const currentL3 = (energy.phaseL3Watts / 230).toFixed(1);

  // Maximum allowed per phase (e.g. 63A main fuse)
  const maxPhaseA = 63;
  const pctL1 = Math.min(100, (Number(currentL1) / maxPhaseA) * 100);
  const pctL2 = Math.min(100, (Number(currentL2) / maxPhaseA) * 100);
  const pctL3 = Math.min(100, (Number(currentL3) / maxPhaseA) * 100);

  // Calculate phase unbalance (Schieflast)
  const maxPhaseW = Math.max(energy.phaseL1Watts, energy.phaseL2Watts, energy.phaseL3Watts);
  const minPhaseW = Math.min(energy.phaseL1Watts, energy.phaseL2Watts, energy.phaseL3Watts);
  const unbalanceW = maxPhaseW - minPhaseW;
  const isSchieflastOk = unbalanceW < 4600; // VDE guideline: max 4.6 kVA unbalance

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Cpu className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">
              Schaltkasten- & Unterverteiler (UV) Bestückung
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            DIN EN 61439 Hutschiene 35mm, SLS 63A, FI-Schutzschalter, LS-Automaten & Smart Home Aktoren.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('rack')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'rack'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hutschienen-Rack
          </button>
          <button
            onClick={() => setActiveTab('phases')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'phases'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Phasenlast (L1/L2/L3)
          </button>
          <button
            onClick={() => setActiveTab('legend')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'legend'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Stromkreislegende
          </button>

          {onOpenAIAuditor && (
            <button
              onClick={onOpenAIAuditor}
              className="px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm ml-1"
              title="KI-Auditor: Phasen-Lastmanagement & DIN 18015 Schutzmaßnahmen"
            >
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>KI-Auditor</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 p-5 overflow-y-auto">
        {activeTab === 'rack' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Verteilerschrank Gehäuse (Metal enclosure styling) */}
            <div className="p-5 bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl space-y-5">
              
              {/* ENCLOSURE HEADER */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                    Hager Volta / Striebel & John Unterverteiler • 4-reihig (48 TE)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Schutzart IP30 • Schutzklasse II • In = 63 A
                </span>
              </div>

              {/* REIHE 1: EINSPEISUNG, SLS & SMART ENERGY METER */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-sky-400">Reihe 1</span>
                  Einspeisung, SLS 63A, Überspannungsschutz & 3-Phasen Smart Meter
                </span>

                {/* DIN RAIL BASE */}
                <div className="relative p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto min-h-[110px]">
                  {/* Visual 35mm DIN Rail horizontal bar */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-5 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-800 pointer-events-none -z-0 opacity-40 shadow-inner" />

                  {/* 1. SLS-Schalter 3P 63A (3 TE) */}
                  <div className="relative z-10 w-24 p-2 bg-slate-800 border-2 border-slate-600 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md">
                    <div className="text-[9px] font-mono text-amber-400 font-bold leading-tight">SLS 63A<br/>3P E-Char</div>
                    <div className="my-auto text-center">
                      <div className="w-4 h-7 mx-auto bg-amber-500 rounded-sm shadow-sm" />
                    </div>
                    <div className="text-[8px] text-slate-400 text-center font-mono">Hager HTS</div>
                  </div>

                  {/* 2. Überspannungsschutz Typ 1+2 Kombi (4 TE) */}
                  <div className="relative z-10 w-28 p-2 bg-emerald-950/60 border-2 border-emerald-800/80 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md">
                    <div className="text-[9px] font-mono text-emerald-400 font-bold leading-tight">SPD Typ 1+2<br/>Kombiableiter</div>
                    <div className="flex justify-center gap-1 my-auto">
                      <span className="w-2.5 h-6 bg-emerald-500 rounded-xs" />
                      <span className="w-2.5 h-6 bg-emerald-500 rounded-xs" />
                      <span className="w-2.5 h-6 bg-emerald-500 rounded-xs" />
                    </div>
                    <div className="text-[8px] text-emerald-300 text-center font-mono">Status: OK</div>
                  </div>

                  {/* 3. Smart Energy Meter 3-Phasen Modbus (4 TE) */}
                  <div className="relative z-10 w-36 p-2 bg-sky-950/60 border-2 border-sky-800 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md">
                    <div className="flex items-center justify-between text-[9px] font-mono text-sky-400 font-bold">
                      <span>Smart Meter 3P</span>
                      <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="my-auto bg-slate-950 p-1 rounded border border-slate-800 text-center font-mono">
                      <div className="text-xs font-bold text-white tracking-wider">
                        { (energy.currentTotalWatts / 1000).toFixed(2) } kW
                      </div>
                      <div className="text-[8px] text-sky-300">
                        {energy.todayKWh.toFixed(1)} kWh • 50.0Hz
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-400 text-center font-mono">Modbus RS485</div>
                  </div>

                  {/* 4. Hauptschalter 63A (3 TE) */}
                  <div className="relative z-10 w-20 p-2 bg-slate-800 border-2 border-slate-600 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md">
                    <div className="text-[9px] font-mono text-slate-300 font-bold text-center">HAUPT-<br/>SCHALTER</div>
                    <div className="my-auto text-center">
                      <div className="w-4 h-7 mx-auto bg-rose-600 rounded-sm shadow-sm" />
                    </div>
                    <div className="text-[8px] text-slate-400 text-center font-mono">63A 400V</div>
                  </div>
                </div>
              </div>

              {/* REIHE 2: RCD 1 (WOHNEN & LICHT) + BREAKER F1, F2, F3 */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-sky-400">Reihe 2</span>
                  FI-1 (Wohnen & Allgemein) + Stromkreise F1 bis F3
                </span>

                <div className="relative p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto min-h-[110px]">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-5 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-800 pointer-events-none -z-0 opacity-40 shadow-inner" />

                  {/* RCD 1 */}
                  {rcds.slice(0, 1).map(rcd => (
                    <div 
                      key={rcd.id}
                      className={`relative z-10 w-28 p-2 border-2 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md transition ${
                        rcd.state ? 'bg-slate-800 border-slate-600' : 'bg-rose-950/80 border-rose-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-300 font-bold">
                        <span>FI-1 (40A)</span>
                        <span className="text-amber-400 font-mono">30mA</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 my-auto">
                        <button
                          onClick={() => rcd.state ? onTripRCD(rcd.id) : onResetRCD(rcd.id)}
                          title="Prüftaste 'T' (VDE Auslösetest)"
                          className="px-1.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-[10px] font-bold rounded shadow-sm"
                        >
                          T
                        </button>
                        <div 
                          onClick={() => rcd.state ? onTripRCD(rcd.id) : onResetRCD(rcd.id)}
                          className={`w-4 h-8 rounded cursor-pointer transition ${rcd.state ? 'bg-emerald-500' : 'bg-slate-600 translate-y-1'}`} 
                        />
                      </div>
                      <div className="text-[8px] text-center text-slate-400 font-mono">
                        {rcd.state ? 'BETRIEB' : 'AUSGELÖST'}
                      </div>
                    </div>
                  ))}

                  {/* Circuits F1, F2, F3 */}
                  {circuits.filter(c => c.rcdId === 'rcd-1').map(circuit => (
                    <div
                      key={circuit.id}
                      className={`relative z-10 w-20 p-2 border-2 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md cursor-pointer transition ${
                        circuit.state
                          ? 'bg-slate-800 border-slate-600 hover:border-sky-500'
                          : 'bg-slate-900 border-slate-700 opacity-60'
                      }`}
                      onClick={() => onToggleCircuit(circuit.id)}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-sky-400 font-bold">
                        <span>{circuit.number}</span>
                        <span className="text-amber-400">{circuit.phase}</span>
                      </div>
                      <div className="my-auto text-center">
                        <div className={`w-3.5 h-7 mx-auto rounded-sm transition ${
                          circuit.state ? 'bg-sky-500 shadow-sm' : 'bg-slate-600 translate-y-1'
                        }`} />
                      </div>
                      <div className="text-[8px] text-center text-slate-300 font-mono truncate" title={circuit.name}>
                        {circuit.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REIHE 3: RCD 2 (KÜCHE & GROSSGERÄTE) + BREAKER F4, F5 (3P), F6 */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-sky-400">Reihe 3</span>
                  FI-2 (Küche & Großverbraucher) + Stromkreise F4, F5 (Herd 3P), F6
                </span>

                <div className="relative p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto min-h-[110px]">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-5 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-800 pointer-events-none -z-0 opacity-40 shadow-inner" />

                  {/* RCD 2 */}
                  {rcds.slice(1, 2).map(rcd => (
                    <div 
                      key={rcd.id}
                      className={`relative z-10 w-28 p-2 border-2 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md transition ${
                        rcd.state ? 'bg-slate-800 border-slate-600' : 'bg-rose-950/80 border-rose-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-300 font-bold">
                        <span>FI-2 (40A)</span>
                        <span className="text-amber-400 font-mono">30mA</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 my-auto">
                        <button
                          onClick={() => rcd.state ? onTripRCD(rcd.id) : onResetRCD(rcd.id)}
                          className="px-1.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-[10px] font-bold rounded shadow-sm"
                        >
                          T
                        </button>
                        <div 
                          onClick={() => rcd.state ? onTripRCD(rcd.id) : onResetRCD(rcd.id)}
                          className={`w-4 h-8 rounded cursor-pointer transition ${rcd.state ? 'bg-emerald-500' : 'bg-slate-600 translate-y-1'}`} 
                        />
                      </div>
                      <div className="text-[8px] text-center text-slate-400 font-mono">
                        {rcd.state ? 'BETRIEB' : 'AUSGELÖST'}
                      </div>
                    </div>
                  ))}

                  {/* F4 (Küche) */}
                  {circuits.filter(c => c.number === 'F4').map(circuit => (
                    <div
                      key={circuit.id}
                      className={`relative z-10 w-20 p-2 border-2 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md cursor-pointer transition ${
                        circuit.state ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-700 opacity-60'
                      }`}
                      onClick={() => onToggleCircuit(circuit.id)}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-sky-400 font-bold">
                        <span>F4</span>
                        <span className="text-amber-400">{circuit.phase}</span>
                      </div>
                      <div className="my-auto text-center">
                        <div className={`w-3.5 h-7 mx-auto rounded-sm ${circuit.state ? 'bg-sky-500' : 'bg-slate-600 translate-y-1'}`} />
                      </div>
                      <div className="text-[8px] text-center text-slate-300 font-mono truncate">Küche</div>
                    </div>
                  ))}

                  {/* F5 HERD 3-POLIG (Breiter 3 TE Verbund-Schalter) */}
                  {circuits.filter(c => c.number === 'F5').map(circuit => (
                    <div
                      key={circuit.id}
                      className={`relative z-10 w-32 p-2 border-2 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md cursor-pointer transition ${
                        circuit.state ? 'bg-slate-800 border-amber-600/80' : 'bg-slate-900 border-slate-700 opacity-60'
                      }`}
                      onClick={() => onToggleCircuit(circuit.id)}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-amber-400 font-bold">
                        <span>F5 (Herd 3P)</span>
                        <span>3× B16A</span>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 my-auto">
                        <div className={`w-3 h-7 rounded-sm ${circuit.state ? 'bg-amber-500' : 'bg-slate-600 translate-y-1'}`} />
                        <div className={`w-3 h-7 rounded-sm ${circuit.state ? 'bg-amber-500' : 'bg-slate-600 translate-y-1'}`} />
                        <div className={`w-3 h-7 rounded-sm ${circuit.state ? 'bg-amber-500' : 'bg-slate-600 translate-y-1'}`} />
                      </div>
                      <div className="text-[8px] text-center text-amber-300 font-mono">400V Drehstrom</div>
                    </div>
                  ))}

                  {/* F6 Geschirrspüler */}
                  {circuits.filter(c => c.number === 'F6').map(circuit => (
                    <div
                      key={circuit.id}
                      className={`relative z-10 w-20 p-2 border-2 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md cursor-pointer transition ${
                        circuit.state ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-700 opacity-60'
                      }`}
                      onClick={() => onToggleCircuit(circuit.id)}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-sky-400 font-bold">
                        <span>F6</span>
                        <span className="text-amber-400">{circuit.phase}</span>
                      </div>
                      <div className="my-auto text-center">
                        <div className={`w-3.5 h-7 mx-auto rounded-sm ${circuit.state ? 'bg-sky-500' : 'bg-slate-600 translate-y-1'}`} />
                      </div>
                      <div className="text-[8px] text-center text-slate-300 font-mono truncate">Spüler</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REIHE 4: RCD 3 (TERRARIUM & SMART HOME GATEWAY) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-emerald-400">Reihe 4</span>
                  FI-3 (Allstromsensitiv Typ B) + Terrarium Spezialkreis & Smart Home Gateway Aktor
                </span>

                <div className="relative p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto min-h-[110px]">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-5 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-800 pointer-events-none -z-0 opacity-40 shadow-inner" />

                  {/* RCD 3 Typ B allstromsensitiv */}
                  {rcds.slice(2, 3).map(rcd => (
                    <div 
                      key={rcd.id}
                      className={`relative z-10 w-32 p-2 border-2 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md transition ${
                        rcd.state ? 'bg-emerald-950/40 border-emerald-700' : 'bg-rose-950/80 border-rose-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-emerald-300 font-bold">
                        <span>FI-3 Typ B</span>
                        <span className="text-amber-400">Allstrom</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 my-auto">
                        <button
                          onClick={() => rcd.state ? onTripRCD(rcd.id) : onResetRCD(rcd.id)}
                          className="px-1.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-[10px] font-bold rounded shadow-sm"
                        >
                          T
                        </button>
                        <div 
                          onClick={() => rcd.state ? onTripRCD(rcd.id) : onResetRCD(rcd.id)}
                          className={`w-4 h-8 rounded cursor-pointer transition ${rcd.state ? 'bg-emerald-500' : 'bg-slate-600 translate-y-1'}`} 
                        />
                      </div>
                      <div className="text-[8px] text-center text-emerald-400 font-mono">
                        {rcd.state ? 'TERRARIUM AKTIV' : 'AUSGELÖST'}
                      </div>
                    </div>
                  ))}

                  {/* F7 Terrarium RCBO / LS */}
                  {circuits.filter(c => c.number === 'F7').map(circuit => (
                    <div
                      key={circuit.id}
                      className={`relative z-10 w-24 p-2 border-2 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md cursor-pointer transition ${
                        circuit.state ? 'bg-emerald-950/50 border-emerald-600' : 'bg-slate-900 border-slate-700 opacity-60'
                      }`}
                      onClick={() => onToggleCircuit(circuit.id)}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400 font-bold">
                        <span>F7 Terra</span>
                        <span className="text-amber-400">{circuit.phase}</span>
                      </div>
                      <div className="my-auto text-center">
                        <div className={`w-3.5 h-7 mx-auto rounded-sm ${circuit.state ? 'bg-emerald-500' : 'bg-slate-600 translate-y-1'}`} />
                      </div>
                      <div className="text-[8px] text-center text-emerald-200 font-mono truncate">185W Last</div>
                    </div>
                  ))}

                  {/* F8 Gateway & Aktor */}
                  {circuits.filter(c => c.number === 'F8').map(circuit => (
                    <div
                      key={circuit.id}
                      className={`relative z-10 w-20 p-2 border-2 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md cursor-pointer transition ${
                        circuit.state ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-700 opacity-60'
                      }`}
                      onClick={() => onToggleCircuit(circuit.id)}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-sky-400 font-bold">
                        <span>F8</span>
                        <span className="text-amber-400">{circuit.phase}</span>
                      </div>
                      <div className="my-auto text-center">
                        <div className={`w-3.5 h-7 mx-auto rounded-sm ${circuit.state ? 'bg-sky-500' : 'bg-slate-600 translate-y-1'}`} />
                      </div>
                      <div className="text-[8px] text-center text-slate-300 font-mono truncate">Gateway</div>
                    </div>
                  ))}

                  {/* Smart Home Hutschienen-Aktor (6 TE) */}
                  <div className="relative z-10 w-44 p-2 bg-indigo-950/60 border-2 border-indigo-700 rounded-lg flex flex-col justify-between h-24 shrink-0 shadow-md">
                    <div className="flex items-center justify-between text-[9px] font-mono text-indigo-300 font-bold">
                      <span>Smart Aktor 8-fach</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    {/* 8 status LEDs */}
                    <div className="grid grid-cols-4 gap-1.5 my-auto px-1">
                      {[1,2,3,4,5,6,7,8].map(ch => (
                        <div key={ch} className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${ch <= 4 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <span className="text-[8px] text-slate-400 font-mono">K{ch}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[8px] text-indigo-200 text-center font-mono">Matter / Zigbee DIN</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: PHASEN-LASTVERTEILUNG (L1 / L2 / L3) */}
        {activeTab === 'phases' && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                3-Phasen Lastverteilung & Symmetrieüberwachung (DIN VDE 0100)
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Zur Vermeidung von Schieflasten im Niederspannungsnetz müssen die einphasigen Verbraucher gleichmäßig auf die Phasen L1, L2 und L3 aufgeteilt werden.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Phase L1 */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-amber-400 font-mono">PHASE L1 (Braun)</span>
                    <span className="text-xs font-mono text-slate-400">230.4 V</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">{energy.phaseL1Watts} W</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{currentL1} A von max. 63 A</div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${pctL1}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">F1 (Steckdosen), F4 (Küche), F7 (Terrarium)</span>
                </div>

                {/* Phase L2 */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-sky-400 font-mono">PHASE L2 (Schwarz)</span>
                    <span className="text-xs font-mono text-slate-400">230.1 V</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">{energy.phaseL2Watts} W</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{currentL2} A von max. 63 A</div>

                  <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-sky-400 h-full rounded-full transition-all duration-300" style={{ width: `${pctL2}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">F2 (Beleuchtung), F5 (Herd L2), F8 (Gateway)</span>
                </div>

                {/* Phase L3 */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-indigo-400 font-mono">PHASE L3 (Grau)</span>
                    <span className="text-xs font-mono text-slate-400">230.5 V</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">{energy.phaseL3Watts} W</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{currentL3} A von max. 63 A</div>

                  <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-indigo-400 h-full rounded-full transition-all duration-300" style={{ width: `${pctL3}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">F3 (Multimedia), F5 (Herd L3), F6 (Geschirrspüler)</span>
                </div>
              </div>

              {/* Symmetrie-Status */}
              <div className="mt-5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSchieflastOk ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="text-xs font-medium text-slate-200">
                    Schieflast-Differenz: <strong className="font-mono text-white">{unbalanceW} W</strong> (Grenzwert VDE: 4.600 W)
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  Symmetrisch ausbalanciert
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STROMKREIS-LEGENDE (Beschriftung für den Schaltkasten) */}
        {activeTab === 'legend' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Printer className="w-4 h-4 text-sky-400" />
                    Stromkreisverzeichnis / Verteiler-Legende nach DIN EN 61439
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Druckfertige Beschriftung für den Verteilerdeckel zur eindeutigen Zuordnung.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  Legende drucken
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                      <th className="pb-2 font-semibold">Nr.</th>
                      <th className="pb-2 font-semibold">Bezeichnung / Raum</th>
                      <th className="pb-2 font-semibold">Schutzorgan</th>
                      <th className="pb-2 font-semibold">Phase</th>
                      <th className="pb-2 font-semibold">Querschnitt</th>
                      <th className="pb-2 font-semibold">FI-Zuordnung</th>
                      <th className="pb-2 font-semibold text-right">Zustand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {circuits.map(c => {
                      const assignedRCD = rcds.find(r => r.id === c.rcdId);
                      return (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 font-bold font-mono text-sky-400">{c.number}</td>
                          <td className="py-2.5 font-semibold text-slate-200">{c.name}</td>
                          <td className="py-2.5 font-mono text-amber-400">{c.breakerType}</td>
                          <td className="py-2.5 font-mono text-slate-300">{c.phase}</td>
                          <td className="py-2.5 font-mono text-slate-400">{c.cableCrossSection}</td>
                          <td className="py-2.5 text-slate-300">{assignedRCD?.name.split(':')[0] || c.rcdId}</td>
                          <td className="py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.state ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                            }`}>
                              {c.state ? 'EIN' : 'AUS'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

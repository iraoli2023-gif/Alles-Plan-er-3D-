import React, { useState } from 'react';
import { SmartDevice, RoomConfig, ElectricalElement, FurnitureItem } from '../types';
import { 
  Network, 
  Wifi, 
  Radio, 
  Lightbulb, 
  Plug, 
  Thermometer, 
  ShieldAlert, 
  Sliders, 
  Power, 
  Sun, 
  Moon, 
  Tv, 
  CheckCircle2, 
  RefreshCw,
  Signal,
  Layers,
  Cpu,
  Video,
  Volume2,
  Bot,
  Zap,
  GitFork
} from 'lucide-react';
import { SmartHomeVisualEditor } from './SmartHomeVisualEditor';
import { LogicRuleEditor } from './LogicRuleEditor';

interface SmartHomeGatewayProps {
  devices: SmartDevice[];
  room?: RoomConfig;
  electrical?: ElectricalElement[];
  furniture?: FurnitureItem[];
  onToggleDevice: (deviceId: string) => void;
  onUpdateDeviceValue: (deviceId: string, value: number) => void;
  onApplyScene: (sceneName: 'gemuetlich' | 'alles_aus' | 'tagmodus' | 'kino') => void;
}

export const SmartHomeGateway: React.FC<SmartHomeGatewayProps> = ({
  devices,
  room,
  electrical,
  furniture,
  onToggleDevice,
  onUpdateDeviceValue,
  onApplyScene,
}) => {
  const [activeMode, setActiveMode] = useState<'logic_rules' | 'visual_editor' | 'dashboard'>('logic_rules');
  const [filterProtocol, setFilterProtocol] = useState<string>('all');
  const [activeScene, setActiveScene] = useState<string | null>(null);

  const protocols = [
    { name: 'Matter over Thread', status: 'Online', count: devices.filter(d => d.protocol === 'Matter').length, color: 'text-sky-400' },
    { name: 'Zigbee 3.0', status: 'Online (CH 25)', count: devices.filter(d => d.protocol === 'Zigbee 3.0').length, color: 'text-amber-400' },
    { name: 'KNX IP Interface', status: 'Verbunden', count: devices.filter(d => d.protocol === 'KNX IP').length, color: 'text-emerald-400' },
    { name: 'MQTT / HomeAssistant', status: 'Sync aktiv', count: devices.filter(d => d.protocol === 'WiFi / MQTT').length, color: 'text-purple-400' },
  ];

  const filteredDevices = devices.filter(d => {
    if (filterProtocol === 'all') return true;
    return d.protocol === filterProtocol;
  });

  const handleSceneClick = (scene: 'gemuetlich' | 'alles_aus' | 'tagmodus' | 'kino') => {
    setActiveScene(scene);
    onApplyScene(scene);
    setTimeout(() => setActiveScene(null), 1500);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Mode Switcher Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMode('logic_rules')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-2 ${
                activeMode === 'logic_rules'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Logik-Editor (WENN-DANN)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-extrabold border border-amber-800/80">
                Neu
              </span>
            </button>

            <button
              onClick={() => setActiveMode('visual_editor')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-2 ${
                activeMode === 'visual_editor'
                  ? 'bg-sky-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Bus- & Schaltplan Studio</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/60 font-black text-white">
                Hager • ABB • Schneider
              </span>
            </button>

            <button
              onClick={() => setActiveMode('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-2 ${
                activeMode === 'dashboard'
                  ? 'bg-sky-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Geräte-Dashboard</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/60 font-mono text-slate-300">
                {devices.length} Geräte
              </span>
            </button>
          </div>
        </div>

        {/* Global Scenes Quick Bar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSceneClick('gemuetlich')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            Szene: Feierabend
          </button>

          <button
            onClick={() => handleSceneClick('kino')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
          >
            <Tv className="w-3.5 h-3.5 text-sky-400" />
            Szene: Kino
          </button>

          <button
            onClick={() => handleSceneClick('alles_aus')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
          >
            <Power className="w-3.5 h-3.5 text-rose-400" />
            Alles Aus
          </button>
        </div>
      </div>

      {/* Main Content: Mode View */}
      {activeMode === 'logic_rules' && (
        <LogicRuleEditor
          smartDevices={devices}
          onToggleDevice={onToggleDevice}
          onUpdateDeviceValue={onUpdateDeviceValue}
          onApplyScene={onApplyScene}
        />
      )}

      {activeMode === 'visual_editor' && (
        <SmartHomeVisualEditor
          smartDevices={devices}
          room={room}
          electrical={electrical}
          furniture={furniture}
          onToggleDevice={onToggleDevice}
          onUpdateDeviceValue={onUpdateDeviceValue}
          onApplyScene={onApplyScene}
        />
      )}

      {activeMode === 'dashboard' && (
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {/* Gateway Protocol Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {protocols.map(p => (
              <div 
                key={p.name}
                onClick={() => setFilterProtocol(filterProtocol === p.name ? 'all' : p.name)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  filterProtocol === p.name
                    ? 'bg-slate-800 border-sky-500 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-bold ${p.color}`}>{p.name}</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {p.status}
                  </span>
                </div>
                <div className="mt-2 text-xl font-extrabold text-white">
                  {p.count} <span className="text-xs font-normal text-slate-400">Geräte</span>
                </div>
              </div>
            ))}
          </div>

          {/* Devices Interactive Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                Verbundene Smart Home Aktoren & Sensoren ({filteredDevices.length})
              </h3>
              {filterProtocol !== 'all' && (
                <button
                  onClick={() => setFilterProtocol('all')}
                  className="text-xs text-sky-400 hover:underline"
                >
                  Filter zurücksetzen (Alle anzeigen)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map(d => {
                const isActive = d.state;

                return (
                  <div
                    key={d.id}
                    className={`p-4 rounded-2xl border transition shadow-lg ${
                      isActive 
                        ? 'bg-slate-900 border-slate-700/80' 
                        : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-2 rounded-xl ${
                          d.category === 'lighting' ? 'bg-amber-950/60 text-amber-400' :
                          d.category === 'terrarium' ? 'bg-emerald-950/60 text-emerald-400' :
                          d.category === 'plug' ? 'bg-sky-950/60 text-sky-400' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {d.category === 'lighting' && <Lightbulb className="w-4 h-4" />}
                          {d.category === 'plug' && <Plug className="w-4 h-4" />}
                          {d.category === 'climate' && <Thermometer className="w-4 h-4" />}
                          {d.category === 'terrarium' && <Sun className="w-4 h-4" />}
                          {d.category === 'gateway' && <Network className="w-4 h-4" />}
                          {d.category === 'sensor' && <ShieldAlert className="w-4 h-4" />}
                        </span>

                        <div>
                          <h4 className="text-xs font-bold text-white">{d.name}</h4>
                          <span className="text-[10px] text-slate-400 block">{d.room} • {d.protocol}</span>
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <button
                        onClick={() => onToggleDevice(d.id)}
                        className={`p-1.5 rounded-xl transition ${
                          isActive
                            ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Value / Dimming slider if lighting or thermostat */}
                    {d.value !== undefined && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-slate-400">Wert / Helligkeit:</span>
                          <span className="font-mono text-white font-bold">{d.value} {d.unit}</span>
                        </div>
                        {d.category === 'lighting' && (
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={d.value}
                            onChange={(e) => onUpdateDeviceValue(d.id, Number(e.target.value))}
                            className="w-full accent-sky-400 cursor-pointer"
                          />
                        )}
                      </div>
                    )}

                    {/* Telemetry Footer */}
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Signal className="w-3 h-3 text-emerald-400" />
                        LQI: {d.signalStrength}%
                      </span>
                      <span className="font-mono text-amber-400 font-semibold">
                        {isActive ? `${d.powerWatts} W` : '0 W'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


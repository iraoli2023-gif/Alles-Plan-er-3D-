import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LogicRule, 
  WhenTrigger, 
  ThenAction, 
  AndCondition, 
  RuleExecutionLog, 
  SmartDevice, 
  TriggerCategory, 
  ActionCategory 
} from '../types';
import { INITIAL_LOGIC_RULES, RULE_PRESETS, RulePresetTemplate } from '../data/initialLogicRules';
import { soundSynth } from '../utils/audioSynth';
import { 
  Zap, 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sliders, 
  Power, 
  Bell, 
  Eye, 
  Sun, 
  Moon, 
  Thermometer, 
  Volume2, 
  ShieldAlert, 
  Video, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Lightbulb, 
  Layers, 
  Tv, 
  Activity, 
  Check, 
  Flame, 
  Info, 
  X, 
  RotateCcw,
  GitFork,
  Radio,
  Share2,
  Filter,
  VolumeX,
  Timer
} from 'lucide-react';

interface LogicRuleEditorProps {
  smartDevices: SmartDevice[];
  onToggleDevice?: (deviceId: string) => void;
  onUpdateDeviceValue?: (deviceId: string, value: number) => void;
  onApplyScene?: (sceneName: 'gemuetlich' | 'alles_aus' | 'tagmodus' | 'kino') => void;
}

export const LogicRuleEditor: React.FC<LogicRuleEditorProps> = ({
  smartDevices,
  onToggleDevice,
  onUpdateDeviceValue,
  onApplyScene,
}) => {
  // Rules state
  const [rules, setRules] = useState<LogicRule[]>(INITIAL_LOGIC_RULES);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>('rule-motion-light');
  const [activeTab, setActiveTab] = useState<'diagram' | 'cards' | 'log'>('diagram');

  // Modal / Creator State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [showPresetsDrawer, setShowPresetsDrawer] = useState<boolean>(false);

  // New Rule Form State
  const [newRuleTitle, setNewRuleTitle] = useState<string>('Wenn Bewegung, dann Licht an');
  const [newRuleDesc, setNewRuleDesc] = useState<string>('Automatische Lichtsteuerung bei Erkennung');
  const [newRuleCategory, setNewRuleCategory] = useState<'amber' | 'sky' | 'emerald' | 'rose' | 'purple'>('amber');
  const [newTriggerType, setNewTriggerType] = useState<TriggerCategory>('motion');
  const [newTriggerDevice, setNewTriggerDevice] = useState<string>('PIR Sensor Flur');
  const [newTriggerCondition, setNewTriggerCondition] = useState<string>('Bewegung erkannt');
  const [newConditionType, setNewConditionType] = useState<'none' | 'ambient_lux' | 'time_range'>('ambient_lux');
  const [newConditionLux, setNewConditionLux] = useState<number>(60);
  const [newActionType, setNewActionType] = useState<ActionCategory>('turn_on');
  const [newActionTargetId, setNewActionTargetId] = useState<string>(smartDevices[2]?.id || 'smart-light-living');
  const [newActionDimValue, setNewActionDimValue] = useState<number>(100);
  const [newActionSound, setNewActionSound] = useState<'doorbell' | 'welcome' | 'siren' | 'confirmation'>('doorbell');
  const [newActionScene, setNewActionScene] = useState<'gemuetlich' | 'alles_aus' | 'tagmodus' | 'kino'>('gemuetlich');
  const [newActionTimerSec, setNewActionTimerSec] = useState<number>(180);

  // Live Rule Engine Log
  const [logs, setLogs] = useState<RuleExecutionLog[]>([
    {
      id: 'log-init-1',
      ruleId: 'rule-motion-light',
      ruleTitle: 'Bewegungslicht Flur & Wohnbereich',
      timestamp: '11:45:12',
      triggerCause: 'PIR Sensor: Bewegung erkannt (Helligkeit 42 Lux)',
      executedActions: ['Deckenlicht Wohnzimmer -> AN (100%)', 'Timer 180s gestartet'],
      status: 'success',
    },
    {
      id: 'log-init-2',
      ruleId: 'rule-doorbell-chime',
      ruleTitle: 'Türklingel-Signalisierung & Foto',
      timestamp: '11:42:01',
      triggerCause: 'Taster Eingang betätigt',
      executedActions: ['Westminster Ding-Dong abgespielt', 'Snapshot Eingangskamera gespeichert'],
      status: 'success',
    },
  ]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Selected Rule
  const selectedRule = useMemo(() => {
    return rules.find(r => r.id === selectedRuleId) || rules[0] || null;
  }, [rules, selectedRuleId]);

  // Execute / Simulate Rule
  const handleSimulateRule = (ruleId: string) => {
    const targetRule = rules.find(r => r.id === ruleId);
    if (!targetRule) return;

    // Trigger visual pulse on this rule
    setRules(prev => prev.map(r => r.id === ruleId ? { 
      ...r, 
      isSimulating: true, 
      executionCount: r.executionCount + 1,
      lastTriggered: 'Gerade eben'
    } : r));

    // Sound effect & actions
    let actionDescriptions: string[] = [];

    targetRule.actions.forEach(action => {
      if (action.type === 'play_sound') {
        if (action.soundType === 'doorbell') soundSynth.playDoorbell();
        else if (action.soundType === 'welcome') soundSynth.playWelcome();
        else if (action.soundType === 'siren') soundSynth.playSiren();
        else soundSynth.playConfirmation();
        actionDescriptions.push(`Sound: ${action.soundType || 'Ding-Dong'} abgespielt`);
      } else if (action.type === 'turn_on') {
        soundSynth.playConfirmation();
        if (action.targetDeviceId && onToggleDevice) {
          const dev = smartDevices.find(d => d.id === action.targetDeviceId);
          if (dev && !dev.state) onToggleDevice(action.targetDeviceId);
        }
        if (action.targetDeviceId && action.value !== undefined && onUpdateDeviceValue) {
          onUpdateDeviceValue(action.targetDeviceId, action.value);
        }
        actionDescriptions.push(`${action.targetDeviceName} -> AN (${action.value ? action.value + '%' : '100%'})`);
        if (action.autoOffSeconds) {
          actionDescriptions.push(`Auto-Off Timer: ${action.autoOffSeconds}s`);
        }
      } else if (action.type === 'turn_off') {
        soundSynth.playConfirmation();
        if (action.targetDeviceId && onToggleDevice) {
          const dev = smartDevices.find(d => d.id === action.targetDeviceId);
          if (dev && dev.state) onToggleDevice(action.targetDeviceId);
        }
        actionDescriptions.push(`${action.targetDeviceName} -> AUS`);
      } else if (action.type === 'dim') {
        soundSynth.playConfirmation();
        if (action.targetDeviceId && onUpdateDeviceValue && action.value !== undefined) {
          onUpdateDeviceValue(action.targetDeviceId, action.value);
        }
        actionDescriptions.push(`${action.targetDeviceName} -> gedimmt auf ${action.value}%`);
      } else if (action.type === 'activate_scene') {
        soundSynth.playWelcome();
        if (action.sceneName && onApplyScene) {
          onApplyScene(action.sceneName);
        }
        actionDescriptions.push(`Szene "${action.sceneName}" aktiviert`);
      } else if (action.type === 'camera_snapshot') {
        soundSynth.playConfirmation();
        actionDescriptions.push('Kamera-Schnappschuss generiert & gespeichert');
      }
    });

    // Add log
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newLog: RuleExecutionLog = {
      id: `log-${Date.now()}`,
      ruleId: targetRule.id,
      ruleTitle: targetRule.title,
      timestamp: timeStr,
      triggerCause: `${targetRule.trigger.deviceName}: ${targetRule.trigger.conditionText}`,
      executedActions: actionDescriptions,
      status: 'success',
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);

    showToast(`⚡ Regel "${targetRule.title}" erfolgreich ausgeführt!`);

    // Reset simulating animation after 2.2s
    setTimeout(() => {
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, isSimulating: false } : r));
    }, 2200);
  };

  // Toggle rule enable/disable
  const handleToggleRuleActive = (ruleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playConfirmation();
    setRules(prev => prev.map(r => {
      if (r.id === ruleId) {
        const next = !r.enabled;
        showToast(next ? `Regel "${r.title}" aktiviert.` : `Regel "${r.title}" pausiert.`);
        return { ...r, enabled: next };
      }
      return r;
    }));
  };

  // Delete Rule
  const handleDeleteRule = (ruleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundSynth.playConfirmation();
    setRules(prev => prev.filter(r => r.id !== ruleId));
    if (selectedRuleId === ruleId) {
      const remaining = rules.filter(r => r.id !== ruleId);
      setSelectedRuleId(remaining[0]?.id || null);
    }
    showToast('Regel gelöscht.');
  };

  // Adopt Preset Template
  const handleAdoptPreset = (preset: RulePresetTemplate) => {
    soundSynth.playConfirmation();
    const newId = `rule-preset-${Date.now()}`;
    const createdRule: LogicRule = {
      id: newId,
      title: preset.title,
      description: preset.description,
      enabled: true,
      color: preset.color,
      executionCount: 0,
      lastTriggered: 'Neu hinzugefügt',
      trigger: { ...preset.trigger, id: `trig-${Date.now()}` },
      condition: preset.condition ? { ...preset.condition, id: `cond-${Date.now()}` } : undefined,
      actions: preset.actions.map((a, i) => ({ ...a, id: `act-${Date.now()}-${i}` })),
    };
    setRules(prev => [createdRule, ...prev]);
    setSelectedRuleId(newId);
    setShowPresetsDrawer(false);
    showToast(`Vorlage "${preset.title}" hinzugefügt!`);
  };

  // Create Custom Rule
  const handleSaveCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim()) return;

    soundSynth.playConfirmation();
    const targetDev = smartDevices.find(d => d.id === newActionTargetId);

    const createdRule: LogicRule = {
      id: `rule-custom-${Date.now()}`,
      title: newRuleTitle.trim(),
      description: newRuleDesc.trim() || 'Benutzerdefinierte WENN-DANN Automation',
      enabled: true,
      color: newRuleCategory,
      executionCount: 0,
      lastTriggered: 'Neu erstellt',
      trigger: {
        id: `trig-${Date.now()}`,
        type: newTriggerType,
        deviceName: newTriggerDevice,
        conditionText: newTriggerCondition,
      },
      condition: newConditionType === 'none' ? undefined : {
        id: `cond-${Date.now()}`,
        type: newConditionType,
        label: newConditionType === 'ambient_lux' ? `Nur wenn Helligkeit < ${newConditionLux} Lux` : 'Nur zwischen 20:00 und 06:00 Uhr',
        enabled: true,
        operator: newConditionType === 'ambient_lux' ? '<' : undefined,
        value: newConditionType === 'ambient_lux' ? newConditionLux : '20:00 - 06:00',
      },
      actions: [
        {
          id: `act-${Date.now()}`,
          type: newActionType,
          targetDeviceId: newActionTargetId,
          targetDeviceName: targetDev ? targetDev.name : 'Smart Device',
          actionText: newActionType === 'turn_on' ? `Einschalten (${newActionDimValue}%)` :
                      newActionType === 'dim' ? `Auf ${newActionDimValue}% dimmen` :
                      newActionType === 'turn_off' ? 'Ausschalten' :
                      newActionType === 'play_sound' ? `Sound ${newActionSound} abspielen` :
                      newActionType === 'activate_scene' ? `Szene "${newActionScene}" aktivieren` :
                      'Kamera-Schnappschuss speichern',
          value: newActionDimValue,
          soundType: newActionType === 'play_sound' ? newActionSound : undefined,
          sceneName: newActionType === 'activate_scene' ? newActionScene : undefined,
          autoOffSeconds: newActionTimerSec > 0 ? newActionTimerSec : undefined,
        }
      ],
    };

    setRules(prev => [createdRule, ...prev]);
    setSelectedRuleId(createdRule.id);
    setIsCreateModalOpen(false);
    showToast(`Neue WENN-DANN Regel "${createdRule.title}" aktiv!`);
  };

  // Helpers for icons & colors
  const getTriggerIcon = (type: TriggerCategory) => {
    switch (type) {
      case 'motion': return <Eye className="w-4 h-4 text-amber-400" />;
      case 'doorbell': return <Bell className="w-4 h-4 text-sky-400" />;
      case 'switch': return <Power className="w-4 h-4 text-emerald-400" />;
      case 'temperature': return <Thermometer className="w-4 h-4 text-rose-400" />;
      case 'illuminance': return <Sun className="w-4 h-4 text-amber-300" />;
      case 'time': return <Clock className="w-4 h-4 text-purple-400" />;
      case 'smoke': return <Flame className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'terrarium': return <Sun className="w-4 h-4 text-emerald-400" />;
      default: return <Zap className="w-4 h-4 text-sky-400" />;
    }
  };

  const getActionIcon = (type: ActionCategory) => {
    switch (type) {
      case 'turn_on':
      case 'dim': return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case 'turn_off': return <Power className="w-4 h-4 text-slate-400" />;
      case 'play_sound': return <Volume2 className="w-4 h-4 text-sky-400" />;
      case 'camera_snapshot': return <Video className="w-4 h-4 text-indigo-400" />;
      case 'activate_scene': return <Sparkles className="w-4 h-4 text-purple-400" />;
      default: return <Sliders className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Controls Toolbar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-sky-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/10">
            <Zap className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white tracking-tight">WENN-DANN Logik-Editor</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                Visuelle Automation & Trigger
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Verknüpfe Sensoren, Taster & Ereignisse mit Aktoren, Leuchten und Sounds
            </p>
          </div>
        </div>

        {/* View Switcher: Diagram vs Cards vs Log */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'diagram'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Visueller Flow</span>
            </button>

            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'cards'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Regel-Übersicht ({rules.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('log')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'log'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live-Monitor ({logs.length})</span>
            </button>
          </div>

          {/* Action Buttons: Presets & New Rule */}
          <button
            onClick={() => setShowPresetsDrawer(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Vorlagen
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Neue Regel
          </button>
        </div>
      </div>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="absolute top-16 right-6 z-50 px-4 py-2.5 bg-slate-900/95 border border-sky-500/80 rounded-xl shadow-2xl text-xs text-sky-200 flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden relative flex">
        {/* ========================================================== */}
        {/* VIEW 1: VISUAL FLOW CANVAS (INTERACTIVE WENN-DANN DIAGRAM) */}
        {/* ========================================================== */}
        {activeTab === 'diagram' && (
          <div className="flex-1 h-full flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Rules Selector list */}
            <div className="w-full md:w-80 bg-slate-900/90 border-r border-slate-800 p-3.5 overflow-y-auto space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 mb-2">
                <span className="font-bold uppercase tracking-wider text-[10px]">Wähle Regel zum Visualisieren</span>
                <span className="font-mono text-slate-400">{rules.length} Aktiv</span>
              </div>

              {rules.map((rule) => {
                const isSelected = rule.id === selectedRuleId;
                const isSimulating = rule.isSimulating;

                return (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-slate-800/95 border-sky-500 shadow-md shadow-sky-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    } ${!rule.enabled ? 'opacity-60' : ''}`}
                  >
                    {/* Simulating highlight wave */}
                    {isSimulating && (
                      <div className="absolute inset-0 rounded-xl bg-amber-400/15 border border-amber-400 animate-pulse pointer-events-none" />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`p-1.5 rounded-lg ${
                          rule.color === 'amber' ? 'bg-amber-950/80 text-amber-400' :
                          rule.color === 'sky' ? 'bg-sky-950/80 text-sky-400' :
                          rule.color === 'rose' ? 'bg-rose-950/80 text-rose-400' :
                          rule.color === 'purple' ? 'bg-purple-950/80 text-purple-400' :
                          'bg-emerald-950/80 text-emerald-400'
                        }`}>
                          {getTriggerIcon(rule.trigger.type)}
                        </span>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-white truncate">{rule.title}</h4>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                            WENN {rule.trigger.conditionText}
                          </span>
                        </div>
                      </div>

                      {/* Quick Play Trigger Button */}
                      <button
                        title="Regel jetzt simulieren"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateRule(rule.id);
                        }}
                        className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm active:scale-90"
                      >
                        <Play className="w-3 h-3 fill-slate-950" />
                      </button>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${rule.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                        {rule.enabled ? 'Aktiviert' : 'Pausiert'}
                      </span>
                      <span>{rule.executionCount}x ausgeführt</span>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-amber-500/80 hover:bg-amber-950/20 text-slate-400 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Neue WENN-DANN Regel anlegen
              </button>
            </div>

            {/* Right Flow Workspace: Visual Flow Canvas of Selected Rule */}
            {selectedRule ? (
              <div className="flex-1 h-full p-6 overflow-y-auto bg-slate-950 flex flex-col justify-between">
                <div>
                  {/* Selected Rule Header & Test Button */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/60">
                          WENN-DANN FLOW
                        </span>
                        <h3 className="text-base font-extrabold text-white">{selectedRule.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{selectedRule.description}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Active toggle */}
                      <button
                        onClick={(e) => handleToggleRuleActive(selectedRule.id, e)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          selectedRule.enabled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {selectedRule.enabled ? 'Regel aktiv' : 'Regel pausiert'}
                      </button>

                      {/* BIG SIMULATE / TEST BUTTON */}
                      <button
                        onClick={() => handleSimulateRule(selectedRule.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-lg active:scale-95 ${
                          selectedRule.isSimulating
                            ? 'bg-amber-300 text-slate-950 shadow-amber-400/30 scale-105'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Regel jetzt testen & auslösen</span>
                      </button>

                      <button
                        onClick={(e) => handleDeleteRule(selectedRule.id, e)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition"
                        title="Regel löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* VISUAL FLOW DIAGRAM (WENN ──⚡──> UND ──⚡──> DANN) */}
                  <div className="relative bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 min-h-[380px] flex flex-col justify-center shadow-inner">
                    {/* Animated Circuit Grid Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:18px_18px] opacity-40 rounded-2xl pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                      {/* ========================================= */}
                      {/* 1. WENN (TRIGGER BLOCK) */}
                      {/* ========================================= */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 text-xs font-bold text-amber-400">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span>1. WENN (AUSLÖSER / SENSOR)</span>
                        </div>

                        <div className={`p-4 rounded-2xl border transition-all duration-300 relative ${
                          selectedRule.isSimulating
                            ? 'bg-amber-950/40 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.02]'
                            : 'bg-slate-900 border-amber-500/40 shadow-md'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                {getTriggerIcon(selectedRule.trigger.type)}
                              </div>
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-bold block">
                                  {selectedRule.trigger.type.toUpperCase()} EREIGNIS
                                </span>
                                <h4 className="text-sm font-bold text-white">
                                  {selectedRule.trigger.deviceName}
                                </h4>
                              </div>
                            </div>

                            {/* Output Connector Port */}
                            <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center shadow-md text-[8px] text-slate-950 font-bold">
                              ●
                            </div>
                          </div>

                          <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-amber-200 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-mono font-semibold">Bedingung: "{selectedRule.trigger.conditionText}"</span>
                          </div>

                          {selectedRule.trigger.room && (
                            <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                              <span>Raum:</span>
                              <strong className="text-slate-300">{selectedRule.trigger.room}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ========================================= */}
                      {/* 2. UND (CONDITION FILTER) */}
                      {/* ========================================= */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 text-xs font-bold text-sky-400">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          <span>2. UND NUR WENN (FILTER)</span>
                        </div>

                        <div className={`p-4 rounded-2xl border transition-all duration-300 relative ${
                          selectedRule.isSimulating
                            ? 'bg-sky-950/40 border-sky-400 shadow-xl shadow-sky-500/20'
                            : 'bg-slate-900 border-slate-800 shadow-md'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                                {selectedRule.condition?.type === 'ambient_lux' ? <Moon className="w-5 h-5" /> :
                                 selectedRule.condition?.type === 'time_range' ? <Clock className="w-5 h-5" /> :
                                 <Filter className="w-5 h-5 text-slate-400" />}
                              </div>
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400/90 font-bold block">
                                  ZUSATZBEDINGUNG
                                </span>
                                <h4 className="text-sm font-bold text-white">
                                  {selectedRule.condition?.enabled ? selectedRule.condition.label : 'Keine Einschränkung'}
                                </h4>
                              </div>
                            </div>

                            <div className="w-5 h-5 rounded-full bg-sky-500 border-2 border-slate-950 flex items-center justify-center shadow-md text-[8px] text-slate-950 font-bold">
                              ●
                            </div>
                          </div>

                          <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-sky-200">
                            {selectedRule.condition?.enabled ? (
                              <span className="flex items-center gap-2 font-mono">
                                <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                {selectedRule.condition.label}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">
                                Immer aktiv (Tag & Nacht ausführen)
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Status:</span>
                            <strong className="text-emerald-400">Bedingung erfüllt ✓</strong>
                          </div>
                        </div>
                      </div>

                      {/* ========================================= */}
                      {/* 3. DANN (ACTIONS BLOCK) */}
                      {/* ========================================= */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 text-xs font-bold text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>3. DANN (AKTOREN & AKTIONEN)</span>
                        </div>

                        <div className="space-y-2.5">
                          {selectedRule.actions.map((act, index) => (
                            <div
                              key={act.id}
                              className={`p-4 rounded-2xl border transition-all duration-300 relative ${
                                selectedRule.isSimulating
                                  ? 'bg-emerald-950/40 border-emerald-400 shadow-xl shadow-emerald-500/20 scale-[1.02]'
                                  : 'bg-slate-900 border-emerald-500/40 shadow-md'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                    {getActionIcon(act.type)}
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/90 font-bold block">
                                      AKTOR {index + 1}: {act.type.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <h4 className="text-sm font-bold text-white">
                                      {act.targetDeviceName}
                                    </h4>
                                  </div>
                                </div>

                                <div className="w-5 h-5 rounded-full bg-emerald-400 border-2 border-slate-950 flex items-center justify-center shadow-md text-[8px] text-slate-950 font-bold">
                                  ●
                                </div>
                              </div>

                              <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-emerald-200 flex items-center justify-between font-mono">
                                <span>{act.actionText}</span>
                                {act.autoOffSeconds && (
                                  <span className="flex items-center gap-1 text-amber-300 text-[10px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80 font-bold">
                                    <Timer className="w-3 h-3" />
                                    {act.autoOffSeconds}s Timer
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Animated Glowing Connection Ribbon across the cards */}
                    <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>WENN: {selectedRule.trigger.deviceName}</span>
                      </div>
                      <ArrowRight className={`w-4 h-4 ${selectedRule.isSimulating ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
                      
                      {selectedRule.condition?.enabled && (
                        <>
                          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                            <span className="w-2 h-2 rounded-full bg-sky-400" />
                            <span>UND: {selectedRule.condition.label}</span>
                          </div>
                          <ArrowRight className={`w-4 h-4 ${selectedRule.isSimulating ? 'text-sky-400 animate-pulse' : 'text-slate-600'}`} />
                        </>
                      )}

                      <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>DANN: {selectedRule.actions.map(a => a.targetDeviceName).join(' + ')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Test Bar */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">Letzte Auslösung:</span>
                    <strong className="text-white font-mono">{selectedRule.lastTriggered || 'Nie'}</strong>
                    <span className="text-slate-600">•</span>
                    <span>Erfolgreiche Durchläufe:</span>
                    <strong className="text-amber-400 font-mono">{selectedRule.executionCount} mal</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSimulateRule(selectedRule.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold border border-slate-700 flex items-center gap-2 transition active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-sky-400" />
                      <span>Signal senden</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Keine Regel ausgewählt.
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: COMPREHENSIVE RULE CARDS LIST                      */}
        {/* ========================================================== */}
        {activeTab === 'cards' && (
          <div className="flex-1 h-full p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">Konfigurierte WENN-DANN Automations-Regeln</h3>
                <p className="text-xs text-slate-400">Übersicht aller verknüpften Sensor-zu-Aktor Ketten</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Neue Regel erstellen
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {rules.map((rule) => {
                const isSimulating = rule.isSimulating;

                return (
                  <div
                    key={rule.id}
                    className={`p-5 rounded-2xl border transition-all duration-300 relative ${
                      isSimulating
                        ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    } ${!rule.enabled ? 'opacity-65' : ''}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-xl ${
                          rule.color === 'amber' ? 'bg-amber-950/80 text-amber-400' :
                          rule.color === 'sky' ? 'bg-sky-950/80 text-sky-400' :
                          rule.color === 'rose' ? 'bg-rose-950/80 text-rose-400' :
                          rule.color === 'purple' ? 'bg-purple-950/80 text-purple-400' :
                          'bg-emerald-950/80 text-emerald-400'
                        }`}>
                          {getTriggerIcon(rule.trigger.type)}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white">{rule.title}</h4>
                          <p className="text-xs text-slate-400">{rule.description}</p>
                        </div>
                      </div>

                      {/* Header controls: Enable toggle & test button */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSimulateRule(rule.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow-sm"
                        >
                          <Play className="w-3 h-3 fill-slate-950" />
                          Testen
                        </button>
                        <button
                          onClick={(e) => handleToggleRuleActive(rule.id, e)}
                          className={`p-1.5 rounded-lg transition ${
                            rule.enabled
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                          title={rule.enabled ? 'Aktiviert (Klicken zum Pausieren)' : 'Pausiert (Klicken zum Aktivieren)'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteRule(rule.id, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Flow Path Visual Cards */}
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                      {/* Trigger line */}
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 shrink-0">
                          WENN
                        </span>
                        <span className="font-semibold text-white">{rule.trigger.deviceName}</span>
                        <span className="text-slate-400">➔ "{rule.trigger.conditionText}"</span>
                      </div>

                      {/* Condition line */}
                      {rule.condition?.enabled && (
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-sky-950 text-sky-300 border border-sky-800/80 shrink-0">
                            UND
                          </span>
                          <span className="text-sky-200">{rule.condition.label}</span>
                        </div>
                      )}

                      {/* Action lines */}
                      {rule.actions.map(act => (
                        <div key={act.id} className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 shrink-0">
                            DANN
                          </span>
                          <span className="font-semibold text-emerald-300">{act.targetDeviceName}</span>
                          <span className="text-slate-400">➔ {act.actionText}</span>
                          {act.autoOffSeconds && (
                            <span className="text-[10px] text-amber-400 font-mono font-bold ml-auto">
                              [Timer: {act.autoOffSeconds}s]
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Footer Stats */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Letzte Auslösung: <strong className="text-slate-300">{rule.lastTriggered || 'Neu'}</strong></span>
                      <span className="font-mono text-amber-400">{rule.executionCount}x ausgelöst</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 3: LIVE RULE MONITOR & EVENT LOG                      */}
        {/* ========================================================== */}
        {activeTab === 'log' && (
          <div className="flex-1 h-full p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Echtzeit Rule-Engine Monitor & Event-Log
                </h3>
                <p className="text-xs text-slate-400">
                  Live-Aufzeichnung aller ausgelösten WENN-DANN Bedingungen und Aktor-Schaltungen
                </p>
              </div>

              <button
                onClick={() => setLogs([])}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Log leeren
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-3 bg-slate-950 border-b border-slate-800 grid grid-cols-12 text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                <span className="col-span-2">Uhrzeit</span>
                <span className="col-span-3">Regel</span>
                <span className="col-span-4">Auslöser / Ursache</span>
                <span className="col-span-3">Ausgeführte Aktion</span>
              </div>

              <div className="divide-y divide-slate-800/60 max-h-[520px] overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Noch keine Log-Ereignisse aufgezeichnet. Klicke auf "Testen", um eine Regel auszulösen!
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-3 grid grid-cols-12 items-center hover:bg-slate-850/50 transition">
                      <div className="col-span-2 text-slate-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{log.timestamp}</span>
                      </div>

                      <div className="col-span-3 font-sans font-bold text-white truncate">
                        {log.ruleTitle}
                      </div>

                      <div className="col-span-4 text-amber-300/90 text-[11px] truncate">
                        {log.triggerCause}
                      </div>

                      <div className="col-span-3 text-emerald-400 text-[11px] truncate">
                        {log.executedActions.join(' • ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL: NEUE WENN-DANN REGEL ERSTELLEN                      */}
      {/* ========================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Neue WENN-DANN Automation erstellen</h3>
                  <p className="text-[11px] text-slate-400">Verknüpfe Auslöser, Bedingungen und Aktionen</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: 3 Steps Form */}
            <form onSubmit={handleSaveCustomRule} className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Rule Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Name der Automation</label>
                  <input
                    type="text"
                    value={newRuleTitle}
                    onChange={(e) => setNewRuleTitle(e.target.value)}
                    placeholder="z.B. Wenn Bewegung, dann Licht an"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Kategorie / Farbe</label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  >
                    <option value="amber">Licht & Präsenz (Gelb)</option>
                    <option value="sky">Klingel & Audio (Blau)</option>
                    <option value="emerald">Klima & Schalter (Grün)</option>
                    <option value="rose">Alarm & Schutz (Rot)</option>
                    <option value="purple">Szenen & Dämmerung (Lila)</option>
                  </select>
                </div>
              </div>

              {/* STEP 1: WENN AUSLÖSER */}
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                  <span>WENN (Auslöser auswählen)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Sensor-Typ</label>
                    <select
                      value={newTriggerType}
                      onChange={(e) => {
                        const val = e.target.value as TriggerCategory;
                        setNewTriggerType(val);
                        if (val === 'motion') {
                          setNewTriggerDevice('PIR Präsenzmelder Flur');
                          setNewTriggerCondition('Bewegung erkannt');
                        } else if (val === 'doorbell') {
                          setNewTriggerDevice('ABB Klingeltaster');
                          setNewTriggerCondition('Klingeltaster gedrückt');
                        } else if (val === 'switch') {
                          setNewTriggerDevice('Hager Wandschalter');
                          setNewTriggerCondition('Taster kurz gedrückt');
                        } else if (val === 'illuminance') {
                          setNewTriggerDevice('Dämmerungssensor');
                          setNewTriggerCondition('Helligkeit < 60 Lux');
                        } else if (val === 'temperature') {
                          setNewTriggerDevice('Raumthermostat');
                          setNewTriggerCondition('Temperatur > 25.0 °C');
                        } else if (val === 'time') {
                          setNewTriggerDevice('Uhrzeit / Astro');
                          setNewTriggerCondition('Sonnenuntergang');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                    >
                      <option value="motion">Bewegungsmelder (PIR / Kamera)</option>
                      <option value="doorbell">Türklingel / Klingeltaste</option>
                      <option value="switch">Wandschalter / Taster</option>
                      <option value="illuminance">Helligkeit / Dämmerung</option>
                      <option value="temperature">Temperatursensor</option>
                      <option value="time">Uhrzeit / Sonnenuntergang</option>
                      <option value="smoke">Rauchmelder Notfall</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Sensor-Gerät</label>
                    <input
                      type="text"
                      value={newTriggerDevice}
                      onChange={(e) => setNewTriggerDevice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Bedingungstext</label>
                    <input
                      type="text"
                      value={newTriggerCondition}
                      onChange={(e) => setNewTriggerCondition(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: UND ZUSATZBEDINGUNG */}
              <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/40 space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
                  <span>UND NUR WENN (Zusatzbedingung)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Filter-Bedingung</label>
                    <select
                      value={newConditionType}
                      onChange={(e) => setNewConditionType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                    >
                      <option value="ambient_lux">Nur wenn Raum dunkel ist (&lt; Lux)</option>
                      <option value="time_range">Nur nachts / zu bestimmter Zeit</option>
                      <option value="none">Keine Bedingung (Immer ausführen)</option>
                    </select>
                  </div>

                  {newConditionType === 'ambient_lux' && (
                    <div>
                      <label className="block text-slate-400 mb-1">Schwellenwert (Lux): {newConditionLux} Lux</label>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        value={newConditionLux}
                        onChange={(e) => setNewConditionLux(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 3: DANN AKTION */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[10px] font-black">3</span>
                  <span>DANN (Aktionen ausführen)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Aktions-Typ</label>
                    <select
                      value={newActionType}
                      onChange={(e) => setNewActionType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                    >
                      <option value="turn_on">Licht / Gerät einschalten</option>
                      <option value="dim">Licht auf Helligkeit dimmen</option>
                      <option value="turn_off">Gerät ausschalten</option>
                      <option value="play_sound">Akustischen Sound abspielen</option>
                      <option value="activate_scene">Lichtszene aktivieren</option>
                      <option value="camera_snapshot">Kamera-Foto aufnehmen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Ziel-Gerät</label>
                    <select
                      value={newActionTargetId}
                      onChange={(e) => setNewActionTargetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                    >
                      {smartDevices.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.room})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic action params */}
                  {(newActionType === 'turn_on' || newActionType === 'dim') && (
                    <div>
                      <label className="block text-slate-400 mb-1">Helligkeit: {newActionDimValue}%</label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={newActionDimValue}
                        onChange={(e) => setNewActionDimValue(Number(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer mt-2"
                      />
                    </div>
                  )}

                  {newActionType === 'play_sound' && (
                    <div>
                      <label className="block text-slate-400 mb-1">Klangart</label>
                      <select
                        value={newActionSound}
                        onChange={(e) => setNewActionSound(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                      >
                        <option value="doorbell">Westminster Ding-Dong (Gong)</option>
                        <option value="welcome">Akkord Willkommenston</option>
                        <option value="siren">Alarm-Sirene</option>
                        <option value="confirmation">Subtiler Bestätigungston</option>
                      </select>
                    </div>
                  )}

                  {newActionType === 'activate_scene' && (
                    <div>
                      <label className="block text-slate-400 mb-1">Szene</label>
                      <select
                        value={newActionScene}
                        onChange={(e) => setNewActionScene(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                      >
                        <option value="gemuetlich">Feierabend / Gemütlich</option>
                        <option value="kino">Kino / TV</option>
                        <option value="alles_aus">Alles Aus (Gute Nacht)</option>
                        <option value="tagmodus">Tagmodus (Volles Licht)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Auto-off Timer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Automatische Abschaltung nach Timer (Sekunden):</span>
                  <select
                    value={newActionTimerSec}
                    onChange={(e) => setNewActionTimerSec(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none font-mono"
                  >
                    <option value={0}>Kein Timer (Dauerhaft an)</option>
                    <option value={60}>1 Minute (60s)</option>
                    <option value={180}>3 Minuten (180s - Empfohlen für Flur)</option>
                    <option value={300}>5 Minuten (300s)</option>
                    <option value={600}>10 Minuten (600s)</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20"
                >
                  Regel speichern & aktivieren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* DRAWER: BELIEBTE WENN-DANN VORLAGEN                        */}
      {/* ========================================================== */}
      {showPresetsDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-end">
          <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-extrabold text-white">Beliebte WENN-DANN Vorlagen</h3>
                </div>
                <button
                  onClick={() => setShowPresetsDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-2 mb-4">
                Wähle eine bewährte Smart-Home Automation aus und übernimm sie mit einem Klick:
              </p>

              <div className="space-y-3">
                {RULE_PRESETS.map((preset, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 transition space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                        {preset.category}
                      </span>
                      <button
                        onClick={() => handleAdoptPreset(preset)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shadow-sm"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        Übernehmen
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                      {preset.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {preset.description}
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                      WENN {preset.trigger.conditionText} ➔ DANN {preset.actions[0]?.actionText}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-6">
              <button
                onClick={() => setShowPresetsDrawer(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

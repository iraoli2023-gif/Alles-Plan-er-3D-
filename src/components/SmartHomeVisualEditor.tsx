import React, { useState, useMemo } from 'react';
import { 
  SmartBrand, 
  LogicNode, 
  LogicConnection, 
  CameraDevice, 
  SoundDevice, 
  SmartDevice,
  AIAuditIssue,
  RoomConfig,
  ElectricalElement,
  FurnitureItem,
  LightSceneSuggestion
} from '../types';
import { 
  SMART_HOME_CATALOG, 
  CatalogComponent,
  INITIAL_CAMERAS, 
  INITIAL_SOUND_DEVICES, 
  INITIAL_LOGIC_NODES, 
  INITIAL_LOGIC_CONNECTIONS 
} from '../data/smartHomeCatalog';
import { soundSynth } from '../utils/audioSynth';
import { generateAILightSceneSuggestions } from '../utils/aiLightScenes';
import { 
  Network, 
  Sliders, 
  Video, 
  Volume2, 
  Bot, 
  Play, 
  Plus, 
  Trash2, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldCheck, 
  Sparkles, 
  Camera, 
  Bell, 
  Eye, 
  Layers, 
  Zap, 
  RefreshCw, 
  Activity, 
  Maximize2, 
  Minimize2, 
  Send, 
  RotateCcw,
  Sun,
  Moon,
  VolumeX,
  Volume1,
  Cpu,
  CornerDownRight,
  Info,
  Flame,
  Check,
  Power,
  Lightbulb,
  Briefcase,
  ChefHat,
  Tv,
  Bed,
  FileText
} from 'lucide-react';

interface SmartHomeVisualEditorProps {
  smartDevices: SmartDevice[];
  room?: RoomConfig;
  electrical?: ElectricalElement[];
  furniture?: FurnitureItem[];
  onToggleDevice?: (deviceId: string) => void;
  onUpdateDeviceValue?: (deviceId: string, value: number) => void;
  onApplyScene?: (sceneName: 'gemuetlich' | 'alles_aus' | 'tagmodus' | 'kino') => void;
}

export const SmartHomeVisualEditor: React.FC<SmartHomeVisualEditorProps> = ({
  smartDevices,
  room,
  electrical,
  furniture,
  onToggleDevice,
  onUpdateDeviceValue,
  onApplyScene,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'editor' | 'catalog' | 'cameras' | 'sound' | 'ai_auditor'>('editor');

  // Logic canvas state
  const [nodes, setNodes] = useState<LogicNode[]>(INITIAL_LOGIC_NODES);
  const [connections, setConnections] = useState<LogicConnection[]>(INITIAL_LOGIC_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-hager-dimmer');
  const [pendingConnection, setPendingConnection] = useState<{ nodeId: string; pinId: string; type: 'in' | 'out' } | null>(null);
  const [draggingNode, setDraggingNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  
  // Brand filter in canvas
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<SmartBrand | 'All'>('All');

  // Cameras state
  const [cameras, setCameras] = useState<CameraDevice[]>(INITIAL_CAMERAS);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('cam-entry');

  // Sound devices state
  const [soundDevices, setSoundDevices] = useState<SoundDevice[]>(INITIAL_SOUND_DEVICES);

  // AI Prompt & Feedback
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
  const [aiToast, setAiToast] = useState<string | null>(null);

  // AI Lighting Scenes state & generation based on floor plan and electrical planning
  const [activeGeneratedSceneId, setActiveGeneratedSceneId] = useState<string | null>('scene-ai-ambiente');
  const [aiScenesList, setAiScenesList] = useState<LightSceneSuggestion[]>(() => {
    return generateAILightSceneSuggestions(
      room || { id: 'room-1', name: 'Wohn- & Essbereich', width: 7.4, length: 5.9, height: 2.7, wallThickness: 0.24, floorTexture: 'wood_parquet', wallColor: '#f1f5f9' },
      electrical || [],
      smartDevices,
      furniture || []
    );
  });

  const handleRegenerateAIScenes = () => {
    setAiProcessing(true);
    soundSynth.playConfirmation();
    setTimeout(() => {
      const regenerated = generateAILightSceneSuggestions(
        room || { id: 'room-1', name: 'Wohn- & Essbereich', width: 7.4, length: 5.9, height: 2.7, wallThickness: 0.24, floorTexture: 'wood_parquet', wallColor: '#f1f5f9' },
        electrical || [],
        smartDevices,
        furniture || []
      );
      setAiScenesList(regenerated);
      setAiProcessing(false);
      soundSynth.playConfirmation();
      setAiToast(`KI-Audit: ${regenerated.length} Lichtszenen anhand des CAD-Grundrisses neu berechnet!`);
      setTimeout(() => setAiToast(null), 3500);
    }, 450);
  };

  const handleApplyGeneratedLightScene = (scene: LightSceneSuggestion) => {
    setActiveGeneratedSceneId(scene.id);
    soundSynth.playConfirmation();

    // Update dimmer values across matching lights
    if (onUpdateDeviceValue) {
      scene.dimmerSettings.forEach((setting) => {
        onUpdateDeviceValue(setting.deviceId, setting.dimLevelPct);
      });
    }

    // Also update any matching dimmer nodes on canvas
    setNodes(prev => prev.map(n => {
      if (n.type === 'dimmer_actor') {
        const matching = scene.dimmerSettings.find(s => s.deviceName.toLowerCase().includes('dimmer') || s.deviceId === n.id);
        const newLevel = matching ? matching.dimLevelPct : scene.dimmerSettings[0]?.dimLevelPct || 50;
        return {
          ...n,
          config: { ...n.config, dimLevelPct: newLevel },
          state: newLevel > 0,
        };
      }
      return n;
    }));

    if (onApplyScene) {
      if (scene.category === 'ambiente') onApplyScene('gemuetlich');
      else if (scene.category === 'arbeiten') onApplyScene('tagmodus');
      else if (scene.category === 'kino') onApplyScene('kino');
    }

    setAiToast(`KI-Lichtszene "${scene.name}" aktiviert (${scene.luxTarget} Lux, ${scene.colorTempKelvin}K, ${scene.estimatedWatts}W)!`);
    setTimeout(() => setAiToast(null), 3500);
  };

  const handleAdoptSceneIntoLogicCanvas = (scene: LightSceneSuggestion) => {
    soundSynth.playConfirmation();
    const sceneNodeId = `node-scene-${Date.now()}`;
    const newSceneNode: LogicNode = {
      id: sceneNodeId,
      type: 'scene_controller',
      category: 'input',
      title: `Szene: ${scene.name}`,
      brand: 'Hager',
      modelCode: 'WYA650',
      x: 80,
      y: 150 + (aiScenesList.indexOf(scene) * 120),
      inputs: [],
      outputs: [
        { id: 'out-trigger', name: 'Trigger 1-Bit', type: 'trigger' },
        { id: 'out-lux', name: 'Lux-Sollwert', type: 'number' },
      ],
      state: true,
      currentValue: scene.luxTarget,
      config: { sceneName: scene.name, luxTarget: scene.luxTarget },
    };

    // Find any dimmer actor node to connect to
    const dimmerNode = nodes.find(n => n.type === 'dimmer_actor');
    const newConns: LogicConnection[] = [...connections];

    if (dimmerNode) {
      newConns.push({
        id: `conn-scene-${Date.now()}`,
        fromNodeId: sceneNodeId,
        fromPin: 'out-trigger',
        toNodeId: dimmerNode.id,
        toPin: dimmerNode.inputs[0]?.id || 'in-trigger',
        isActive: true,
      });
    }

    setNodes(prev => [...prev, newSceneNode]);
    setConnections(newConns);
    setActiveTab('editor');
    setSelectedNodeId(sceneNodeId);
    setAiToast(`Lichtszene "${scene.name}" als Logik-Baustein ins Visual Studio übernommen!`);
    setTimeout(() => setAiToast(null), 3500);
  };

  // Selected node config modal/panel
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);
  const activeCamera = useMemo(() => cameras.find(c => c.id === selectedCameraId) || cameras[0], [cameras, selectedCameraId]);

  // AI Audit Issues evaluation
  const auditIssues = useMemo<AIAuditIssue[]>(() => {
    const issues: AIAuditIssue[] = [];

    // 1. Check for missing doorbell sound chime connection
    const doorbellNode = nodes.find(n => n.type === 'doorbell_trigger');
    if (doorbellNode) {
      const isConnectedToSound = connections.some(c => 
        c.fromNodeId === doorbellNode.id && 
        nodes.find(n => n.id === c.toNodeId)?.type === 'sound_player'
      );
      if (!isConnectedToSound) {
        issues.push({
          id: 'issue-doorbell-chime',
          severity: 'warning',
          category: 'camera_sound',
          title: 'Türklingel ohne akustischen Gong',
          description: `Die ABB Klingeltaste "${doorbellNode.title}" ist nicht mit einem Hager/Schneider Gong verbunden. Besucher werden akustisch nicht signalisiert!`,
          affectedNodeIds: [doorbellNode.id],
          autoFixable: true,
          fixLabel: 'Mit Hager EV002 Gong verbinden',
        });
      }
    }

    // 2. Check for camera motion without recording or lighting action
    const camMotionNode = nodes.find(n => n.type === 'camera_motion');
    if (camMotionNode) {
      const hasOutgoing = connections.some(c => c.fromNodeId === camMotionNode.id);
      if (!hasOutgoing) {
        issues.push({
          id: 'issue-cam-unused',
          severity: 'suggestion',
          category: 'camera_sound',
          title: 'Kamera-Bewegungserkennung ungenutzt',
          description: `Kamera "${camMotionNode.title}" meldet Bewegung, steuert aber aktuell keine Licht- oder Alarmkreise an.`,
          affectedNodeIds: [camMotionNode.id],
          autoFixable: true,
          fixLabel: 'Mit Flur-Dimmaktor verknüpfen',
        });
      }
    }

    // 3. Check for logic gates with unconnected inputs
    nodes.filter(n => n.category === 'gate').forEach(gate => {
      const missingInputs = gate.inputs.filter(inp => 
        !connections.some(c => c.toNodeId === gate.id && c.toPin === inp.id)
      );
      if (missingInputs.length > 0) {
        issues.push({
          id: `issue-gate-${gate.id}`,
          severity: 'warning',
          category: 'logic',
          title: `Unvollständiges Logik-Gatter (${gate.title})`,
          description: `Eingang "${missingInputs.map(i => i.name).join(', ')}" ist offen. Das Gatter schaltet möglicherweise fehlerhaft oder dauerhaft inaktiv.`,
          affectedNodeIds: [gate.id],
          autoFixable: true,
          fixLabel: 'Offenen Eingang mit Präsenzmelder belegen',
        });
      }
    });

    // 4. Check for Staircase Timer in continuous lighting
    const dimmersWithoutTimer = nodes.filter(n => n.type === 'dimmer_actor').filter(dimmer => {
      const directSensorConnection = connections.some(c => 
        c.toNodeId === dimmer.id && 
        nodes.find(n => n.id === c.fromNodeId)?.category === 'input'
      );
      return directSensorConnection;
    });

    if (dimmersWithoutTimer.length > 0) {
      issues.push({
        id: 'issue-no-timer',
        severity: 'suggestion',
        category: 'energy',
        title: 'Fehlende Ausschaltverzögerung (Energieeffizienz)',
        description: 'Dimmaktor wird direkt von einem Sensor geschaltet ohne Treppenlicht-Timer. Licht könnte dauerhaft brennen bleiben.',
        affectedNodeIds: dimmersWithoutTimer.map(d => d.id),
        autoFixable: true,
        fixLabel: 'Hager 30s Treppenlicht-Timer dazwischenschalten',
      });
    }

    return issues;
  }, [nodes, connections]);

  // Health Score Calculation
  const healthScore = useMemo(() => {
    let score = 100;
    auditIssues.forEach(i => {
      if (i.severity === 'critical') score -= 25;
      else if (i.severity === 'warning') score -= 12;
      else score -= 5;
    });
    return Math.max(20, Math.min(100, score));
  }, [auditIssues]);

  // Brand color helper
  const getBrandBadge = (brand: SmartBrand) => {
    switch (brand) {
      case 'Hager':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/40';
      case 'ABB':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'Schneider':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  const getBrandBorderColor = (brand: SmartBrand) => {
    switch (brand) {
      case 'Hager':
        return '#0284c7';
      case 'ABB':
        return '#ef4444';
      case 'Schneider':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  // Simulate Input Pulse / Trigger (Web Audio sound + live circuit pulse)
  const handleSimulatePulse = (nodeId: string) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    // Trigger audible tone depending on node
    if (targetNode.type === 'doorbell_trigger') {
      soundSynth.playDoorbell();
      showToast('Klingelsignal ausgelöst: Ding-Dong (Westminster Chime)');
    } else if (targetNode.type === 'camera_motion') {
      soundSynth.playConfirmation();
      showToast('Kamera-Bewegungssignal ausgelöst');
    } else {
      soundSynth.playConfirmation();
      showToast(`Signalimpuls an "${targetNode.title}" gesendet`);
    }

    // Toggle pulse state in node and downstream connections
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, state: true, currentValue: true };
      }
      return n;
    }));

    setConnections(prev => prev.map(c => {
      if (c.fromNodeId === nodeId) {
        return { ...c, isActive: true };
      }
      return c;
    }));

    // Reset pulse after 2.5s
    setTimeout(() => {
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, state: false, currentValue: false } : n));
      setConnections(prev => prev.map(c => c.fromNodeId === nodeId ? { ...c, isActive: false } : c));
    }, 2500);
  };

  // Connect Pin Handlers
  const handlePinClick = (nodeId: string, pinId: string, type: 'in' | 'out') => {
    if (!pendingConnection) {
      setPendingConnection({ nodeId, pinId, type });
      showToast(`Pin ausgewählt: ${pinId} (${type === 'out' ? 'Ausgang' : 'Eingang'}). Klicke auf den Ziel-Pin zum Verbinden.`);
    } else {
      // Trying to connect
      if (pendingConnection.nodeId === nodeId) {
        setPendingConnection(null);
        return; // can't connect to same node
      }

      if (pendingConnection.type === type) {
        showToast('Verbindung fehlgeschlagen: Kann nicht Ausgang mit Ausgang oder Eingang mit Eingang verbinden!');
        setPendingConnection(null);
        return;
      }

      const from = pendingConnection.type === 'out' ? pendingConnection : { nodeId, pinId, type };
      const to = pendingConnection.type === 'in' ? pendingConnection : { nodeId, pinId, type };

      // Check if connection already exists
      const exists = connections.some(c => 
        c.fromNodeId === from.nodeId && 
        c.fromPin === from.pinId && 
        c.toNodeId === to.nodeId && 
        c.toPin === to.pinId
      );

      if (exists) {
        showToast('Diese Verbindung existiert bereits!');
        setPendingConnection(null);
        return;
      }

      const newConn: LogicConnection = {
        id: `conn-${Date.now()}`,
        fromNodeId: from.nodeId,
        fromPin: from.pinId,
        toNodeId: to.nodeId,
        toPin: to.pinId,
        isActive: true,
      };

      setConnections(prev => [...prev, newConn]);
      soundSynth.playConfirmation();
      showToast('Leitung erfolgreich verbunden!');
      setPendingConnection(null);
    }
  };

  // Delete Connection
  const handleDeleteConnection = (connId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
    soundSynth.playConfirmation();
    showToast('Leitungsverbindung entfernt.');
  };

  // Add Component from Catalog to Canvas
  const handleAddComponentToCanvas = (component: CatalogComponent) => {
    const newNode: LogicNode = {
      id: `node-${component.brand.toLowerCase()}-${Date.now()}`,
      type: component.nodeType,
      category: component.category === 'actor' ? 'output' : component.category === 'sensor' ? 'input' : component.category === 'audio' ? 'media' : 'output',
      title: component.name,
      brand: component.brand,
      modelCode: component.modelCode,
      x: 350 + Math.random() * 100,
      y: 100 + Math.random() * 200,
      inputs: component.category === 'sensor' ? [] : [{ id: 'in_1', name: 'Signal In', type: 'boolean' }],
      outputs: [{ id: 'out_1', name: 'Status Out', type: 'boolean' }],
      state: true,
      currentValue: component.category === 'actor' ? 100 : true,
      config: {
        busAddress: `1.1.${Math.floor(Math.random() * 80) + 10}`,
        dimLevelPct: 80,
      },
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    soundSynth.playConfirmation();
    showToast(`Bauteil hinzugefügt: ${component.name} (${component.brand})`);
    setActiveTab('editor');
  };

  // AI 1-Click Auto Fix Implementation ("KI-Überprüfung & Reparatur")
  const handleAIFixAll = () => {
    setAiProcessing(true);
    setTimeout(() => {
      let updatedConns = [...connections];
      let updatedNodes = [...nodes];

      auditIssues.forEach(issue => {
        if (issue.id === 'issue-doorbell-chime') {
          const bell = updatedNodes.find(n => n.type === 'doorbell_trigger');
          const gong = updatedNodes.find(n => n.type === 'sound_player');
          if (bell && gong) {
            updatedConns.push({
              id: `conn-ai-doorbell-${Date.now()}`,
              fromNodeId: bell.id,
              fromPin: 'bell_out',
              toNodeId: gong.id,
              toPin: 'play_in',
              isActive: false,
            });
          }
        } else if (issue.id === 'issue-cam-unused') {
          const cam = updatedNodes.find(n => n.type === 'camera_motion');
          const gate = updatedNodes.find(n => n.type === 'gate_or');
          if (cam && gate) {
            updatedConns.push({
              id: `conn-ai-cam-${Date.now()}`,
              fromNodeId: cam.id,
              fromPin: 'motion_out',
              toNodeId: gate.id,
              toPin: 'in_a',
              isActive: true,
            });
          }
        }
      });

      setConnections(updatedConns);
      setNodes(updatedNodes);
      setAiProcessing(false);
      soundSynth.playWelcome();
      showToast('KI-Prüfung abgeschlossen: Alle Schaltungsmängel wurden automatisch behoben!');
    }, 900);
  };

  // AI Prompt Command Execution ("KI kann überprüfen und auch editieren")
  const handleExecuteAIPrompt = (promptText: string) => {
    const p = promptText.toLowerCase();
    setAiProcessing(true);

    setTimeout(() => {
      if (p.includes('kino') || p.includes('cinema')) {
        // AI creates Cinema setup: Dim Hager light to 15%, turn on TV, play welcome sound
        setNodes(prev => prev.map(n => {
          if (n.type === 'dimmer_actor') {
            return { ...n, currentValue: 15, config: { ...n.config, dimLevelPct: 15 } };
          }
          return n;
        }));
        soundSynth.playWelcome();
        if (onApplyScene) onApplyScene('kino');
        showToast('KI hat die Kino-Schaltung eingerichtet: Hager Dimmaktor auf 15% gestellt & Sound aktiviert.');
      } else if (p.includes('alarm') || p.includes('sirene') || p.includes('einbruch')) {
        // AI connects camera motion directly to alarm sound siren
        const cam = nodes.find(n => n.type === 'camera_motion');
        let soundAlarm = nodes.find(n => n.config.soundType === 'siren');
        if (!soundAlarm) {
          soundAlarm = {
            id: `node-ai-siren-${Date.now()}`,
            type: 'sound_player',
            category: 'media',
            title: 'Schneider Wiser Alarm-Sirene',
            brand: 'Schneider',
            modelCode: 'WSR-AUD-01',
            x: 760,
            y: 300,
            inputs: [{ id: 'play_in', name: 'Alarm auslösen', type: 'trigger' }],
            outputs: [{ id: 'busy_out', name: 'Sirene aktiv', type: 'boolean' }],
            state: false,
            config: { soundType: 'siren' },
          };
          setNodes(prev => [...prev, soundAlarm!]);
        }
        if (cam) {
          setConnections(prev => [
            ...prev,
            {
              id: `conn-ai-alarm-${Date.now()}`,
              fromNodeId: cam.id,
              fromPin: 'person_out',
              toNodeId: soundAlarm!.id,
              toPin: 'play_in',
              isActive: true,
            }
          ]);
        }
        soundSynth.playAlert();
        showToast('KI hat die Sicherheits-Logik editiert: Schneider Sirene hinzugefügt und mit Kamera gekoppelt!');
      } else if (p.includes('willkommen') || p.includes('gong') || p.includes('klingel')) {
        // Connect ABB doorbell to Hager Gong and camera snapshot
        const bell = nodes.find(n => n.type === 'doorbell_trigger');
        const gong = nodes.find(n => n.type === 'sound_player');
        const snap = nodes.find(n => n.type === 'camera_snapshot');
        if (bell && gong && snap) {
          setConnections(prev => [
            ...prev.filter(c => c.fromNodeId !== bell.id),
            { id: `c-ai-1-${Date.now()}`, fromNodeId: bell.id, fromPin: 'bell_out', toNodeId: gong.id, toPin: 'play_in', isActive: false },
            { id: `c-ai-2-${Date.now()}`, fromNodeId: bell.id, fromPin: 'bell_out', toNodeId: snap.id, toPin: 'record_in', isActive: false },
          ]);
        }
        soundSynth.playDoorbell();
        showToast('KI hat die Willkommens-Schaltung editiert: Klingel -> Hager Gong + ABB Kamera-Foto!');
      } else {
        // Generic AI optimization
        handleAIFixAll();
      }

      setAiProcessing(false);
      setAiPrompt('');
    }, 1000);
  };

  const showToast = (msg: string) => {
    setAiToast(msg);
    setTimeout(() => setAiToast(null), 4000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 text-sky-400 border border-sky-500/30">
            <Cpu className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-wide">
                Smart Home Visual Editor & Bauteil-Studio
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                Hager • ABB • Schneider
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visuelle Logikschaltungen, Videoüberwachung, Multiroom-Sound und autonome KI-Überprüfung mit Live-Editor.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-sky-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Schaltplan-Editor ({nodes.length})
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-sky-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Bauteile-Katalog
          </button>

          <button
            onClick={() => setActiveTab('cameras')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'cameras'
                ? 'bg-sky-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Kamera-Leitstand ({cameras.length})
          </button>

          <button
            onClick={() => setActiveTab('sound')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'sound'
                ? 'bg-sky-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Sound & Gong
          </button>

          <button
            onClick={() => setActiveTab('ai_auditor')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ai_auditor'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            KI-Auditor ({healthScore}%)
            {auditIssues.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Floating AI Notification Toast */}
      {aiToast && (
        <div className="mx-4 mt-2 p-3 bg-indigo-950/80 border border-indigo-700 rounded-xl text-xs text-indigo-200 flex items-center justify-between shadow-xl animate-fadeIn z-30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{aiToast}</span>
          </div>
          <button 
            onClick={() => setAiToast(null)}
            className="text-slate-400 hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: VISUAL CIRCUIT & LOGIC NODE EDITOR */}
      {activeTab === 'editor' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Main Visual Node Flow Canvas */}
          <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden border-r border-slate-800/80">
            {/* Canvas Sub-toolbar */}
            <div className="p-2.5 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-semibold">Hersteller filtern:</span>
                {(['All', 'Hager', 'ABB', 'Schneider'] as const).map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrandFilter(brand)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                      selectedBrandFilter === brand
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {brand === 'All' ? 'Alle' : brand}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {pendingConnection && (
                  <span className="text-[11px] text-amber-300 font-semibold animate-pulse flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Klicke Ziel-Pin an...
                    <button 
                      onClick={() => setPendingConnection(null)} 
                      className="ml-1 underline text-slate-400 hover:text-white"
                    >
                      Abbrechen
                    </button>
                  </span>
                )}
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold rounded-lg flex items-center gap-1 transition text-xs"
                >
                  <Plus className="w-3 h-3" />
                  Bauteil einfügen
                </button>
                <button
                  onClick={handleAIFixAll}
                  disabled={aiProcessing}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1 transition text-xs"
                  title="KI prüft Verbindungen und korrigiert automatisch"
                >
                  <Sparkles className="w-3 h-3" />
                  KI-Prüfen & Reparieren
                </button>
              </div>
            </div>

            {/* Interactive SVG Canvas */}
            <div 
              className="flex-1 relative overflow-auto p-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] touch-none"
              onMouseMove={(e) => {
                if (!draggingNode) return;
                const canvasRect = e.currentTarget.getBoundingClientRect();
                const mouseCanvasX = e.clientX - canvasRect.left + e.currentTarget.scrollLeft;
                const mouseCanvasY = e.clientY - canvasRect.top + e.currentTarget.scrollTop;
                const newX = Math.max(10, Math.min(1800, mouseCanvasX - draggingNode.offsetX));
                const newY = Math.max(10, Math.min(1400, mouseCanvasY - draggingNode.offsetY));
                setNodes(prev => prev.map(n => n.id === draggingNode.id ? { ...n, x: Math.round(newX), y: Math.round(newY) } : n));
              }}
              onMouseUp={() => setDraggingNode(null)}
              onMouseLeave={() => setDraggingNode(null)}
              onTouchMove={(e) => {
                if (!draggingNode || e.touches.length !== 1) return;
                const touch = e.touches[0];
                const canvasRect = e.currentTarget.getBoundingClientRect();
                const touchCanvasX = touch.clientX - canvasRect.left + e.currentTarget.scrollLeft;
                const touchCanvasY = touch.clientY - canvasRect.top + e.currentTarget.scrollTop;
                const newX = Math.max(10, Math.min(1800, touchCanvasX - draggingNode.offsetX));
                const newY = Math.max(10, Math.min(1400, touchCanvasY - draggingNode.offsetY));
                setNodes(prev => prev.map(n => n.id === draggingNode.id ? { ...n, x: Math.round(newX), y: Math.round(newY) } : n));
              }}
              onTouchEnd={() => setDraggingNode(null)}
              onTouchCancel={() => setDraggingNode(null)}
            >
              {/* SVG Layer for Drawing Cable Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {connections.map(conn => {
                  const fromNode = nodes.find(n => n.id === conn.fromNodeId);
                  const toNode = nodes.find(n => n.id === conn.toNodeId);
                  if (!fromNode || !toNode) return null;

                  // Compute pin coordinates
                  const x1 = fromNode.x + 220; // right edge of fromNode
                  const y1 = fromNode.y + 60;  // approximate output port height
                  const x2 = toNode.x;         // left edge of toNode
                  const y2 = toNode.y + 60;    // approximate input port height

                  // Smooth Bezier Curve
                  const dx = Math.abs(x2 - x1) * 0.5;
                  const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                  return (
                    <g key={conn.id} className="cursor-pointer pointer-events-auto group">
                      {/* Wider click area */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="16"
                        onClick={() => handleDeleteConnection(conn.id)}
                      />
                      {/* Connection Cable */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={conn.isActive ? '#38bdf8' : '#475569'}
                        strokeWidth={conn.isActive ? 3.5 : 2}
                        className="transition-all"
                      />
                      {/* Active Flow Animated Dash */}
                      {conn.isActive && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeDasharray="6 12"
                          className="animate-flowDash"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Node Components Rendering */}
              {nodes
                .filter(n => selectedBrandFilter === 'All' || n.brand === selectedBrandFilter || n.brand === 'Universal')
                .map(node => {
                  const isSelected = node.id === selectedNodeId;
                  const borderCol = getBrandBorderColor(node.brand);

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{
                        position: 'absolute',
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                        width: '220px',
                        borderColor: isSelected ? '#38bdf8' : borderCol,
                      }}
                      className={`rounded-xl bg-slate-900 border-2 shadow-xl backdrop-blur-sm z-10 transition-all select-none ${
                        isSelected ? 'ring-2 ring-sky-500/50 scale-[1.02]' : 'hover:border-slate-500'
                      }`}
                    >
                      {/* Node Header (Draggable via Mouse or Touch) */}
                      <div 
                        onMouseDown={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          const canvasElem = e.currentTarget.closest('.relative.overflow-auto');
                          if (!canvasElem) return;
                          const canvasRect = canvasElem.getBoundingClientRect();
                          const mouseCanvasX = e.clientX - canvasRect.left + canvasElem.scrollLeft;
                          const mouseCanvasY = e.clientY - canvasRect.top + canvasElem.scrollTop;
                          setDraggingNode({
                            id: node.id,
                            offsetX: mouseCanvasX - node.x,
                            offsetY: mouseCanvasY - node.y,
                          });
                        }}
                        onTouchStart={(e) => {
                          if ((e.target as HTMLElement).closest('button') || e.touches.length !== 1) return;
                          const touch = e.touches[0];
                          const canvasElem = e.currentTarget.closest('.relative.overflow-auto');
                          if (!canvasElem) return;
                          const canvasRect = canvasElem.getBoundingClientRect();
                          const touchCanvasX = touch.clientX - canvasRect.left + canvasElem.scrollLeft;
                          const touchCanvasY = touch.clientY - canvasRect.top + canvasElem.scrollTop;
                          setDraggingNode({
                            id: node.id,
                            offsetX: touchCanvasX - node.x,
                            offsetY: touchCanvasY - node.y,
                          });
                        }}
                        className="p-2.5 bg-slate-950/70 border-b border-slate-800 rounded-t-lg flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden pointer-events-none">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${getBrandBadge(node.brand)}`}>
                            {node.brand}
                          </span>
                          <span className="text-xs font-bold text-white truncate" title={node.title}>
                            {node.title}
                          </span>
                        </div>

                        {/* Trigger / Simulate Button on Inputs */}
                        {node.category === 'input' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSimulatePulse(node.id);
                            }}
                            className="p-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 border border-amber-500/30 transition text-[10px] flex items-center gap-1"
                            title="Testimpuls senden & Sound abspielen"
                          >
                            <Play className="w-3 h-3 fill-amber-400" />
                          </button>
                        )}
                      </div>

                      {/* Node Body & Pins */}
                      <div className="p-3 text-xs space-y-2">
                        {node.modelCode && (
                          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                            <span>Modell: {node.modelCode}</span>
                            {node.config.busAddress && (
                              <span className="text-sky-300">KNX {node.config.busAddress}</span>
                            )}
                          </div>
                        )}

                        {/* Input Pins */}
                        {node.inputs.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Eingänge</span>
                            {node.inputs.map(inp => (
                              <div key={inp.id} className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePinClick(node.id, inp.id, 'in');
                                  }}
                                  className={`w-3 h-3 rounded-full border transition ${
                                    pendingConnection?.nodeId === node.id && pendingConnection.pinId === inp.id
                                      ? 'bg-amber-400 border-white animate-ping'
                                      : 'bg-slate-800 border-slate-500 hover:bg-sky-400 hover:border-white'
                                  }`}
                                  title={`Verbinde Eingang: ${inp.name}`}
                                />
                                <span className="text-[11px] text-slate-300">{inp.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Output Pins */}
                        {node.outputs.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-800/80">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block text-right">Ausgänge</span>
                            {node.outputs.map(out => (
                              <div key={out.id} className="flex items-center justify-end gap-1.5">
                                <span className="text-[11px] text-slate-300">{out.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePinClick(node.id, out.id, 'out');
                                  }}
                                  className={`w-3 h-3 rounded-full border transition ${
                                    pendingConnection?.nodeId === node.id && pendingConnection.pinId === out.id
                                      ? 'bg-amber-400 border-white animate-ping'
                                      : 'bg-sky-500 border-white hover:bg-amber-400'
                                  }`}
                                  title={`Verbinde Ausgang: ${out.name}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Dynamic Value Display */}
                        {node.currentValue !== undefined && (
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Aktueller Wert:</span>
                            <span className="font-mono font-bold text-sky-400">
                              {typeof node.currentValue === 'boolean'
                                ? (node.currentValue ? 'EIN (Aktiv)' : 'AUS')
                                : `${node.currentValue} ${node.type === 'dimmer_actor' ? '%' : ''}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Inspector & Node Config Panel */}
          <div className="w-80 bg-slate-900/90 border-l border-slate-800 flex flex-col p-4 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-400" />
                Bauteil-Parameter
              </h3>
              {selectedNode && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBrandBadge(selectedNode.brand)}`}>
                  {selectedNode.brand}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">{selectedNode.title}</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Modell: {selectedNode.modelCode || 'Universal Gatter'} • Typ: {selectedNode.type}
                  </p>
                </div>

                {/* Bus Address Config */}
                {selectedNode.config.busAddress && (
                  <div>
                    <label className="text-slate-400 block mb-1">KNX Gruppenadresse:</label>
                    <input
                      type="text"
                      value={selectedNode.config.busAddress}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, busAddress: val } } : n));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-white text-xs"
                    />
                  </div>
                )}

                {/* Dim Level Config */}
                {selectedNode.type === 'dimmer_actor' && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Dimmwert bei Aktivierung:</span>
                      <span className="font-mono text-white font-bold">{selectedNode.config.dimLevelPct ?? 80}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedNode.config.dimLevelPct ?? 80}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, currentValue: val, config: { ...n.config, dimLevelPct: val } } : n));
                        if (onUpdateDeviceValue && selectedNode.config.targetDeviceId) {
                          onUpdateDeviceValue(selectedNode.config.targetDeviceId, val);
                        }
                      }}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                )}

                {/* Staircase Timer Config */}
                {selectedNode.type === 'timer_staircase' && (
                  <div>
                    <label className="text-slate-400 block mb-1">Ausschaltverzögerung (Sekunden):</label>
                    <input
                      type="number"
                      min="5"
                      max="3600"
                      value={selectedNode.config.delaySeconds ?? 30}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, delaySeconds: val } } : n));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-white text-xs"
                    />
                  </div>
                )}

                {/* Sound Type Selection */}
                {selectedNode.type === 'sound_player' && (
                  <div>
                    <label className="text-slate-400 block mb-1">Klangart / Gongmelodie:</label>
                    <select
                      value={selectedNode.config.soundType ?? 'doorbell'}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, soundType: val } } : n));
                        soundSynth.playSoundByType(val);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    >
                      <option value="doorbell">Westminster Ding-Dong (Türgong)</option>
                      <option value="siren">Alarmsirene (Einbruchsschutz)</option>
                      <option value="welcome">Willkommens-Jingle (A-Dur Akkord)</option>
                      <option value="alert">Klima-Alarm (Terrarium Warnung)</option>
                      <option value="ding">Bestätigungs-Ton (Klick/Quittierung)</option>
                    </select>

                    <button
                      onClick={() => soundSynth.playSoundByType(selectedNode.config.soundType ?? 'doorbell')}
                      className="mt-2 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Sound probehören (Web Audio)
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <button
                    onClick={() => handleSimulatePulse(selectedNode.id)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    Signal senden / Impuls testen
                  </button>

                  <button
                    onClick={() => {
                      setNodes(prev => prev.filter(n => n.id !== selectedNode.id));
                      setConnections(prev => prev.filter(c => c.fromNodeId !== selectedNode.id && c.toNodeId !== selectedNode.id));
                      setSelectedNodeId(null);
                      showToast('Bauteil aus Schaltplan entfernt.');
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Bauteil löschen
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                Klicke ein Bauteil im Schaltplan an, um dessen KNX-Parameter, Dimmniveaus oder Sound-Aktionen zu konfigurieren.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPONENT CATALOG (Hager, ABB, Schneider) */}
      {activeTab === 'catalog' && (
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Hersteller-Bauteilekatalog: Hager, ABB & Schneider Electric
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Wähle zertifizierte KNX-, Matter-, DALI- und Video-Module aus und füge sie mit 1 Klick in den Schaltplan-Editor ein.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SMART_HOME_CATALOG.map(comp => (
              <div
                key={comp.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${comp.badgeColor}`}>
                      {comp.brand}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {comp.busType}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2">{comp.name}</h4>
                  <span className="text-[10px] font-mono text-sky-400 block mt-0.5">
                    Modell-Code: {comp.modelCode} • {comp.channels} Kanal/Kanäle
                  </span>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {comp.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Eigenbedarf: <strong className="text-amber-400 font-mono">{comp.defaultPowerWatts} W</strong>
                  </span>

                  <button
                    onClick={() => handleAddComponentToCanvas(comp)}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    In Schaltplan einfügen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CAMERA SURVEILLANCE & STREAM CENTER */}
      {activeTab === 'cameras' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Camera List / Selector */}
          <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto space-y-3 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Video className="w-4 h-4 text-sky-400" />
              Sicherheitskameras ({cameras.length})
            </h3>

            {cameras.map(cam => {
              const isSelected = cam.id === selectedCameraId;
              return (
                <div
                  key={cam.id}
                  onClick={() => setSelectedCameraId(cam.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-sky-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${getBrandBadge(cam.brand)}`}>
                      {cam.brand}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {cam.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mt-1.5">{cam.name}</h4>
                  <span className="text-[10px] text-slate-400 block">{cam.location} • {cam.resolution}</span>

                  {cam.motionDetected && (
                    <div className="mt-2 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-[10px] text-amber-300 font-bold flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      Bewegung erkannt ({cam.lastMotionTime})
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Main Simulated Live Video Viewport */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-sky-400" />
                  Live-Videostream: {activeCamera.name}
                </h3>
                <span className="text-xs text-slate-400">
                  {activeCamera.brand} {activeCamera.modelCode} • RTSP / H.265 Stream • 25 FPS
                </span>
              </div>

              {/* Quick Camera Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCameras(prev => prev.map(c => c.id === activeCamera.id ? { ...c, nightVision: !c.nightVision } : c));
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    activeCamera.nightVision
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  IR Nachtsicht: {activeCamera.nightVision ? 'AN' : 'AUS'}
                </button>

                <button
                  onClick={() => {
                    // Trigger motion detection
                    setCameras(prev => prev.map(c => c.id === activeCamera.id ? { ...c, motionDetected: true, lastMotionTime: 'gerade eben' } : c));
                    soundSynth.playConfirmation();
                    showToast(`Kamera-Bewegungssimulation für "${activeCamera.name}" aktiviert!`);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Bewegung simulieren
                </button>
              </div>
            </div>

            {/* Video Canvas Box */}
            <div className={`relative w-full aspect-video rounded-2xl overflow-hidden border-2 shadow-2xl flex items-center justify-center select-none ${
              activeCamera.nightVision
                ? 'bg-emerald-950/80 border-emerald-700/60 grayscale contrast-125'
                : 'bg-slate-950 border-slate-800'
            }`}>
              {/* Scanline / Grid overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none" />

              {/* Video Info Watermark */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-sm text-[11px] font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold text-white">REC LIVE</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-200">{new Date().toLocaleTimeString()}</span>
              </div>

              {/* PTZ Joystick HUD */}
              <div className="absolute bottom-4 right-4 z-10 bg-black/70 p-2.5 rounded-2xl backdrop-blur-sm border border-slate-700 text-xs flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold">PTZ STEUERUNG</span>
                <div className="grid grid-cols-3 gap-1">
                  <span />
                  <button 
                    onClick={() => setCameras(prev => prev.map(c => c.id === activeCamera.id ? { ...c, ptz: { ...c.ptz, tilt: c.ptz.tilt + 5 } } : c))}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold"
                  >▲</button>
                  <span />
                  <button 
                    onClick={() => setCameras(prev => prev.map(c => c.id === activeCamera.id ? { ...c, ptz: { ...c.ptz, pan: c.ptz.pan - 5 } } : c))}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold"
                  >◀</button>
                  <button 
                    onClick={() => setCameras(prev => prev.map(c => c.id === activeCamera.id ? { ...c, ptz: { pan: 0, tilt: 0, zoom: 1 } } : c))}
                    className="p-1 bg-sky-600 rounded text-slate-950 font-bold text-[10px]"
                  >0</button>
                  <button 
                    onClick={() => setCameras(prev => prev.map(c => c.id === activeCamera.id ? { ...c, ptz: { ...c.ptz, pan: c.ptz.pan + 5 } } : c))}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold"
                  >▶</button>
                  <span />
                  <button 
                    onClick={() => setCameras(prev => prev.map(c => c.id === activeCamera.id ? { ...c, ptz: { ...c.ptz, tilt: c.ptz.tilt - 5 } } : c))}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold"
                  >▼</button>
                  <span />
                </div>
              </div>

              {/* AI Detection Bounding Boxes Overlay */}
              <div className="relative z-10 p-8 border border-sky-400/40 rounded-xl bg-sky-500/5 max-w-sm text-center">
                <div className="text-xs font-bold text-sky-400 mb-1 flex items-center justify-center gap-1.5">
                  <Bot className="w-4 h-4 text-sky-400" />
                  KI-Objekterkennung aktiv:
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {activeCamera.detectedObjects.map((obj, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-700 text-sky-300 text-[11px] font-semibold">
                      {obj}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-slate-400">
                  PTZ Winkel: Pan {activeCamera.ptz.pan}° / Tilt {activeCamera.ptz.tilt}° • Zoom: {activeCamera.ptz.zoom}x
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SOUND, CHIMES & MULTIROOM AUDIO CENTER */}
      {activeTab === 'sound' && (
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-sky-400" />
              Multiroom Sound-System, Türklingeln & Alarm-Gongs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Integrierter Web Audio API Sound-Synthesizer für Türklingeln, Sirenen, Feierabend-Musik und Sprachhinweise.
            </p>
          </div>

          {/* Sound Synthesizer Test Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Sound-Effekte direkt im Browser abspielen (Web Audio API)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Doorbell */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-sky-500/20 text-sky-400 border-sky-500/40">
                      Hager EV002
                    </span>
                    <Bell className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">Westminster Ding-Dong</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Klassischer zweistimmiger Gong (659Hz / 523Hz) für Haustür und Klingeltaster.
                  </p>
                </div>
                <button
                  onClick={() => soundSynth.playDoorbell()}
                  className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Gong abspielen
                </button>
              </div>

              {/* Siren */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                      Schneider Wiser
                    </span>
                    <Flame className="w-4 h-4 text-rose-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">Alarmsirene (Einbruch)</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Frequenzmodulierte Sägezahn-Sirene (700Hz - 1200Hz) für Alarm- und Sabotageschutz.
                  </p>
                </div>
                <button
                  onClick={() => soundSynth.playSiren()}
                  className="mt-4 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Sirene testen
                </button>
              </div>

              {/* Welcome */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/40">
                      ABB AudioWorld
                    </span>
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">Willkommens-Jingle</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Sanfter 4-Ton A-Dur Akkord zur Begrüßung beim Betreten des Hauses.
                  </p>
                </div>
                <button
                  onClick={() => soundSynth.playWelcome()}
                  className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Jingle abspielen
                </button>
              </div>

              {/* Terrarium Alert */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded border bg-amber-500/20 text-amber-400 border-amber-500/40">
                      Terrarium Alarm
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">Klima-Warnsignal</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Dreifacher Rechteck-Impuls (950Hz) bei Übertemperatur oder Trockenheit.
                  </p>
                </div>
                <button
                  onClick={() => soundSynth.playAlert()}
                  className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Warnsignal testen
                </button>
              </div>
            </div>
          </div>

          {/* Sound Devices List & Volume Sliders */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Verbundene Audio-Module & Zonen-Lautstärken
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {soundDevices.map(snd => (
                <div key={snd.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getBrandBadge(snd.brand)}`}>
                      {snd.brand}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Zone: {snd.zone}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">{snd.name}</h4>
                    <span className="text-[10px] text-slate-400">Modell: {snd.modelCode}</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400">Lautstärke:</span>
                      <span className="font-mono font-bold text-white">{snd.volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={snd.volume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSoundDevices(prev => prev.map(s => s.id === snd.id ? { ...s, volume: val } : s));
                      }}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI AUDITOR & AUTOMATION ENGINEER */}
      {activeTab === 'ai_auditor' && (
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {/* Header & Health Score Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-sky-950/80 border border-indigo-700/60 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Bot className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    KI-Auditor & Autonomer Smart Home Engineer
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    Live-Analyse & Auto-Editor
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Die KI überprüft Logikschaltungen, Hersteller-Kompatibilität zwischen Hager, ABB und Schneider sowie Kamera- und Sound-Trigger und kann gefundene Mängel direkt editieren.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">System Health Score</span>
                <span className={`text-2xl font-black font-mono ${
                  healthScore > 85 ? 'text-emerald-400' : healthScore > 65 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {healthScore} / 100
                </span>
              </div>

              <button
                onClick={handleAIFixAll}
                disabled={aiProcessing}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {aiProcessing ? 'KI repariert Schaltung...' : 'Alle Mängel per KI beheben'}
              </button>
            </div>
          </div>

          {/* AI Natural Language Prompt & Editor Input */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              KI-Prompt-Editor: Schaltungen per natürlicher Sprache erstellen & editieren
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiPrompt.trim()) {
                    handleExecuteAIPrompt(aiPrompt);
                  }
                }}
                placeholder="z. B. 'Erstelle eine Kino-Szene mit ABB Taster, dezentem Sound und 15% Hager Licht' oder 'Verbinde Kamera mit Sirene'..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => {
                  if (aiPrompt.trim()) handleExecuteAIPrompt(aiPrompt);
                }}
                disabled={aiProcessing || !aiPrompt.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Ausführen
              </button>
            </div>

            {/* Pre-made AI Action Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold self-center">Vorschläge:</span>
              <button
                onClick={() => handleExecuteAIPrompt('Kino-Szene mit dezentem Sound und 15% Licht')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] border border-slate-700 transition"
              >
                🎬 Kino-Modus einrichten
              </button>
              <button
                onClick={() => handleExecuteAIPrompt('Türklingel mit Hager Gong und Kamera-Foto verbinden')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] border border-slate-700 transition"
              >
                🔔 Willkommens-Gong & Schnappschuss
              </button>
              <button
                onClick={() => handleExecuteAIPrompt('Kamera-Bewegung mit Schneider Sirene koppeln')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] border border-slate-700 transition"
              >
                🚨 Alarm-Sirene bei Einbruch
              </button>
            </div>
          </div>

          {/* Diagnostic Inspection Findings */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Erkannte Prüfpunkte & Optimierungsvorschläge ({auditIssues.length})</span>
              <span className="text-[11px] font-normal text-slate-500">
                Geprüft nach VDI 3813 / DIN EN 50090
              </span>
            </h4>

            {auditIssues.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Alle Schaltungen arbeiten einwandfrei!</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Es wurden keine offenen Gatter, fehlenden Alarme oder unverbundenen Klingelsignale gefunden. Die Interoperabilität zwischen Hager, ABB und Schneider ist gewährleistet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditIssues.map(issue => (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-2xl border transition flex flex-wrap items-center justify-between gap-3 ${
                      issue.severity === 'critical'
                        ? 'bg-rose-950/40 border-rose-800/60'
                        : issue.severity === 'warning'
                        ? 'bg-amber-950/40 border-amber-800/60'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5">
                        {issue.severity === 'critical' && <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />}
                        {issue.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                        {issue.severity === 'suggestion' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{issue.title}</h4>
                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {issue.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    {issue.autoFixable && issue.fixLabel && (
                      <button
                        onClick={handleAIFixAll}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition active:scale-95 shrink-0"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        {issue.fixLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI-DRIVEN CAD & LIGHTING SCENE GENERATOR (Grundriss- & Lichtplanungs-Audit) */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Lightbulb className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      KI-Lichtszenen-Generator (Grundriss & Photometrie nach DIN EN 12464-1)
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      CAD-basiert
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generiert dynamische Lichtkonzepte basierend auf den Maßen ({room?.width || 7.4}m × {room?.length || 5.9}m), Möblierungszonen und installierten Dimmaktoren.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRegenerateAIScenes}
                disabled={aiProcessing}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${aiProcessing ? 'animate-spin' : ''}`} />
                Grundriss neu analysieren
              </button>
            </div>

            {/* Grid of AI Generated Light Scenes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
              {aiScenesList.map((scene) => {
                const isActive = activeGeneratedSceneId === scene.id;
                return (
                  <div
                    key={scene.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-950/30 border-amber-500/80 shadow-lg shadow-amber-950/50'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                          scene.category === 'ambiente'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : scene.category === 'arbeiten'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : scene.category === 'kochen'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : scene.category === 'kino'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : scene.category === 'nacht'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {scene.category.toUpperCase()}
                        </span>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                          <span className="text-amber-400">{scene.luxTarget} Lux</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300">{scene.colorTempKelvin}K</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-emerald-400">-{scene.energySavingPct}% W</span>
                        </div>
                      </div>

                      {/* Scene Title & Description */}
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {scene.category === 'ambiente' && <Sparkles className="w-4 h-4 text-rose-400" />}
                          {scene.category === 'arbeiten' && <Briefcase className="w-4 h-4 text-sky-400" />}
                          {scene.category === 'kochen' && <ChefHat className="w-4 h-4 text-amber-400" />}
                          {scene.category === 'kino' && <Tv className="w-4 h-4 text-purple-400" />}
                          {scene.category === 'nacht' && <Moon className="w-4 h-4 text-indigo-400" />}
                          {scene.category === 'terrarium_cycle' && <Sun className="w-4 h-4 text-emerald-400" />}
                          {scene.name}
                        </h5>
                        {isActive && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                            Aktiv
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {scene.description}
                      </p>

                      {/* CAD & Photometric Rationale */}
                      <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                        <strong className="text-amber-300 block mb-0.5">KI-Grundriss-Begründung:</strong>
                        {scene.rationale}
                      </div>

                      {/* Channel Dimmers Configuration */}
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Kanal-Dimmwerte ({scene.estimatedWatts} W Gesamtlast)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {scene.dimmerSettings.map((d, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[10px] text-slate-200 flex items-center gap-1.5"
                            >
                              <span className="font-semibold text-white">{d.deviceName}:</span>
                              <strong className="text-amber-400 font-mono">{d.dimLevelPct}%</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 mt-2">
                      <button
                        onClick={() => handleApplyGeneratedLightScene(scene)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shadow ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/30'
                        }`}
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        {isActive ? 'Szene aktiv' : 'Szene aktivieren'}
                      </button>

                      <button
                        onClick={() => handleAdoptSceneIntoLogicCanvas(scene)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
                        title="Als Szenen-Trigger-Knoten in das visuelle Logik-Studio einfügen"
                      >
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        Ins Logik-Studio
                      </button>
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

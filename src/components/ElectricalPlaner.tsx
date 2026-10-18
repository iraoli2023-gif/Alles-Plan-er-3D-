import React, { useState, useMemo } from 'react';
import { 
  RoomConfig, 
  ElectricalElement, 
  WiringRoute, 
  BreakerCircuit, 
  CableType,
  ElectricalType 
} from '../types';
import { 
  Zap, 
  Cable, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle, 
  Plus, 
  Trash2, 
  FileText, 
  Layers, 
  CheckCircle2, 
  XCircle,
  Info, 
  Sliders,
  Maximize,
  ArrowRight,
  ExternalLink,
  MapPin,
  Bot,
  Home,
  Ruler,
  Compass,
  CornerDownRight,
  RotateCcw,
  Sparkles,
  Check,
  Eye
} from 'lucide-react';
import { DIN18015ReportGenerator } from './DIN18015ReportGenerator';
import { WiringOverlayVisualizer } from './WiringOverlayVisualizer';
import { AIAuditor } from './AIAuditor';
import { 
  calculateRouteCableLength, 
  recalculateAllWiringRoutes, 
  getWallDisplayName, 
  getElementWall, 
  CableLengthCalculationResult 
} from '../utils/cableLengthCalculator';

interface ElectricalPlanerProps {
  room: RoomConfig;
  rooms?: RoomConfig[];
  activeRoomId?: string;
  onSelectRoom?: (roomId: string) => void;
  onOpenRoomManager?: () => void;
  electrical: ElectricalElement[];
  wiring: WiringRoute[];
  circuits: BreakerCircuit[];
  onUpdateElectrical: (items: ElectricalElement[]) => void;
  onUpdateWiring: (routes: WiringRoute[]) => void;
  onUpdateCircuits?: (circuits: BreakerCircuit[]) => void;
  onSelectElementFor3D?: (id: string) => void;
}

export const ElectricalPlaner: React.FC<ElectricalPlanerProps> = ({
  room,
  rooms,
  activeRoomId = room.id,
  onSelectRoom,
  onOpenRoomManager,
  electrical,
  wiring,
  circuits,
  onUpdateElectrical,
  onUpdateWiring,
  onUpdateCircuits,
}) => {
  const allRooms = useMemo(() => {
    if (rooms && rooms.length > 0) return rooms;
    return [room];
  }, [rooms, room]);

  const activeRoom = useMemo(() => {
    return allRooms.find(r => r.id === activeRoomId) || allRooms[0] || room;
  }, [allRooms, activeRoomId, room]);

  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [filterCircuit, setFilterCircuit] = useState<string>('all');
  const [showDINZones, setShowDINZones] = useState<boolean>(true);
  const [showAutoRouterModal, setShowAutoRouterModal] = useState<boolean>(false);
  const [showComplianceReport, setShowComplianceReport] = useState<boolean>(false);
  const [showAIAuditorModal, setShowAIAuditorModal] = useState<boolean>(false);
  const [showWiringOverlay, setShowWiringOverlay] = useState<boolean>(true);
  const [isOverlayExpanded, setIsOverlayExpanded] = useState<boolean>(false);

  // New route creation state
  const [routeFromId, setRouteFromId] = useState<string>('el-uv');
  const [routeToId, setRouteToId] = useState<string>('');
  const [routeCableType, setRouteCableType] = useState<CableType>('NYM-J 3x1.5 mm²');
  const [routeInstallationZone, setRouteInstallationZone] = useState<
    'DIN 18015 Decke (15-30cm)' | 'DIN 18015 Boden (15-30cm)' | 'Estrichverlegung'
  >('DIN 18015 Decke (15-30cm)');
  const [routeConduitType, setRouteConduitType] = useState<WiringRoute['conduitType']>('Unterputz (UP)');
  const [recalcNotification, setRecalcNotification] = useState<string | null>(null);
  const [showWallAnalysis, setShowWallAnalysis] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'element' | 'route'>('route');

  const selectedElement = useMemo(() => {
    return electrical.find(e => e.id === selectedElementId) || null;
  }, [electrical, selectedElementId]);

  // Real-time calculation of all route lengths based on room wall layout
  const routeCalculationsMap = useMemo(() => {
    const map = new Map<string, CableLengthCalculationResult>();
    wiring.forEach(w => {
      const fromEl = electrical.find(e => e.id === w.fromId);
      const toEl = electrical.find(e => e.id === w.toId);
      if (fromEl && toEl) {
        const calc = calculateRouteCableLength(
          fromEl,
          toEl,
          activeRoom,
          w.cableType,
          { installationZone: w.installationZone as any },
          allRooms
        );
        map.set(w.id, calc);
      }
    });
    return map;
  }, [wiring, electrical, activeRoom, allRooms]);

  const selectedRoute = useMemo(() => {
    return wiring.find(w => w.id === selectedRouteId) || null;
  }, [wiring, selectedRouteId]);

  const selectedRouteCalc = useMemo(() => {
    if (!selectedRoute) return null;
    return routeCalculationsMap.get(selectedRoute.id) || null;
  }, [selectedRoute, routeCalculationsMap]);

  // Live preview for AutoRouter modal
  const previewModalCalc = useMemo(() => {
    if (!routeFromId || !routeToId || routeFromId === routeToId) return null;
    const fromEl = electrical.find(e => e.id === routeFromId);
    const toEl = electrical.find(e => e.id === routeToId);
    if (!fromEl || !toEl) return null;
    return calculateRouteCableLength(
      fromEl,
      toEl,
      activeRoom,
      routeCableType,
      { installationZone: routeInstallationZone },
      allRooms
    );
  }, [routeFromId, routeToId, routeCableType, routeInstallationZone, electrical, activeRoom, allRooms]);

  // Wall-based cable length statistics (length of cables installed per wall)
  const wallCableStats = useMemo(() => {
    const wallLengths: Record<string, number> = {
      'Nordwand': 0,
      'Südwand': 0,
      'Ostwand': 0,
      'Westwand': 0,
      'Decke': 0,
      'Estrich/Boden': 0,
    };
    let totalCornerBends = 0;
    let totalReservesMeters = 0;
    let totalGeometricMeters = 0;

    wiring.forEach(w => {
      const calc = routeCalculationsMap.get(w.id);
      if (calc) {
        totalCornerBends += calc.cornersCount;
        totalReservesMeters += calc.reserveMeters;
        totalGeometricMeters += calc.baseGeometricDistanceMeters;

        calc.segments.forEach(seg => {
          if (seg.wall) {
            const name = getWallDisplayName(seg.wall);
            wallLengths[name] = Number(((wallLengths[name] || 0) + seg.distanceMeters).toFixed(1));
          } else if (seg.segmentType === 'wall_run' || seg.segmentType === 'door_transit') {
            wallLengths['Decke'] = Number(((wallLengths['Decke'] || 0) + seg.distanceMeters).toFixed(1));
          }
        });
      }
    });

    return {
      wallLengths,
      totalCornerBends,
      totalReservesMeters: Number(totalReservesMeters.toFixed(1)),
      totalGeometricMeters: Number(totalGeometricMeters.toFixed(1)),
    };
  }, [wiring, routeCalculationsMap]);

  // DIN 18015 Quick Metrics & Compliance Calculation
  const dinMetrics = useMemo(() => {
    const area = Number((room.width * room.length).toFixed(1));
    const singleSockets = electrical.filter(e => e.type === 'socket_single').length;
    const doubleSockets = electrical.filter(e => e.type === 'socket_double').length;
    const totalSocketOutlets = singleSockets + (doubleSockets * 2);

    // DIN 18015-2 Mindestausstattung (Tier 1) based on room area
    let minSocketsRequired = 4;
    if (area <= 12) minSocketsRequired = 4;
    else if (area <= 20) minSocketsRequired = 5;
    else if (area <= 30) minSocketsRequired = 7;
    else if (area <= 40) minSocketsRequired = 8;
    else minSocketsRequired = 9;

    const socketsPassed = totalSocketOutlets >= minSocketsRequired;
    const voltageDropPassed = wiring.length === 0 || wiring.every(w => w.voltageDropPct <= 3.0);
    const lightingPassed = electrical.filter(e => e.type === 'light_ceiling').length >= (area > 20 ? 2 : 1);

    // Check heights
    const invalidHeights = electrical.filter(el => {
      if (el.type === 'socket_single' || el.type === 'socket_double') {
        const h = el.heightFromFloorCm;
        return !( (h >= 15 && h <= 30) || (h >= 100 && h <= 120) );
      }
      if (el.type === 'switch_single' || el.type === 'switch_series') {
        const h = el.heightFromFloorCm;
        return !(h >= 90 && h <= 115);
      }
      return false;
    });
    const zonesPassed = invalidHeights.length === 0;

    const isOverallPassed = socketsPassed && voltageDropPassed && lightingPassed && zonesPassed;

    return {
      area,
      totalSocketOutlets,
      singleSockets,
      doubleSockets,
      minSocketsRequired,
      socketsPassed,
      voltageDropPassed,
      lightingPassed,
      zonesPassed,
      invalidHeightsCount: invalidHeights.length,
      isOverallPassed,
    };
  }, [room.width, room.length, electrical, wiring]);

  // Total cable meter metrics (with accurate lengths)
  const cableTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    wiring.forEach(w => {
      totals[w.cableType] = (totals[w.cableType] || 0) + w.lengthMeters;
    });
    return totals;
  }, [wiring]);

  // Filtered elements by circuit and room
  const displayedElements = useMemo(() => {
    return electrical.filter(e => {
      const matchCircuit = filterCircuit === 'all' || e.circuitId === filterCircuit;
      const matchRoom = selectedRoomFilter === 'all' 
        || e.roomId === selectedRoomFilter 
        || (!e.roomId && selectedRoomFilter === allRooms[0]?.id);
      return matchCircuit && matchRoom;
    });
  }, [electrical, filterCircuit, selectedRoomFilter, allRooms]);

  // Add new electrical point
  const handleAddPoint = (type: ElectricalType, name: string, heightCm: number, circuitId: string, watts: number) => {
    const targetRoom = (selectedRoomFilter !== 'all' ? allRooms.find(r => r.id === selectedRoomFilter) : null) || activeRoom;
    const rx = targetRoom.position?.x || 0;
    const rz = targetRoom.position?.z || 0;
    const newEl: ElectricalElement = {
      id: `el-${Date.now()}`,
      type,
      name,
      roomId: targetRoom.id,
      position: { x: rx, y: heightCm / 100, z: rz },
      rotation: 0,
      heightFromFloorCm: heightCm,
      circuitId,
      wallSnapped: 'north',
      state: true,
      powerWatts: watts,
    };
    onUpdateElectrical([...electrical, newEl]);
    setSelectedElementId(newEl.id);
  };

  // Delete element and its associated routes
  const handleDeleteElement = (id: string) => {
    onUpdateElectrical(electrical.filter(e => e.id !== id));
    onUpdateWiring(wiring.filter(w => w.fromId !== id && w.toId !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Create wiring route based on exact room wall layout & DIN 18015
  const handleCreateRoute = () => {
    if (!routeFromId || !routeToId || routeFromId === routeToId) return;

    const fromEl = electrical.find(e => e.id === routeFromId);
    const toEl = electrical.find(e => e.id === routeToId);
    if (!fromEl || !toEl) return;

    const calc = calculateRouteCableLength(
      fromEl,
      toEl,
      activeRoom,
      routeCableType,
      { installationZone: routeInstallationZone },
      allRooms
    );

    const newRoute: WiringRoute = {
      id: `wire-${Date.now()}`,
      circuitId: toEl.circuitId,
      fromId: routeFromId,
      toId: routeToId,
      cableType: routeCableType,
      conduitType: routeConduitType,
      installationZone: routeInstallationZone,
      points: calc.points3D,
      lengthMeters: calc.totalLengthMeters,
      voltageDropPct: calc.voltageDropPct,
      breakdown: {
        verticalFromMeters: calc.verticalFromMeters,
        horizontalWallMeters: calc.horizontalWallMeters,
        verticalToMeters: calc.verticalToMeters,
        reserveMeters: calc.reserveMeters,
        cornerBendsMeters: calc.cornerBendsMeters,
        wallPathDescription: calc.wallPathDescription,
        startWall: calc.startWall,
        endWall: calc.endWall,
      }
    };

    onUpdateWiring([...wiring, newRoute]);
    setSelectedRouteId(newRoute.id);
    setSelectedElementId(null);
    setActiveInspectorTab('route');
    setShowAutoRouterModal(false);
  };

  // Recalculate all routes based on room wall layout
  const handleRecalculateAllRoutes = () => {
    const recalculated = recalculateAllWiringRoutes(wiring, electrical, activeRoom, allRooms);
    onUpdateWiring(recalculated);
    setRecalcNotification('Alle Leitungslängen und Trassen wurden normgerecht nach Wandlayout & DIN 18015 neu berechnet!');
    setTimeout(() => setRecalcNotification(null), 4500);
  };

  // Update a specific route's properties and recalculate length
  const handleUpdateRoute = (routeId: string, updates: Partial<WiringRoute>) => {
    const updatedRoutes = wiring.map(w => {
      if (w.id !== routeId) return w;
      const merged = { ...w, ...updates };
      const fromEl = electrical.find(e => e.id === merged.fromId);
      const toEl = electrical.find(e => e.id === merged.toId);
      if (fromEl && toEl) {
        const calc = calculateRouteCableLength(
          fromEl,
          toEl,
          activeRoom,
          merged.cableType,
          { installationZone: merged.installationZone as any },
          allRooms
        );
        return {
          ...merged,
          points: calc.points3D,
          lengthMeters: calc.totalLengthMeters,
          voltageDropPct: calc.voltageDropPct,
          breakdown: {
            verticalFromMeters: calc.verticalFromMeters,
            horizontalWallMeters: calc.horizontalWallMeters,
            verticalToMeters: calc.verticalToMeters,
            reserveMeters: calc.reserveMeters,
            cornerBendsMeters: calc.cornerBendsMeters,
            wallPathDescription: calc.wallPathDescription,
            startWall: calc.startWall,
            endWall: calc.endWall,
          }
        };
      }
      return merged;
    });
    onUpdateWiring(updatedRoutes);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Banner & Filter Controls */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">Elektroplanung & Verlegezonen nach DIN 18015</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Installationszonen, Vorzugshöhen, Kabeltrassen, Spannungsfallprüfung und Stromkreiszuordnung.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Multi-Room Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Home className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400 font-medium">Raum:</span>
            <select
              value={selectedRoomFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedRoomFilter(val);
                if (val !== 'all' && onSelectRoom) {
                  onSelectRoom(val);
                }
              }}
              className="bg-transparent text-sky-300 font-semibold outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Alle Räume ({allRooms.length})</option>
              {allRooms.map((r, idx) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                  {idx + 1}. {r.name} ({(r.width * r.length).toFixed(1)} m²)
                </option>
              ))}
            </select>
          </div>

          {onOpenRoomManager && (
            <button
              onClick={onOpenRoomManager}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-sky-500/30 transition shadow active:scale-95"
              title="Räume verwalten und ansetzen"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Raum ansetzen</span>
            </button>
          )}

          {/* Circuit Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Stromkreis:</span>
            <select
              value={filterCircuit}
              onChange={(e) => setFilterCircuit(e.target.value)}
              className="bg-transparent text-sky-400 font-semibold outline-none cursor-pointer"
            >
              <option value="all">Alle Stromkreise ({electrical.length} Punkte)</option>
              {circuits.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                  {c.number}: {c.name} ({c.breakerType})
                </option>
              ))}
            </select>
          </div>

          {/* DIN 18015 Report Button */}
          <button
            onClick={() => setShowComplianceReport(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
              dinMetrics.isOverallPassed
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-rose-950/60 border-rose-700 text-rose-300 hover:bg-rose-900/60'
            }`}
            title="DIN 18015 Konformitätsbericht öffnen"
          >
            {dinMetrics.isOverallPassed ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>DIN 18015:</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
              dinMetrics.isOverallPassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {dinMetrics.isOverallPassed ? 'Bestanden' : 'Nicht bestanden'}
            </span>
          </button>

          {/* KI-Auditor Button */}
          <button
            onClick={() => setShowAIAuditorModal(true)}
            className="px-3.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition active:scale-95 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm"
            title="KI-Auditor: Lastmanagement, Phasensymmetrie & DIN 18015 Sicherheits-Check"
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>KI-Auditor</span>
          </button>

          {/* Toggle Leitungs-Overlay */}
          <button
            onClick={() => setShowWiringOverlay(!showWiringOverlay)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
              showWiringOverlay
                ? 'bg-sky-950/60 border-sky-700 text-sky-300 hover:bg-sky-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Leitungstrassen- & Kreuzungs-Visualisierung ein-/ausblenden"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visualisierungs-Overlay:</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
              showWiringOverlay ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-700 text-slate-300'
            }`}>
              {showWiringOverlay ? 'Aktiv' : 'Aus'}
            </span>
          </button>

          {/* Toggle DIN zones */}
          <button
            onClick={() => setShowDINZones(!showDINZones)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
              showDINZones
                ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            DIN 18015 Zonen: {showDINZones ? 'Aktiv' : 'Aus'}
          </button>

          {/* Batch Recalculate Routes based on Wall Layout */}
          <button
            onClick={handleRecalculateAllRoutes}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs rounded-xl border border-sky-500/30 shadow flex items-center gap-1.5 transition active:scale-95"
            title="Berechnet alle Leitungslängen und 3D-Trassen neu anhand des realen Wandlayouts & der Installationszonen"
          >
            <Ruler className="w-3.5 h-3.5 text-sky-400" />
            <span>Wandtrassen neu berechnen</span>
          </button>

          {/* Add Route Button */}
          <button
            onClick={() => setShowAutoRouterModal(true)}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
          >
            <Cable className="w-3.5 h-3.5" />
            Leitung verlegen
          </button>
        </div>
      </div>

      {/* Recalculation Notification Toast Banner */}
      {recalcNotification && (
        <div className="bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-900 border-b border-sky-500/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-sky-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-sky-500/20 text-sky-300">
              <Check className="w-4 h-4 text-sky-400" />
            </span>
            <span className="font-semibold">{recalcNotification}</span>
          </div>
          <button
            onClick={() => setRecalcNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area: Split View (Interactive Schematics Table + Side Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Electrical Inventory & Wiring Routes List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {/* Wiring Routes 2D Visualizer Overlay */}
          {showWiringOverlay && (
            <div className="mb-2">
              <WiringOverlayVisualizer
                room={room}
                electrical={electrical}
                wiring={wiring}
                circuits={circuits}
                selectedElementId={selectedElementId}
                selectedRouteId={selectedRouteId}
                onSelectElement={(id) => setSelectedElementId(id)}
                onSelectRoute={(id) => setSelectedRouteId(id)}
                onUpdateWiring={onUpdateWiring}
                isExpanded={false}
                onToggleExpand={() => setIsOverlayExpanded(true)}
              />
            </div>
          )}

          {/* DIN 18015 Standards Information Bar */}
          {showDINZones && (
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/40 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-amber-300">Normgerechte Installationszonen (DIN 18015-3):</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="font-semibold text-slate-200">Deckenbereich:</span> 15 bis 30 cm unterhalb Decke für Zuleitungen & Beleuchtungskabel.
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="font-semibold text-slate-200">Bodenbereich:</span> 15 bis 30 cm oberhalb Fertigfußboden (FFB) für Schuko-Steckdosen.
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="font-semibold text-slate-200">Bedienhöhe Schalter:</span> 105 cm über FFB (Küchenarbeitsplatte 115 cm).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DIN 18015 Live Compliance Status Card */}
          <div className={`p-4 rounded-2xl border transition shadow-lg ${
            dinMetrics.isOverallPassed
              ? 'bg-emerald-950/20 border-emerald-800/60'
              : 'bg-rose-950/20 border-rose-800/60'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 border ${
                  dinMetrics.isOverallPassed
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  {dinMetrics.isOverallPassed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-300">
                      DIN 18015 Prüfstatus:
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wide ${
                      dinMetrics.isOverallPassed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}>
                      {dinMetrics.isOverallPassed ? 'Bestanden' : 'Nicht bestanden'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Raumfläche: {dinMetrics.area} m²)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {dinMetrics.isOverallPassed
                      ? `Alle Mindestanforderungen nach DIN 18015-2 (Mind. ${dinMetrics.minSocketsRequired} Steckdosen für ${dinMetrics.area} m² Raumfläche) und Verlegezonen sind erfüllt.`
                      : `Abweichung festgestellt: ${
                          !dinMetrics.socketsPassed 
                            ? `Steckdosenanzahl unzureichend (${dinMetrics.totalSocketOutlets} vorhanden, mind. ${dinMetrics.minSocketsRequired} für ${dinMetrics.area} m² gefordert). ` 
                            : ''
                        }${
                          !dinMetrics.zonesPassed 
                            ? `${dinMetrics.invalidHeightsCount} Element(e) außerhalb der DIN 18015-3 Vorzugshöhen. ` 
                            : ''
                        }${
                          !dinMetrics.voltageDropPassed 
                            ? 'Spannungsfall überschreitet 3,0%. ' 
                            : ''
                        }`
                    }
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowComplianceReport(true)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-slate-950 text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition shrink-0 active:scale-95 self-start sm:self-center"
              >
                <FileText className="w-3.5 h-3.5" />
                Vollständigen Prüfbericht öffnen
              </button>
            </div>
          </div>

          {/* Electrical Points Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Geplante Installationsgeräte ({displayedElements.length})</h3>
              </div>
              <span className="text-xs text-slate-400">Klicken zum Konfigurieren</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Gerät / Betriebsmittel</th>
                    <th className="pb-2 font-semibold">Typ</th>
                    <th className="pb-2 font-semibold">DIN Montagehöhe</th>
                    <th className="pb-2 font-semibold">Stromkreis</th>
                    <th className="pb-2 font-semibold">Last (W)</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedElements.map(el => {
                    const assignedCircuit = circuits.find(c => c.id === el.circuitId);
                    const isSelected = el.id === selectedElementId;

                    return (
                      <tr 
                        key={el.id}
                        onClick={() => setSelectedElementId(el.id)}
                        className={`cursor-pointer transition hover:bg-slate-800/40 ${
                          isSelected ? 'bg-sky-950/30 text-white font-medium' : 'text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${el.state !== false ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span className="font-semibold text-slate-200">{el.name}</span>
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-slate-400">
                          {el.type}
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {el.heightFromFloorCm} cm
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800/60 text-sky-300 font-semibold">
                            {assignedCircuit ? `${assignedCircuit.number} (${assignedCircuit.breakerType})` : el.circuitId}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-amber-400">
                          {el.powerWatts} W
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            el.state !== false 
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {el.state !== false ? 'AKTIV' : 'AUS'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteElement(el.id);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Entfernen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Wiring Routes & Cable Calculations Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Cable className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Verlegepläne & Leitungswege ({wiring.length})</h3>
                  <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800/60 text-[10px] font-bold font-mono">
                    Wandlayout-basiert
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kabellängen basierend auf realem Wandverlauf, Raumecken, Steig-/Fallwegen und DIN 18015 Zonen.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWallAnalysis(!showWallAnalysis)}
                  className={`px-2.5 py-1 text-xs rounded-xl border transition flex items-center gap-1.5 ${
                    showWallAnalysis
                      ? 'bg-sky-950 border-sky-600 text-sky-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Wand-Kabelbedarfsanalyse ein-/ausblenden"
                >
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  <span>Wandanalyse {showWallAnalysis ? 'verbergen' : 'anzeigen'}</span>
                </button>

                <button
                  onClick={handleRecalculateAllRoutes}
                  className="px-2.5 py-1 text-xs rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
                  title="Alle Trassen neu berechnen"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Neu berechnen</span>
                </button>
              </div>
            </div>

            {/* Wall Cable Analysis Section (Optional toggle) */}
            {showWallAnalysis && (
              <div className="mb-4 p-3.5 rounded-xl bg-slate-950/80 border border-sky-500/30 animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-sky-400" />
                    Kabel-Bedarfsanalyse nach Wandlayout & Installationsflächen
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {wallCableStats.totalCornerBends}x 90°-Rohrbögen | Reserve: {wallCableStats.totalReservesMeters} m
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {Object.entries(wallCableStats.wallLengths).map(([wallName, meters]) => (
                    <div key={wallName} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">{wallName}</span>
                      <div className="text-base font-bold text-white font-mono mt-0.5">
                        {meters.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">m</span>
                      </div>
                      <span className="text-[9px] text-sky-400">DIN 18015-3 Trasse</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Verbindung & Wandplatzierung</th>
                    <th className="pb-2 font-semibold">Kabel- & Verlegeart</th>
                    <th className="pb-2 font-semibold">Wandverlauf (DIN 18015)</th>
                    <th className="pb-2 font-semibold">Geschätzte Kabellänge</th>
                    <th className="pb-2 font-semibold">Spannungsfall ΔU</th>
                    <th className="pb-2 font-semibold">Normstatus</th>
                    <th className="pb-2 font-semibold text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {wiring.map(w => {
                    const fromEl = electrical.find(e => e.id === w.fromId);
                    const toEl = electrical.find(e => e.id === w.toId);
                    const isDropOk = w.voltageDropPct <= 3.0; // VDE 0100-520 limit is 3%
                    const isSelected = selectedRouteId === w.id;
                    const calc = routeCalculationsMap.get(w.id);

                    const startWallName = calc?.startWall ? getWallDisplayName(calc.startWall) : 'Wand';
                    const endWallName = calc?.endWall ? getWallDisplayName(calc.endWall) : 'Wand';

                    return (
                      <tr 
                        key={w.id} 
                        onClick={() => {
                          setSelectedRouteId(w.id);
                          setSelectedElementId(null);
                          setActiveInspectorTab('route');
                        }}
                        className={`cursor-pointer transition hover:bg-slate-800/50 ${
                          isSelected ? 'bg-sky-950/40 border-l-2 border-l-sky-400 text-white' : 'text-slate-300'
                        }`}
                      >
                        <td className="py-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-200">{fromEl?.name || w.fromId}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                              {startWallName}
                            </span>
                            <span className="text-slate-500">→</span>
                            <span className="font-semibold text-sky-300">{toEl?.name || w.toId}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 text-[10px] font-mono">
                              {endWallName}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5">
                          <div className="font-mono text-[11px] text-emerald-400 font-semibold">{w.cableType}</div>
                          <div className="text-[10px] text-slate-400">{w.conduitType}</div>
                        </td>

                        <td className="py-2.5 max-w-[240px]">
                          <div className="text-[11px] text-slate-300 truncate font-sans" title={calc?.wallPathDescription || w.breakdown?.wallPathDescription || w.installationZone}>
                            {calc?.wallPathDescription || w.breakdown?.wallPathDescription || w.installationZone}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {calc?.cornersCount !== undefined && calc.cornersCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-mono">
                                {calc.cornersCount}x 90°-Ecke
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              Zone: {w.installationZone.includes('Decke') ? 'Decke' : w.installationZone.includes('Boden') ? 'Boden' : 'Estrich'}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-white text-sm font-black">
                              {w.lengthMeters.toFixed(1)} m
                            </span>
                            {calc && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                (Basis: {calc.baseGeometricDistanceMeters}m)
                              </span>
                            )}
                          </div>
                          {calc && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Vertikal: {(calc.verticalFromMeters + calc.verticalToMeters).toFixed(1)}m | Wand: {calc.horizontalWallMeters}m | Res: {calc.reserveMeters}m
                            </div>
                          )}
                        </td>

                        <td className="py-2.5">
                          <span className={`font-mono font-bold text-xs ${isDropOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {w.voltageDropPct}%
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Grenze: 3.0%
                          </span>
                        </td>

                        <td className="py-2.5">
                          {isDropOk ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                              <CheckCircle2 className="w-3 h-3" /> Konform
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/40">
                              <AlertTriangle className="w-3 h-3" /> Überschritten
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedRouteId(w.id);
                                setSelectedElementId(null);
                                setActiveInspectorTab('route');
                              }}
                              className={`p-1.5 rounded transition ${
                                isSelected ? 'bg-sky-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800'
                              }`}
                              title="Trassendetails & Wandlayout-Inspektor öffnen"
                            >
                              <Ruler className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onUpdateWiring(wiring.filter(item => item.id !== w.id))}
                              className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                              title="Leitung löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cable Material Totals & BOM (Stückliste) */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                Kabel-Stückliste & Materialbedarfsermittlung (nach Wandlayout)
              </h4>
              <span className="text-[11px] text-slate-400">
                Gesamtkabellänge: <span className="font-bold text-sky-300 font-mono">{Object.values(cableTotals).reduce((a, b) => a + b, 0).toFixed(1)} m</span>
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(cableTotals).map(([cableType, meters]) => (
                <div key={cableType} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block truncate">{cableType}</span>
                  <div className="text-lg font-bold text-white mt-0.5 font-mono">
                    {meters.toFixed(1)} <span className="text-xs font-normal text-slate-400 font-sans">Meter</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1 block">Inkl. DIN-Wandreserveradien</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Dual Inspector - Selected Element OR Selected Wall Route */}
        {(selectedElement || selectedRoute) && (
          <div className="w-84 sm:w-96 border-l border-slate-800 bg-slate-900/95 p-4 sm:p-5 overflow-y-auto shrink-0 flex flex-col gap-4 shadow-2xl">
            {/* Dual Inspector Tabs if both are active */}
            {selectedElement && selectedRoute && (
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveInspectorTab('element')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    activeInspectorTab === 'element'
                      ? 'bg-sky-600 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span className="truncate">{selectedElement.name}</span>
                </button>
                <button
                  onClick={() => setActiveInspectorTab('route')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    activeInspectorTab === 'route'
                      ? 'bg-sky-600 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="truncate">Wandtrasse</span>
                </button>
              </div>
            )}

            {/* TAB 1: ROUTE & WALL LAYOUT INSPECTOR */}
            {(activeInspectorTab === 'route' || !selectedElement) && selectedRoute && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      <Ruler className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-wide">
                        Wandtrasse & Leitungslänge
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ID: {selectedRoute.id}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRouteId(null);
                      if (selectedElement) setActiveInspectorTab('element');
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white text-xs"
                    title="Schließen"
                  >
                    ✕
                  </button>
                </div>

                {/* Connection Nodes info */}
                {(() => {
                  const fromEl = electrical.find(e => e.id === selectedRoute.fromId);
                  const toEl = electrical.find(e => e.id === selectedRoute.toId);
                  const calc = selectedRouteCalc || (fromEl && toEl ? calculateRouteCableLength(
                    fromEl, 
                    toEl, 
                    activeRoom, 
                    selectedRoute.cableType, 
                    { installationZone: selectedRoute.installationZone as any }, 
                    allRooms
                  ) : null);

                  return (
                    <>
                      {/* From -> To Card */}
                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Verbindung:</span>
                          <span className="text-[10px] text-sky-400 font-semibold font-mono">DIN 18015-3</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Start ({calc?.startWall || 'Wand'})</span>
                            <span className="font-bold text-white text-xs truncate block">{fromEl?.name || selectedRoute.fromId}</span>
                            <span className="text-[10px] text-sky-400">{fromEl?.heightFromFloorCm || 30} cm ü.F.</span>
                          </div>
                          <span className="text-slate-500 font-bold">→</span>
                          <div className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Ziel ({calc?.endWall || 'Wand'})</span>
                            <span className="font-bold text-white text-xs truncate block">{toEl?.name || selectedRoute.toId}</span>
                            <span className="text-[10px] text-sky-400">{toEl?.heightFromFloorCm || 105} cm ü.F.</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Length & Metric Display */}
                      <div className="p-3.5 bg-gradient-to-br from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/30 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                            Berechnete Gesamtkabellänge
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800/40">
                            Wandlayout-Exakt
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-white font-mono">
                            {(calc?.totalLengthMeters ?? selectedRoute.lengthMeters).toFixed(2)}
                          </span>
                          <span className="text-sm font-semibold text-sky-400">Meter</span>
                        </div>

                        {/* Voltage drop badge */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">Spannungsfall (VDE 0100):</span>
                          <span className={`font-mono font-bold ${
                            (calc?.voltageDropPct ?? selectedRoute.voltageDropPct) <= 3.0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(calc?.voltageDropPct ?? selectedRoute.voltageDropPct).toFixed(2)}% 
                            <span className="text-[10px] text-slate-500 ml-1">(&lt; 3.0%)</span>
                          </span>
                        </div>
                      </div>

                      {/* Detailed Wall Layout Distance Breakdown */}
                      {calc && (
                        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-sky-400" />
                            Distanz-Aufschlüsselung nach Wandlayout
                          </span>

                          <div className="space-y-1.5 text-xs font-mono">
                            {/* Vertical start */}
                            <div className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg">
                              <span className="text-slate-400 text-[11px] font-sans">1. Steigweg Startwand:</span>
                              <span className="text-white font-bold">{calc.verticalFromMeters.toFixed(2)} m</span>
                            </div>

                            {/* Horizontal wall run */}
                            <div className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg">
                              <div className="flex flex-col text-[11px] font-sans">
                                <span className="text-slate-400">2. Horizontaler Wandverlauf:</span>
                                <span className="text-[9px] text-sky-300 font-mono truncate max-w-[180px]">{calc.wallPathDescription}</span>
                              </div>
                              <span className="text-white font-bold">{calc.horizontalWallMeters.toFixed(2)} m</span>
                            </div>

                            {/* Corner bends */}
                            {calc.cornersCount > 0 && (
                              <div className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg">
                                <span className="text-slate-400 text-[11px] font-sans">
                                  3. 90°-DIN-Eckbögen ({calc.cornersCount}x):
                                </span>
                                <span className="text-amber-400 font-bold">+{calc.cornerBendsMeters.toFixed(2)} m</span>
                              </div>
                            )}

                            {/* Vertical destination */}
                            <div className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg">
                              <span className="text-slate-400 text-[11px] font-sans">4. Fallweg Zielwand:</span>
                              <span className="text-white font-bold">{calc.verticalToMeters.toFixed(2)} m</span>
                            </div>

                            {/* Connection Reserve */}
                            <div className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg">
                              <span className="text-slate-400 text-[11px] font-sans">5. DIN 18015 Anschlussreserve:</span>
                              <span className="text-emerald-400 font-bold">+{calc.reserveMeters.toFixed(2)} m</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Interactive Zone Configuration */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                          Installationszone (DIN 18015)
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                          {[
                            { id: 'DIN 18015 Decke (15-30cm)', label: 'Decke (15-30cm unter Rohdecke)' },
                            { id: 'DIN 18015 Boden (15-30cm)', label: 'Boden (15-30cm über Rohfußboden)' },
                            { id: 'Estrichverlegung', label: 'Estrich (im Schutzrohr)' },
                          ].map(z => (
                            <button
                              key={z.id}
                              onClick={() => {
                                if (!fromEl || !toEl) return;
                                const newCalc = calculateRouteCableLength(
                                  fromEl,
                                  toEl,
                                  activeRoom,
                                  selectedRoute.cableType,
                                  { installationZone: z.id as any },
                                  allRooms
                                );
                                onUpdateWiring(wiring.map(w => w.id === selectedRoute.id ? {
                                  ...w,
                                  installationZone: z.id as any,
                                  lengthMeters: newCalc.totalLengthMeters,
                                  voltageDropPct: newCalc.voltageDropPct,
                                  points: newCalc.points3D,
                                  breakdown: {
                                    verticalFromMeters: newCalc.verticalFromMeters,
                                    horizontalWallMeters: newCalc.horizontalWallMeters,
                                    verticalToMeters: newCalc.verticalToMeters,
                                    reserveMeters: newCalc.reserveMeters,
                                    cornerBendsMeters: newCalc.cornerBendsMeters,
                                    wallPathDescription: newCalc.wallPathDescription,
                                    startWall: newCalc.startWall,
                                    endWall: newCalc.endWall,
                                  },
                                } : w));
                              }}
                              className={`p-2 rounded-xl text-xs font-semibold text-left border transition ${
                                selectedRoute.installationZone === z.id
                                  ? 'bg-sky-600 border-sky-400 text-slate-950 font-bold shadow-sm'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              {z.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cable Type Selector */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">Kabeltyp / Querschnitt</label>
                        <select
                          value={selectedRoute.cableType}
                          onChange={(e) => {
                            const newType = e.target.value as CableType;
                            if (!fromEl || !toEl) return;
                            const newCalc = calculateRouteCableLength(
                              fromEl,
                              toEl,
                              activeRoom,
                              newType,
                              { installationZone: selectedRoute.installationZone as any },
                              allRooms
                            );
                            onUpdateWiring(wiring.map(w => w.id === selectedRoute.id ? {
                              ...w,
                              cableType: newType,
                              lengthMeters: newCalc.totalLengthMeters,
                              voltageDropPct: newCalc.voltageDropPct,
                              points: newCalc.points3D,
                              breakdown: {
                                verticalFromMeters: newCalc.verticalFromMeters,
                                horizontalWallMeters: newCalc.horizontalWallMeters,
                                verticalToMeters: newCalc.verticalToMeters,
                                reserveMeters: newCalc.reserveMeters,
                                cornerBendsMeters: newCalc.cornerBendsMeters,
                                wallPathDescription: newCalc.wallPathDescription,
                                startWall: newCalc.startWall,
                                endWall: newCalc.endWall,
                              },
                            } : w));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-semibold focus:border-sky-500 outline-none"
                        >
                          <option value="NYM-J 3x1.5 mm²">NYM-J 3x1.5 mm²</option>
                          <option value="NYM-J 5x1.5 mm²">NYM-J 5x1.5 mm²</option>
                          <option value="NYM-J 5x2.5 mm²">NYM-J 5x2.5 mm²</option>
                          <option value="CAT.7 Duplex">CAT.7 Duplex</option>
                          <option value="Terrarium Silikon 3x1.5">Terrarium Silikon 3x1.5</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-800 flex flex-col gap-2 mt-auto">
                        <button
                          onClick={() => {
                            if (!fromEl || !toEl) return;
                            const newCalc = calculateRouteCableLength(
                              fromEl,
                              toEl,
                              activeRoom,
                              selectedRoute.cableType,
                              { installationZone: selectedRoute.installationZone as any },
                              allRooms
                            );
                            onUpdateWiring(wiring.map(w => w.id === selectedRoute.id ? {
                              ...w,
                              lengthMeters: newCalc.totalLengthMeters,
                              voltageDropPct: newCalc.voltageDropPct,
                              points: newCalc.points3D,
                              breakdown: {
                                verticalFromMeters: newCalc.verticalFromMeters,
                                horizontalWallMeters: newCalc.horizontalWallMeters,
                                verticalToMeters: newCalc.verticalToMeters,
                                reserveMeters: newCalc.reserveMeters,
                                cornerBendsMeters: newCalc.cornerBendsMeters,
                                wallPathDescription: newCalc.wallPathDescription,
                                startWall: newCalc.startWall,
                                endWall: newCalc.endWall,
                              },
                            } : w));
                            setRecalcNotification(`Trasse ${selectedRoute.id} neu berechnet: ${newCalc.totalLengthMeters.toFixed(2)} m`);
                            setTimeout(() => setRecalcNotification(null), 3000);
                          }}
                          className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Nach Wandlayout neu berechnen
                        </button>
                        <button
                          onClick={() => {
                            onUpdateWiring(wiring.filter(w => w.id !== selectedRoute.id));
                            setSelectedRouteId(null);
                          }}
                          className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          Leitung löschen
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* TAB 2: ELEMENT DETAILS INSPECTOR */}
            {(activeInspectorTab === 'element' || !selectedRoute) && selectedElement && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Element Details</h3>
                  <button 
                    onClick={() => {
                      setSelectedElementId(null);
                      if (selectedRoute) setActiveInspectorTab('route');
                    }}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Bezeichnung</label>
                  <input
                    type="text"
                    value={selectedElement.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateElectrical(electrical.map(el => el.id === selectedElement.id ? { ...el, name: val } : el));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>

                {/* DIN Height Preset */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Installationshöhe nach DIN 18015 (cm)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[30, 105, 115, 230].map(h => (
                      <button
                        key={h}
                        onClick={() => {
                          onUpdateElectrical(electrical.map(el => el.id === selectedElement.id ? { 
                            ...el, 
                            heightFromFloorCm: h,
                            position: { ...el.position, y: h / 100 }
                          } : el));
                        }}
                        className={`py-1 text-xs font-bold rounded-lg border transition ${
                          selectedElement.heightFromFloorCm === h
                            ? 'bg-sky-600 border-sky-500 text-slate-950'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {h}cm
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={selectedElement.heightFromFloorCm}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      onUpdateElectrical(electrical.map(el => el.id === selectedElement.id ? { 
                        ...el, 
                        heightFromFloorCm: h,
                        position: { ...el.position, y: h / 100 }
                      } : el));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-sky-500 outline-none"
                  />
                </div>

                {/* Circuit Assignment */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Stromkreis-Zuordnung</label>
                  <select
                    value={selectedElement.circuitId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      onUpdateElectrical(electrical.map(el => el.id === selectedElement.id ? { ...el, circuitId: cId } : el));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-400 font-semibold focus:border-sky-500 outline-none"
                  >
                    {circuits.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.number}: {c.name} ({c.breakerType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Power Rating in Watts */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nennleistung / Last (Watt)</label>
                  <input
                    type="number"
                    value={selectedElement.powerWatts}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      onUpdateElectrical(electrical.map(el => el.id === selectedElement.id ? { ...el, powerWatts: w } : el));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 focus:border-sky-500 outline-none"
                  />
                </div>

                {/* Delete button */}
                <div className="pt-4 border-t border-slate-800 mt-auto">
                  <button
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    Installationspunkt löschen
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AUTO ROUTER MODAL WITH LIVE CABLE LENGTH & WALL ROUTE PREVIEW */}
      {showAutoRouterModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cable className="w-5 h-5 text-sky-400" />
                Kabel-Leitungsplan nach Wandlayout erstellen
              </h3>
              <button
                onClick={() => setShowAutoRouterModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Startpunkt (z.B. Verteiler)</label>
                  <select
                    value={routeFromId}
                    onChange={(e) => setRouteFromId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  >
                    {electrical.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Zielpunkt (z.B. Steckdose / Terrarium)</label>
                  <select
                    value={routeToId}
                    onChange={(e) => setRouteToId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  >
                    <option value="">-- Ziel auswählen --</option>
                    {electrical.filter(e => e.id !== routeFromId).map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Kabeltyp / Querschnitt</label>
                  <select
                    value={routeCableType}
                    onChange={(e) => setRouteCableType(e.target.value as CableType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-semibold outline-none focus:border-sky-500"
                  >
                    <option value="NYM-J 3x1.5 mm²">NYM-J 3x1.5 mm² (Steckdosen/Licht)</option>
                    <option value="NYM-J 5x1.5 mm²">NYM-J 5x1.5 mm² (DALI / Serienschaltung)</option>
                    <option value="NYM-J 5x2.5 mm²">NYM-J 5x2.5 mm² (Herd / Starkstrom 400V)</option>
                    <option value="CAT.7 Duplex">CAT.7 Duplex (Netzwerk / Gateway)</option>
                    <option value="Terrarium Silikon 3x1.5">Terrarium Silikon (hitzebeständig)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Installationszone</label>
                  <select
                    value={routeInstallationZone}
                    onChange={(e) => setRouteInstallationZone(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-400 font-semibold outline-none focus:border-sky-500"
                  >
                    <option value="DIN 18015 Decke (15-30cm)">DIN 18015 Decke (15-30cm)</option>
                    <option value="DIN 18015 Boden (15-30cm)">DIN 18015 Boden (15-30cm)</option>
                    <option value="Estrichverlegung">Estrichverlegung</option>
                  </select>
                </div>
              </div>

              {/* LIVE CABLE CALCULATION PREVIEW */}
              {(() => {
                const fromEl = electrical.find(e => e.id === routeFromId);
                const toEl = electrical.find(e => e.id === routeToId);
                if (!fromEl || !toEl) return null;

                const previewCalc = calculateRouteCableLength(
                  fromEl,
                  toEl,
                  activeRoom,
                  routeCableType,
                  { installationZone: routeInstallationZone },
                  allRooms
                );

                return (
                  <div className="p-3.5 bg-slate-950 border border-sky-500/30 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-black uppercase text-sky-400">
                        Vorschau: Geschätzte Kabellänge
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {previewCalc.startWall} → {previewCalc.endWall}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white font-mono">
                          {previewCalc.totalLengthMeters.toFixed(2)}
                        </span>
                        <span className="text-xs font-semibold text-sky-400">Meter</span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${
                        previewCalc.voltageDropPct <= 3.0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {previewCalc.voltageDropPct.toFixed(2)}% ΔU
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-sans border-t border-slate-800 pt-1.5 flex items-center justify-between">
                      <span>Wegstrecke:</span>
                      <span className="text-slate-200 font-mono text-[10px] truncate max-w-[260px]">
                        {previewCalc.wallPathDescription}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAutoRouterModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-750 transition"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateRoute}
                disabled={!routeToId}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-sky-500/20 transition active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Leitung nach Wandlayout verlegen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIN 18015 AUDIT REPORT GENERATOR MODAL */}
      {showComplianceReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl my-auto">
            <DIN18015ReportGenerator
              room={room}
              electrical={electrical}
              wiring={wiring}
              circuits={circuits}
              onUpdateElectrical={onUpdateElectrical}
              onUpdateWiring={onUpdateWiring}
              onClose={() => setShowComplianceReport(false)}
              onSelectElement={(id) => {
                setSelectedElementId(id);
                setShowComplianceReport(false);
              }}
            />
          </div>
        </div>
      )}
      {/* EXPANDED FULLSCREEN WIRING OVERLAY MODAL */}
      {isOverlayExpanded && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
            <WiringOverlayVisualizer
              room={room}
              electrical={electrical}
              wiring={wiring}
              circuits={circuits}
              selectedElementId={selectedElementId}
              selectedRouteId={selectedRouteId}
              onSelectElement={(id) => setSelectedElementId(id)}
              onSelectRoute={(id) => setSelectedRouteId(id)}
              onUpdateWiring={onUpdateWiring}
              isExpanded={true}
              onToggleExpand={() => setIsOverlayExpanded(false)}
            />
          </div>
        </div>
      )}

      {/* AI AUDITOR MODAL */}
      {showAIAuditorModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in">
          <div className="w-full h-full max-w-6xl max-h-[95vh] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
            <AIAuditor
              electrical={electrical}
              circuits={circuits}
              room={room}
              wiring={wiring}
              onUpdateElectrical={onUpdateElectrical}
              onUpdateCircuits={onUpdateCircuits}
              onClose={() => setShowAIAuditorModal(false)}
              onSelectElement={(id) => {
                setSelectedElementId(id);
                setShowAIAuditorModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

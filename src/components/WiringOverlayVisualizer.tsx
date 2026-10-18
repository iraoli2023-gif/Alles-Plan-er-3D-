import React, { useState, useMemo, useRef } from 'react';
import { 
  RoomConfig, 
  ElectricalElement, 
  WiringRoute, 
  BreakerCircuit,
  Vector3D,
  CableType
} from '../types';
import { 
  Zap, 
  Cable, 
  AlertTriangle, 
  AlertOctagon,
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  Layers, 
  Sliders, 
  Wrench, 
  Info,
  Sparkles,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';

export type ColorMode = 'circuit' | 'cable_type' | 'zone' | 'compliance';

export interface RouteIntersection {
  id: string;
  route1Id: string;
  route2Id: string;
  point: { x: number; z: number };
  y1: number;
  y2: number;
  deltaY: number;
  isSamePlane: boolean; // deltaY < 0.3m -> critical collision risk / thermal grouping
  description: string;
}

export interface RouteViolation {
  id: string;
  routeId: string;
  type: 'diagonal' | 'outside_zone' | 'voltage_drop' | 'overlength';
  title: string;
  severity: 'critical' | 'warning';
  description: string;
  segmentIndex?: number;
  point?: { x: number; z: number };
}

interface WiringOverlayVisualizerProps {
  room: RoomConfig;
  electrical: ElectricalElement[];
  wiring: WiringRoute[];
  circuits: BreakerCircuit[];
  selectedElementId?: string | null;
  selectedRouteId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onSelectRoute?: (id: string | null) => void;
  onUpdateWiring?: (routes: WiringRoute[]) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// Circuit color mapping
const CIRCUIT_COLORS: Record<string, string> = {
  'main-feed': '#e2e8f0',
  'circuit-f1-sockets': '#10b981', // Emerald
  'circuit-f2-light': '#f59e0b',   // Amber
  'circuit-f3-media': '#6366f1',   // Indigo
  'circuit-f4-kitchen-small': '#06b6d4', // Cyan
  'circuit-f5-stove': '#f43f5e',   // Rose
  'circuit-f6-bath': '#8b5cf6',    // Violet
  'circuit-f7-terrarium': '#84cc16', // Lime
};

// Cable type color mapping
const CABLE_COLORS: Record<string, string> = {
  'NYM-J 3x1.5 mm²': '#38bdf8', // Sky
  'NYM-J 3x2.5 mm²': '#34d399', // Emerald
  'NYM-J 5x1.5 mm²': '#fbbf24', // Amber
  'NYM-J 5x2.5 mm²': '#f43f5e', // Rose / Red
  'CAT.7 Duplex': '#a855f7',    // Purple
  'KNX / EIB Bus': '#22d3ee',   // Cyan
  'Terrarium Silikon 3x1.5': '#a3e635', // Lime
};

export const WiringOverlayVisualizer: React.FC<WiringOverlayVisualizerProps> = ({
  room,
  electrical,
  wiring,
  circuits,
  selectedElementId,
  selectedRouteId,
  onSelectElement,
  onSelectRoute,
  onUpdateWiring,
  isExpanded = false,
  onToggleExpand,
}) => {
  // View states
  const [colorMode, setColorMode] = useState<ColorMode>('circuit');
  const [showDINZones, setShowDINZones] = useState<boolean>(true);
  const [showCrossings, setShowCrossings] = useState<boolean>(true);
  const [showViolations, setShowViolations] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [animateFlow, setAnimateFlow] = useState<boolean>(true);
  const [filterCircuit, setFilterCircuit] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [hoveredCrossingId, setHoveredCrossingId] = useState<string | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [fixNotification, setFixNotification] = useState<string | null>(null);

  // Canvas dimensions
  const svgWidth = 860;
  const svgHeight = 560;
  const padding = 55;

  // Coordinate projection from 3D room coordinates (meters) to 2D SVG canvas pixels
  // Room: x in [-room.width/2, room.width/2], z in [-room.length/2, room.length/2]
  const toSvgX = (x: number): number => {
    const norm = (x + room.width / 2) / room.width;
    return padding + norm * (svgWidth - 2 * padding);
  };

  const toSvgZ = (z: number): number => {
    const norm = (z + room.length / 2) / room.length;
    return padding + norm * (svgHeight - 2 * padding);
  };

  // Distribution box (Verteilerkasten 'el-uv')
  const uvElement = useMemo(() => {
    return electrical.find(e => e.type === 'sub_distribution_panel' || e.id === 'el-uv') || null;
  }, [electrical]);

  // Filtered wiring routes
  const activeWiring = useMemo(() => {
    if (filterCircuit === 'all') return wiring;
    return wiring.filter(w => w.circuitId === filterCircuit);
  }, [wiring, filterCircuit]);

  // Helper: line intersection detection between 2 line segments in 2D
  const checkSegmentIntersection = (
    p1: { x: number; z: number },
    p2: { x: number; z: number },
    p3: { x: number; z: number },
    p4: { x: number; z: number }
  ): { x: number; z: number; t: number; u: number } | null => {
    const x1 = p1.x, z1 = p1.z;
    const x2 = p2.x, z2 = p2.z;
    const x3 = p3.x, z3 = p3.z;
    const x4 = p4.x, z4 = p4.z;

    const denom = (x1 - x2) * (z3 - z4) - (z1 - z2) * (x3 - x4);
    if (Math.abs(denom) < 1e-6) return null; // parallel or collinear

    const t = ((x1 - x3) * (z3 - z4) - (z1 - z3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (z1 - z3) - (z1 - z2) * (x1 - x3)) / denom;

    // Strict intersection within interior of both segments to avoid endpoint junctions
    if (t > 0.05 && t < 0.95 && u > 0.05 && u < 0.95) {
      return {
        x: x1 + t * (x2 - x1),
        z: z1 + t * (z2 - z1),
        t,
        u,
      };
    }
    return null;
  };

  // 1. Detect all Cable Crossings / Intersections between different routes
  const detectedIntersections = useMemo<RouteIntersection[]>(() => {
    const intersections: RouteIntersection[] = [];

    for (let i = 0; i < activeWiring.length; i++) {
      const r1 = activeWiring[i];
      const pts1 = r1.points && r1.points.length >= 2 
        ? r1.points 
        : [
            electrical.find(e => e.id === r1.fromId)?.position,
            electrical.find(e => e.id === r1.toId)?.position
          ].filter(Boolean) as Vector3D[];

      if (pts1.length < 2) continue;

      for (let j = i + 1; j < activeWiring.length; j++) {
        const r2 = activeWiring[j];
        // Skip if connecting directly between same devices
        if (r1.fromId === r2.fromId && r1.toId === r2.toId) continue;

        const pts2 = r2.points && r2.points.length >= 2
          ? r2.points
          : [
              electrical.find(e => e.id === r2.fromId)?.position,
              electrical.find(e => e.id === r2.toId)?.position
            ].filter(Boolean) as Vector3D[];

        if (pts2.length < 2) continue;

        // Compare each segment of r1 with each segment of r2
        for (let seg1 = 0; seg1 < pts1.length - 1; seg1++) {
          const a = pts1[seg1];
          const b = pts1[seg1 + 1];

          for (let seg2 = 0; seg2 < pts2.length - 1; seg2++) {
            const c = pts2[seg2];
            const d = pts2[seg2 + 1];

            const hit = checkSegmentIntersection(a, b, c, d);
            if (hit) {
              // Interpolate height Y at intersection
              const y1 = a.y + hit.t * (b.y - a.y);
              const y2 = c.y + hit.u * (d.y - c.y);
              const deltaY = Math.abs(y1 - y2);
              const isSamePlane = deltaY < 0.35; // less than 35cm difference

              const fromEl1 = electrical.find(e => e.id === r1.fromId);
              const toEl1 = electrical.find(e => e.id === r1.toId);
              const fromEl2 = electrical.find(e => e.id === r2.fromId);
              const toEl2 = electrical.find(e => e.id === r2.toId);

              intersections.push({
                id: `cross-${r1.id}-${r2.id}-${seg1}-${seg2}`,
                route1Id: r1.id,
                route2Id: r2.id,
                point: { x: hit.x, z: hit.z },
                y1,
                y2,
                deltaY,
                isSamePlane,
                description: isSamePlane
                  ? `Kritische Trassenkreuzung auf gleicher Verlegeebene (Δh = ${(deltaY * 100).toFixed(0)} cm): "${toEl1?.name || r1.id}" × "${toEl2?.name || r2.id}". Wärmestau & Verlegekonflikt nach DIN VDE 0298-4 prüfen!`
                  : `Ebenenkreuzung (Decke/Boden, Δh = ${(deltaY * 100).toFixed(0)} cm): "${toEl1?.name || r1.id}" × "${toEl2?.name || r2.id}". Unkritisch, da getrennte Installationszonen.`,
              });
            }
          }
        }
      }
    }

    return intersections;
  }, [activeWiring, electrical]);

  // 2. Detect Routing Violations (DIN 18015-3 & DIN VDE 0100)
  const detectedViolations = useMemo<RouteViolation[]>(() => {
    const violations: RouteViolation[] = [];

    activeWiring.forEach(route => {
      const fromEl = electrical.find(e => e.id === route.fromId);
      const toEl = electrical.find(e => e.id === route.toId);
      const pts = route.points && route.points.length >= 2
        ? route.points
        : [fromEl?.position, toEl?.position].filter(Boolean) as Vector3D[];

      // Check 1: Voltage Drop > 3% (DIN VDE 0100-520)
      if (route.voltageDropPct > 3.0) {
        violations.push({
          id: `viol-vdrop-${route.id}`,
          routeId: route.id,
          type: 'voltage_drop',
          title: 'Spannungsfall überschreitet DIN-Grenzwert',
          severity: 'critical',
          description: `Kabelroute hat ${route.voltageDropPct}% Spannungsfall (Max. 3,00% zulässig). Größeren Querschnitt oder kürzere Trasse wählen!`,
        });
      }

      // Check 2: Overlength > 25m in single residential room
      if (route.lengthMeters > 25) {
        violations.push({
          id: `viol-length-${route.id}`,
          routeId: route.id,
          type: 'overlength',
          title: 'Überlange Leitungsführung',
          severity: 'warning',
          description: `Trassenlänge ${route.lengthMeters}m ungewöhnlich lang für Wohnraum.`,
        });
      }

      // Check 3: DIN 18015-3 Diagonal Routing Violations
      for (let s = 0; s < pts.length - 1; s++) {
        const p1 = pts[s];
        const p2 = pts[s + 1];
        const dx = Math.abs(p2.x - p1.x);
        const dz = Math.abs(p2.z - p1.z);

        // A segment is diagonal if BOTH dx and dz are significant (> 0.25 meters)
        // Exception: only permissible if running straight to a centered ceiling luminaire in ceiling conduit
        const isCeilingDrop = toEl?.wallSnapped === 'ceiling' || fromEl?.wallSnapped === 'ceiling';

        if (dx > 0.25 && dz > 0.25 && (!isCeilingDrop || pts.length < 3)) {
          violations.push({
            id: `viol-diag-${route.id}-${s}`,
            routeId: route.id,
            type: 'diagonal',
            title: 'Unzulässige Schräg-/Diagonalverlegung (DIN 18015-3)',
            severity: 'critical',
            segmentIndex: s,
            point: { x: (p1.x + p2.x) / 2, z: (p1.z + p2.z) / 2 },
            description: `Abschnitt ${s + 1} verläuft diagonal im Raum (${dx.toFixed(2)}m × ${dz.toFixed(2)}m). DIN 18015-3 verlangt ausnahmslos rechtwinklige Verlegung parallel zu Raumkanten!`,
          });
        }

        // Check 4: Route running through the middle of the room outside DIN installation zone
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;
        const distFromWest = Math.abs(midX - (-room.width / 2));
        const distFromEast = Math.abs(room.width / 2 - midX);
        const distFromNorth = Math.abs(midZ - (-room.length / 2));
        const distFromSouth = Math.abs(room.length / 2 - midZ);
        const minDistToWall = Math.min(distFromWest, distFromEast, distFromNorth, distFromSouth);

        if (minDistToWall > 0.6 && !isCeilingDrop && route.conduitType !== 'Estrichverlegung') {
          violations.push({
            id: `viol-zone-${route.id}-${s}`,
            routeId: route.id,
            type: 'outside_zone',
            title: 'Leitung außerhalb der DIN-Installationszone',
            severity: 'warning',
            segmentIndex: s,
            point: { x: midX, z: midZ },
            description: `Leitung liegt ${minDistToWall.toFixed(2)}m von der Wand entfernt im Raum ohne deklarierte Estrichverlegung.`,
          });
        }
      }
    });

    return violations;
  }, [activeWiring, electrical, room.width, room.length]);

  // Critical items summary
  const criticalViolationsCount = detectedViolations.filter(v => v.severity === 'critical').length;
  const criticalCrossingsCount = detectedIntersections.filter(i => i.isSamePlane).length;

  // Auto-Fix: Orthogonalize / 90° Manhattan alignment for all diagonal routes
  const handleAutoStraightenRoutes = () => {
    if (!onUpdateWiring) return;

    const straightened = wiring.map(route => {
      const fromEl = electrical.find(e => e.id === route.fromId);
      const toEl = electrical.find(e => e.id === route.toId);
      if (!fromEl || !toEl) return route;

      const pStart = fromEl.position;
      const pEnd = toEl.position;

      // Create pure 90° orthogonal route following DIN wall installation zone
      // Move from pStart -> wall zone -> along wall -> pEnd
      const cornerX = pEnd.x;
      const cornerZ = pStart.z;
      const zoneY = Math.max(pStart.y, pEnd.y, room.height * 0.9);

      const newPoints: Vector3D[] = [
        { x: pStart.x, y: pStart.y, z: pStart.z },
        { x: pStart.x, y: zoneY, z: pStart.z },
        { x: cornerX, y: zoneY, z: cornerZ },
        { x: pEnd.x, y: zoneY, z: pEnd.z },
        { x: pEnd.x, y: pEnd.y, z: pEnd.z },
      ];

      // Re-estimate length and voltage drop
      const dx = Math.abs(pEnd.x - pStart.x);
      const dz = Math.abs(pEnd.z - pStart.z);
      const dy = Math.abs(zoneY - pStart.y) + Math.abs(zoneY - pEnd.y);
      const newLen = Number((dx + dz + dy + 0.6).toFixed(1));
      const crossSec = route.cableType.includes('2.5') ? 2.5 : 1.5;
      const newDrop = Number(((2 * newLen * 12 * 1) / (56 * crossSec * 230) * 100).toFixed(2));

      return {
        ...route,
        points: newPoints,
        lengthMeters: newLen,
        voltageDropPct: newDrop,
        installationZone: 'DIN 18015 Decke (15-30cm)' as const,
      };
    });

    onUpdateWiring(straightened);
    setFixNotification('Alle Leitungswege erfolgreich auf rechtwinklige 90°-DIN-Verlegung begradigt!');
    setTimeout(() => setFixNotification(null), 4000);
  };

  // Get color for a route based on active colorMode
  const getRouteColor = (route: WiringRoute): string => {
    if (colorMode === 'circuit') {
      return CIRCUIT_COLORS[route.circuitId] || '#38bdf8';
    }
    if (colorMode === 'cable_type') {
      return CABLE_COLORS[route.cableType] || '#38bdf8';
    }
    if (colorMode === 'zone') {
      if (route.installationZone.includes('Decke')) return '#f59e0b';
      if (route.installationZone.includes('Boden')) return '#3b82f6';
      return '#10b981';
    }
    if (colorMode === 'compliance') {
      const hasCritViol = detectedViolations.some(v => v.routeId === route.id && v.severity === 'critical');
      const hasWarnViol = detectedViolations.some(v => v.routeId === route.id && v.severity === 'warning');
      const hasCritCross = detectedIntersections.some(i => (i.route1Id === route.id || i.route2Id === route.id) && i.isSamePlane);

      if (hasCritViol || hasCritCross) return '#f43f5e'; // Red
      if (hasWarnViol) return '#f59e0b'; // Amber
      return '#10b981'; // Green
    }
    return '#38bdf8';
  };

  // Zoom / Pan handlers & iPad Multi-Touch (Pinch-to-zoom & 2-finger pan)
  const handleZoomIn = () => setZoomLevel(prev => Math.min(2.5, prev + 0.25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.75, prev - 0.25));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Touch gesture state for 2D canvas
  const touchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    startX: number;
    startY: number;
    initialPan: { x: number; y: number };
  }>({
    initialDist: 0,
    initialZoom: 1,
    startX: 0,
    startY: 0,
    initialPan: { x: 0, y: 0 }
  });

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // 2 fingers: pinch or pan
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      touchStateRef.current = {
        initialDist: dist,
        initialZoom: zoomLevel,
        startX: midX,
        startY: midY,
        initialPan: { ...panOffset }
      };
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      // 1 finger pan when zoomed in
      const t = e.touches[0];
      touchStateRef.current = {
        initialDist: 0,
        initialZoom: zoomLevel,
        startX: t.clientX,
        startY: t.clientY,
        initialPan: { ...panOffset }
      };
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStateRef.current.initialDist > 0) {
      // Pinch to zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      const scaleChange = dist / touchStateRef.current.initialDist;
      const newZoom = Math.min(2.5, Math.max(0.75, touchStateRef.current.initialZoom * scaleChange));
      setZoomLevel(newZoom);

      // Also pan with 2 fingers
      const deltaX = (midX - touchStateRef.current.startX) / newZoom;
      const deltaY = (midY - touchStateRef.current.startY) / newZoom;
      setPanOffset({
        x: touchStateRef.current.initialPan.x + deltaX,
        y: touchStateRef.current.initialPan.y + deltaY
      });
    } else if (e.touches.length === 1 && touchStateRef.current.initialDist === 0 && zoomLevel > 1) {
      // 1 finger pan
      const t = e.touches[0];
      const deltaX = (t.clientX - touchStateRef.current.startX) / zoomLevel;
      const deltaY = (t.clientY - touchStateRef.current.startY) / zoomLevel;
      setPanOffset({
        x: touchStateRef.current.initialPan.x + deltaX,
        y: touchStateRef.current.initialPan.y + deltaY
      });
    }
  };

  return (
    <div className={`w-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50 overflow-hidden' : 'relative'
    }`}>
      {/* Header Bar */}
      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Cable className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Leitungstrassen-Visualisierung & Kreuzungsanalyse
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                2D CAD-Overlay
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Farbcodierte Leitungswege zwischen Verteilerkasten (UV) und Steckdosen mit DIN 18015 Zonen- & Kollisionsprüfung.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Color Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 font-medium pl-1.5 pr-1">Farbcodierung:</span>
            <button
              onClick={() => setColorMode('circuit')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                colorMode === 'circuit'
                  ? 'bg-sky-600 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Nach Stromkreis (F1, F2, F3...)"
            >
              Stromkreis
            </button>
            <button
              onClick={() => setColorMode('cable_type')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                colorMode === 'cable_type'
                  ? 'bg-sky-600 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Nach Kabeltyp (NYM 3x1.5, 5x2.5...)"
            >
              Kabeltyp
            </button>
            <button
              onClick={() => setColorMode('zone')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                colorMode === 'zone'
                  ? 'bg-sky-600 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Nach Installationszone (Decke vs Boden)"
            >
              Verlegeebene
            </button>
            <button
              onClick={() => setColorMode('compliance')}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                colorMode === 'compliance'
                  ? 'bg-sky-600 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Nach Prüfstatus (Konform vs Verstoß)"
            >
              Prüfung
            </button>
          </div>

          {/* Auto-Straighten / Fix Button */}
          {criticalViolationsCount > 0 && onUpdateWiring && (
            <button
              onClick={handleAutoStraightenRoutes}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition active:scale-95 animate-pulse"
              title="Diagonale Leitungswege nach DIN 90° rechtwinklig begradigen"
            >
              <Wrench className="w-3.5 h-3.5" />
              90°-DIN Begradigen ({criticalViolationsCount})
            </button>
          )}

          {/* Toggle Expand / Fullscreen */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={isExpanded ? 'Verkleinern' : 'Vollbild'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Status & Warning Diagnostic Banner */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Crossings Counter */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${
              criticalCrossingsCount > 0 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
            }`} />
            <span className="font-semibold text-slate-200">
              {detectedIntersections.length} Kreuzung(en) erkannt:
            </span>
            <span className={`px-1.5 py-0.5 rounded font-bold font-mono text-[10px] ${
              criticalCrossingsCount > 0 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {criticalCrossingsCount} kritisch (gleiche Ebene)
            </span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Violations Counter */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${
              criticalViolationsCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
            }`} />
            <span className="font-semibold text-slate-200">
              DIN 18015 Leitungsverstöße:
            </span>
            <span className={`px-1.5 py-0.5 rounded font-bold font-mono text-[10px] ${
              criticalViolationsCount > 0 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {criticalViolationsCount === 0 ? 'Keine Verstöße' : `${criticalViolationsCount} Verstoß/Verstöße`}
            </span>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-3 text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={showDINZones}
              onChange={(e) => setShowDINZones(e.target.checked)}
              className="accent-sky-500 rounded"
            />
            <span className="text-[11px]">DIN-Zonen</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={showCrossings}
              onChange={(e) => setShowCrossings(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span className="text-[11px]">Kreuzungen</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={showViolations}
              onChange={(e) => setShowViolations(e.target.checked)}
              className="accent-rose-500 rounded"
            />
            <span className="text-[11px]">Verstöße</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={animateFlow}
              onChange={(e) => setAnimateFlow(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span className="text-[11px]">Stromfluss</span>
          </label>
        </div>
      </div>

      {/* Fix Notification Toast */}
      {fixNotification && (
        <div className="mx-4 mt-3 p-3 bg-emerald-950/60 border border-emerald-700/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn shadow-lg">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{fixNotification}</span>
        </div>
      )}

      {/* Main CAD Interactive Canvas Area */}
      <div 
        className="relative flex-1 bg-slate-950 overflow-hidden min-h-[460px] flex items-center justify-center p-2 touch-none"
        onTouchStart={handleCanvasTouchStart}
        onTouchMove={handleCanvasTouchMove}
      >
        {/* Floating Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-xl backdrop-blur-sm">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Vergrößern (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Verkleinern (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Ansicht zurücksetzen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-xl backdrop-blur-sm max-w-xs text-xs space-y-1.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Legende & Symbole
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {room.width}m × {room.length}m
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 border border-white" />
              <span className="text-slate-300">Verteilerkasten (UV)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300">Schuko Steckdose</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-300" />
              <span className="text-slate-300">Herd / CEE 16A</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-300">Deckenleuchte</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-400 rounded" />
              <span className="text-slate-300">DIN 18015 Zone (30cm)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-rose-500 rounded border-dashed" />
              <span className="text-slate-300">Kollision / Verstoß</span>
            </div>
          </div>
        </div>

        {/* Selected Route or Crossing Diagnostic Tooltip Card */}
        {(hoveredRouteId || selectedRouteId || hoveredCrossingId) && (
          <div className="absolute top-4 left-4 z-20 bg-slate-900/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl backdrop-blur-md max-w-sm text-xs animate-fadeIn">
            {hoveredCrossingId ? (
              (() => {
                const cross = detectedIntersections.find(i => i.id === hoveredCrossingId);
                if (!cross) return null;
                const r1 = wiring.find(w => w.id === cross.route1Id);
                const r2 = wiring.find(w => w.id === cross.route2Id);

                return (
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 pb-1 border-b border-slate-800">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{cross.isSamePlane ? 'Kritische Trassenkreuzung' : 'Ebenenkreuzung (Unkritisch)'}</span>
                    </div>
                    <p className="text-slate-200 mt-1.5 leading-relaxed">
                      {cross.description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] space-y-1 text-slate-300">
                      <div><strong className="text-sky-300">Route 1:</strong> {r1?.cableType} ({r1?.circuitId})</div>
                      <div><strong className="text-purple-300">Route 2:</strong> {r2?.cableType} ({r2?.circuitId})</div>
                      <div><strong className="text-slate-400">Höhenabstand Δh:</strong> {(cross.deltaY * 100).toFixed(0)} cm</div>
                    </div>
                  </div>
                );
              })()
            ) : (
              (() => {
                const rId = hoveredRouteId || selectedRouteId;
                const route = wiring.find(w => w.id === rId);
                if (!route) return null;
                const fromEl = electrical.find(e => e.id === route.fromId);
                const toEl = electrical.find(e => e.id === route.toId);
                const viols = detectedViolations.filter(v => v.routeId === route.id);
                const crossings = detectedIntersections.filter(i => i.route1Id === route.id || i.route2Id === route.id);

                return (
                  <div>
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Cable className="w-3.5 h-3.5 text-sky-400" />
                        {fromEl?.name || route.fromId} → {toEl?.name || route.toId}
                      </span>
                      <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-sky-300">
                        {route.cableType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Stromkreis:</span>
                        <span className="font-semibold text-slate-200">{route.circuitId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Länge / Spannungsfall:</span>
                        <span className="font-semibold font-mono text-slate-200">
                          {route.lengthMeters} m ({route.voltageDropPct}%)
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block">Verlegeart / Zone:</span>
                        <span className="text-slate-300">{route.installationZone}</span>
                      </div>
                    </div>

                    {viols.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                        {viols.map(v => (
                          <div key={v.id} className="text-rose-400 flex items-start gap-1 text-[11px]">
                            <AlertOctagon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{v.title}: {v.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {crossings.length > 0 && (
                      <div className="mt-1 text-amber-400 flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{crossings.length} Trassenkreuzung(en) auf diesem Weg</span>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* SVG Interactive Canvas */}
        <div 
          className="w-full h-full flex items-center justify-center cursor-crosshair select-none"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full max-w-[860px] h-auto drop-shadow-2xl"
          >
            <defs>
              {/* Grid pattern */}
              <pattern id="cadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0f172a" strokeWidth="0.4" />
              </pattern>

              {/* DIN Zone Hatching */}
              <pattern id="dinZoneHatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.25" />
              </pattern>

              {/* Glowing Filters */}
              <filter id="glowRoute" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowViol" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid */}
            <rect width={svgWidth} height={svgHeight} fill="#090d16" />
            <rect 
              x={padding} 
              y={padding} 
              width={svgWidth - 2 * padding} 
              height={svgHeight - 2 * padding} 
              fill="url(#cadGrid)" 
            />

            {/* Room Boundary Walls */}
            <rect
              x={padding}
              y={padding}
              width={svgWidth - 2 * padding}
              height={svgHeight - 2 * padding}
              fill="none"
              stroke="#334155"
              strokeWidth="4"
              rx="4"
            />

            {/* Wall Dimension Labels */}
            <text
              x={svgWidth / 2}
              y={padding - 15}
              textAnchor="middle"
              className="text-[12px] font-mono font-bold fill-slate-400"
            >
              Nordwand: {room.width.toFixed(2)} m
            </text>
            <text
              x={svgWidth / 2}
              y={svgHeight - padding + 25}
              textAnchor="middle"
              className="text-[12px] font-mono font-bold fill-slate-400"
            >
              Südwand: {room.width.toFixed(2)} m
            </text>
            <text
              x={padding - 18}
              y={svgHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, ${padding - 18}, ${svgHeight / 2})`}
              className="text-[12px] font-mono font-bold fill-slate-400"
            >
              Westwand: {room.length.toFixed(2)} m
            </text>
            <text
              x={svgWidth - padding + 22}
              y={svgHeight / 2}
              textAnchor="middle"
              transform={`rotate(90, ${svgWidth - padding + 22}, ${svgHeight / 2})`}
              className="text-[12px] font-mono font-bold fill-slate-400"
            >
              Ostwand (Flur): {room.length.toFixed(2)} m
            </text>

            {/* DIN 18015-3 Installation Zones Overlay (30cm wall band) */}
            {showDINZones && (() => {
              const zoneDepthPx = ((0.30 / room.width) * (svgWidth - 2 * padding));
              const zoneDepthZPx = ((0.30 / room.length) * (svgHeight - 2 * padding));

              return (
                <g className="din-zones opacity-90 transition-opacity">
                  {/* North Wall Zone */}
                  <rect
                    x={padding}
                    y={padding}
                    width={svgWidth - 2 * padding}
                    height={zoneDepthZPx}
                    fill="url(#dinZoneHatch)"
                    stroke="#f59e0b"
                    strokeWidth="0.8"
                    strokeDasharray="4 2"
                    strokeOpacity="0.4"
                  />
                  {/* South Wall Zone */}
                  <rect
                    x={padding}
                    y={svgHeight - padding - zoneDepthZPx}
                    width={svgWidth - 2 * padding}
                    height={zoneDepthZPx}
                    fill="url(#dinZoneHatch)"
                    stroke="#f59e0b"
                    strokeWidth="0.8"
                    strokeDasharray="4 2"
                    strokeOpacity="0.4"
                  />
                  {/* West Wall Zone */}
                  <rect
                    x={padding}
                    y={padding}
                    width={zoneDepthPx}
                    height={svgHeight - 2 * padding}
                    fill="url(#dinZoneHatch)"
                    stroke="#f59e0b"
                    strokeWidth="0.8"
                    strokeDasharray="4 2"
                    strokeOpacity="0.4"
                  />
                  {/* East Wall Zone */}
                  <rect
                    x={svgWidth - padding - zoneDepthPx}
                    y={padding}
                    width={zoneDepthPx}
                    height={svgHeight - 2 * padding}
                    fill="url(#dinZoneHatch)"
                    stroke="#f59e0b"
                    strokeWidth="0.8"
                    strokeDasharray="4 2"
                    strokeOpacity="0.4"
                  />

                  {/* Corner indicator labels */}
                  <text
                    x={padding + 8}
                    y={padding + 16}
                    className="text-[9px] font-mono fill-amber-400/80 font-semibold"
                  >
                    DIN 18015-3 Installationszone (15–30 cm)
                  </text>
                </g>
              );
            })()}

            {/* WIRING ROUTES (Lines between UV and Sockets / Points) */}
            <g className="wiring-routes">
              {activeWiring.map(route => {
                const fromEl = electrical.find(e => e.id === route.fromId);
                const toEl = electrical.find(e => e.id === route.toId);
                if (!fromEl && !toEl) return null;

                // Points path
                const pts = route.points && route.points.length >= 2
                  ? route.points
                  : [fromEl?.position, toEl?.position].filter(Boolean) as Vector3D[];

                if (pts.length < 2) return null;

                // Build SVG path data 'd'
                const pathD = pts.reduce((acc, pt, idx) => {
                  const sx = toSvgX(pt.x);
                  const sz = toSvgZ(pt.z);
                  return idx === 0 ? `M ${sx} ${sz}` : `${acc} L ${sx} ${sz}`;
                }, '');

                const routeColor = getRouteColor(route);
                const isSelected = route.id === selectedRouteId;
                const isHovered = route.id === hoveredRouteId;
                const hasCriticalViol = detectedViolations.some(v => v.routeId === route.id && v.severity === 'critical');
                const strokeW = isSelected ? 4 : isHovered ? 3.5 : route.cableType.includes('2.5') ? 2.8 : 2;

                return (
                  <g 
                    key={route.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      if (onSelectRoute) onSelectRoute(route.id);
                    }}
                    onMouseEnter={() => setHoveredRouteId(route.id)}
                    onMouseLeave={() => setHoveredRouteId(null)}
                  >
                    {/* Wider transparent hit area for easy hover/clicking */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="14"
                    />

                    {/* Outer Glow on hover or selection */}
                    {(isSelected || isHovered) && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={routeColor}
                        strokeWidth={strokeW + 6}
                        strokeOpacity="0.4"
                        filter="url(#glowRoute)"
                      />
                    )}

                    {/* Main Cable Stroke */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={hasCriticalViol ? '#f43f5e' : routeColor}
                      strokeWidth={strokeW}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all"
                    />

                    {/* Animated Flow Pulse Dots */}
                    {animateFlow && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={strokeW * 0.7}
                        strokeDasharray="6 14"
                        strokeLinecap="round"
                        className="animate-flowDash"
                        opacity="0.8"
                      />
                    )}

                    {/* Route Segment Endpoints / Bends */}
                    {pts.map((pt, pIdx) => (
                      <circle
                        key={pIdx}
                        cx={toSvgX(pt.x)}
                        cy={toSvgZ(pt.z)}
                        r={pIdx === 0 || pIdx === pts.length - 1 ? 3 : 2}
                        fill={routeColor}
                        stroke="#090d16"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Midpoint Cable Tag */}
                    {showLabels && pts.length >= 2 && (() => {
                      const midIdx = Math.floor(pts.length / 2);
                      const midPt = pts[midIdx] || pts[0];
                      const mx = toSvgX(midPt.x);
                      const mz = toSvgZ(midPt.z);

                      return (
                        <g transform={`translate(${mx}, ${mz})`} className="pointer-events-none">
                          <rect
                            x="-22"
                            y="-9"
                            width="44"
                            height="15"
                            rx="3"
                            fill="#090d16"
                            fillOpacity="0.85"
                            stroke={routeColor}
                            strokeWidth="0.8"
                          />
                          <text
                            x="0"
                            y="2"
                            textAnchor="middle"
                            className="text-[9px] font-mono font-bold fill-white"
                          >
                            {route.lengthMeters}m
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}
            </g>

            {/* ROUTING VIOLATION MARKERS (Diagonal or Zone Violations) */}
            {showViolations && (
              <g className="violations-layer">
                {detectedViolations.map(viol => {
                  if (!viol.point) return null;
                  const vx = toSvgX(viol.point.x);
                  const vz = toSvgZ(viol.point.z);

                  return (
                    <g 
                      key={viol.id}
                      transform={`translate(${vx}, ${vz})`}
                      className="cursor-pointer group"
                      onClick={() => onSelectRoute && onSelectRoute(viol.routeId)}
                    >
                      {/* Pulsing Warning Ripple */}
                      <circle
                        r="14"
                        fill="none"
                        stroke={viol.severity === 'critical' ? '#f43f5e' : '#f59e0b'}
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                        className="animate-ping"
                        opacity="0.6"
                      />

                      {/* Warning Icon Badge */}
                      <circle
                        r="9"
                        fill={viol.severity === 'critical' ? '#e11d48' : '#d97706'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        filter="url(#glowViol)"
                      />

                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        className="text-[9px] font-black fill-white select-none pointer-events-none"
                      >
                        !
                      </text>

                      {/* Hover Tooltip Label */}
                      <title>{`${viol.title}: ${viol.description}`}</title>
                    </g>
                  );
                })}
              </g>
            )}

            {/* CABLE CROSSING MARKERS (Intersections) */}
            {showCrossings && (
              <g className="crossings-layer">
                {detectedIntersections.map(crossing => {
                  const cx = toSvgX(crossing.point.x);
                  const cz = toSvgZ(crossing.point.z);
                  const isHovered = hoveredCrossingId === crossing.id;

                  return (
                    <g
                      key={crossing.id}
                      transform={`translate(${cx}, ${cz})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredCrossingId(crossing.id)}
                      onMouseLeave={() => setHoveredCrossingId(null)}
                    >
                      {/* Critical Warning Ring */}
                      {crossing.isSamePlane && (
                        <circle
                          r={isHovered ? 15 : 12}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          className="animate-spin"
                          style={{ animationDuration: '6s' }}
                        />
                      )}

                      {/* Center Point Marker */}
                      <circle
                        r={crossing.isSamePlane ? 6.5 : 4.5}
                        fill={crossing.isSamePlane ? '#d97706' : '#64748b'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />

                      {/* Cross Icon X */}
                      <path
                        d="M -2.5 -2.5 L 2.5 2.5 M 2.5 -2.5 L -2.5 2.5"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />

                      <title>{crossing.description}</title>
                    </g>
                  );
                })}
              </g>
            )}

            {/* ELECTRICAL ELEMENTS / STECKDOSEN & VERTEILERKASTEN */}
            <g className="electrical-elements">
              {electrical.map(el => {
                const ex = toSvgX(el.position.x);
                const ez = toSvgZ(el.position.z);
                const isSelected = el.id === selectedElementId;
                const isHovered = el.id === hoveredElementId;
                const isUV = el.type === 'sub_distribution_panel' || el.id === 'el-uv';

                return (
                  <g
                    key={el.id}
                    transform={`translate(${ex}, ${ez})`}
                    className="cursor-pointer group"
                    onClick={() => {
                      if (onSelectElement) onSelectElement(el.id);
                    }}
                    onMouseEnter={() => setHoveredElementId(el.id)}
                    onMouseLeave={() => setHoveredElementId(null)}
                  >
                    {/* Selection Ring */}
                    {(isSelected || isHovered) && (
                      <circle
                        r={isUV ? 20 : 15}
                        fill="none"
                        stroke={isUV ? '#f59e0b' : '#38bdf8'}
                        strokeWidth="2"
                        strokeDasharray="3 2"
                        className="animate-spin"
                        style={{ animationDuration: '8s' }}
                      />
                    )}

                    {isUV ? (
                      /* Sub-Distribution Board UV Icon */
                      <g>
                        <rect
                          x="-14"
                          y="-14"
                          width="28"
                          height="28"
                          rx="4"
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="shadow-lg"
                        />
                        <Zap className="w-4 h-4 text-slate-950 pointer-events-none" x="-8" y="-8" />
                      </g>
                    ) : el.type === 'light_ceiling' ? (
                      /* Ceiling Luminaire Icon */
                      <g>
                        <circle
                          r="10"
                          fill="#fef08a"
                          stroke="#ca8a04"
                          strokeWidth="2"
                        />
                        {/* Light rays */}
                        <line x1="-13" y1="0" x2="-10" y2="0" stroke="#ca8a04" strokeWidth="1.5" />
                        <line x1="10" y1="0" x2="13" y2="0" stroke="#ca8a04" strokeWidth="1.5" />
                        <line x1="0" y1="-13" x2="0" y2="-10" stroke="#ca8a04" strokeWidth="1.5" />
                        <line x1="0" y1="10" x2="0" y2="13" stroke="#ca8a04" strokeWidth="1.5" />
                      </g>
                    ) : el.type === 'socket_cee16' ? (
                      /* 400V 3P Starkstrom / Cooktop CEE Socket */
                      <g>
                        <rect
                          x="-9"
                          y="-9"
                          width="18"
                          height="18"
                          rx="3"
                          fill="#f43f5e"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <circle r="4" fill="#ffffff" />
                        <text x="0" y="2.5" textAnchor="middle" className="text-[6px] font-black fill-rose-600">3P</text>
                      </g>
                    ) : el.type === 'socket_double' ? (
                      /* Double Socket */
                      <g>
                        <rect
                          x="-10"
                          y="-6"
                          width="20"
                          height="12"
                          rx="3"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <circle cx="-4" cy="0" r="2.5" fill="#ffffff" />
                        <circle cx="4" cy="0" r="2.5" fill="#ffffff" />
                      </g>
                    ) : (
                      /* Standard Socket or Switch */
                      <g>
                        <circle
                          r="7.5"
                          fill={el.type.includes('switch') ? '#8b5cf6' : '#10b981'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <circle r="2.5" fill="#ffffff" />
                      </g>
                    )}

                    {/* Element Label text */}
                    {showLabels && (
                      <g transform="translate(0, 16)" className="pointer-events-none">
                        <rect
                          x={-Math.min(el.name.length * 3.5, 45)}
                          y="-7"
                          width={Math.min(el.name.length * 7, 90)}
                          height="14"
                          rx="3"
                          fill="#090d16"
                          fillOpacity="0.85"
                          stroke="#334155"
                          strokeWidth="0.5"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          className="text-[8.5px] font-medium fill-slate-200 select-none truncate"
                        >
                          {el.name.length > 18 ? `${el.name.substring(0, 16)}...` : el.name}
                        </text>
                      </g>
                    )}

                    <title>{`${el.name} (${el.heightFromFloorCm} cm FFB, Stromkreis: ${el.circuitId})`}</title>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Bottom Summary Bar & Routing Diagnostic Insights */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Verteilerkasten:</span>
            <span className="font-semibold text-white">
              {uvElement ? `${uvElement.name} (H = ${uvElement.heightFromFloorCm} cm)` : 'el-uv'}
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Leitungsstrecken:</span>
            <span className="font-semibold text-white">{activeWiring.length} Routen</span>
            <span className="text-slate-500 font-mono">
              ({activeWiring.reduce((sum, w) => sum + w.lengthMeters, 0).toFixed(1)} m gesamt)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {criticalViolationsCount === 0 && criticalCrossingsCount === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Leitungsführung 100% DIN 18015-konform
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold text-xs bg-rose-950/40 px-2.5 py-1 rounded-xl border border-rose-800/60">
              <AlertTriangle className="w-3.5 h-3.5" />
              {criticalViolationsCount + criticalCrossingsCount} Handlungsbedarf(e) in der Leitungsführung
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

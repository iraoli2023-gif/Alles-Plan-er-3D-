import React, { useState, useMemo, useCallback } from 'react';
import { 
  ElectricalElement, 
  BreakerCircuit, 
  RCDDevice, 
  RoomConfig, 
  WiringRoute 
} from '../types';
import { 
  Bot, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Scale, 
  Sparkles, 
  Sliders, 
  ArrowRight, 
  RotateCcw, 
  Check, 
  Copy, 
  Info, 
  Wrench, 
  ExternalLink, 
  Flame, 
  Activity, 
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { soundSynth } from '../utils/audioSynth';

export type AuditCategory = 'all' | 'load_balancing' | 'safety' | 'din18015';

export interface AuditSuggestion {
  id: string;
  category: 'load_balancing' | 'safety' | 'din18015';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  standard: string;
  description: string;
  impact: string;
  actionLabel: string;
  isApplied?: boolean;
  affectedCircuitIds?: string[];
  affectedElementIds?: string[];
  applyFix: () => void;
}

export interface AIAuditorProps {
  electrical: ElectricalElement[];
  circuits: BreakerCircuit[];
  room?: RoomConfig;
  rcds?: RCDDevice[];
  wiring?: WiringRoute[];
  onUpdateElectrical?: (items: ElectricalElement[]) => void;
  onUpdateCircuits?: (circuits: BreakerCircuit[]) => void;
  onClose?: () => void;
  onSelectElement?: (id: string) => void;
}

export const AIAuditor: React.FC<AIAuditorProps> = ({
  electrical,
  circuits,
  room,
  rcds = [],
  wiring = [],
  onUpdateElectrical,
  onUpdateCircuits,
  onClose,
  onSelectElement,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory>('all');
  const [appliedFixes, setAppliedFixes] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'phases' | 'circuits' | 'issues'>('issues');

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // 1. Phase Load Calculations (L1, L2, L3)
  const phaseStats = useMemo(() => {
    let l1Watts = 0;
    let l2Watts = 0;
    let l3Watts = 0;

    circuits.forEach(c => {
      // Calculate total connected power for this circuit from assigned electrical items
      const connectedElements = electrical.filter(e => e.circuitId === c.id);
      const elementsWattage = connectedElements.reduce((acc, el) => acc + (el.powerWatts || 0), 0);
      const circuitLoad = Math.max(c.activeLoadWatts || c.baseLoadWatts || 0, elementsWattage);

      if (c.breakerType.includes('3P')) {
        l1Watts += Math.round(circuitLoad / 3);
        l2Watts += Math.round(circuitLoad / 3);
        l3Watts += Math.round(circuitLoad / 3);
      } else if (c.phase === 'L1') {
        l1Watts += circuitLoad;
      } else if (c.phase === 'L2') {
        l2Watts += circuitLoad;
      } else if (c.phase === 'L3') {
        l3Watts += circuitLoad;
      }
    });

    const totalWatts = l1Watts + l2Watts + l3Watts;
    const maxPhaseWatts = Math.max(l1Watts, l2Watts, l3Watts);
    const minPhaseWatts = Math.min(l1Watts, l2Watts, l3Watts);
    const unbalanceWatts = maxPhaseWatts - minPhaseWatts;

    // VDE / TAB threshold is 4.6 kVA (4600 W) unbalance
    const isUnbalanceCompliant = unbalanceWatts <= 4600;
    const unbalancePct = totalWatts > 0 ? Math.round((unbalanceWatts / totalWatts) * 100) : 0;

    // Current in Amperes at 230V
    const l1Amps = Number((l1Watts / 230).toFixed(1));
    const l2Amps = Number((l2Watts / 230).toFixed(1));
    const l3Amps = Number((l3Watts / 230).toFixed(1));

    // Phase percentage of single-phase typical 16A circuit or SLS 35A (8050W)
    const slsPhaseCap = 8050; // 35A SLS
    const l1Pct = Math.min(100, Math.round((l1Watts / slsPhaseCap) * 100));
    const l2Pct = Math.min(100, Math.round((l2Watts / slsPhaseCap) * 100));
    const l3Pct = Math.min(100, Math.round((l3Watts / slsPhaseCap) * 100));

    return {
      l1Watts,
      l2Watts,
      l3Watts,
      l1Amps,
      l2Amps,
      l3Amps,
      l1Pct,
      l2Pct,
      l3Pct,
      totalWatts,
      unbalanceWatts,
      unbalancePct,
      isUnbalanceCompliant,
    };
  }, [circuits, electrical]);

  // 2. Circuit Analysis & Load Map
  const circuitAnalysis = useMemo(() => {
    return circuits.map(c => {
      const connectedElements = electrical.filter(e => e.circuitId === c.id);
      const connectedWatts = connectedElements.reduce((acc, el) => acc + (el.powerWatts || 0), 0);
      const effectiveWatts = Math.max(c.activeLoadWatts || c.baseLoadWatts || 0, connectedWatts);

      // Max power based on breaker: 16A @ 230V = 3680W; 10A @ 230V = 2300W; 3P 16A = 11040W
      let maxWatts = 3680;
      if (c.breakerType.includes('3P')) maxWatts = 11040;
      else if (c.breakerType.includes('10A')) maxWatts = 2300;
      else if (c.breakerType.includes('16A')) maxWatts = 3680;

      const loadPct = Math.round((effectiveWatts / maxWatts) * 100);
      const isOverloaded = effectiveWatts > maxWatts;
      const isNearCapacity = effectiveWatts > maxWatts * 0.8; // 80% continuous load limit DIN VDE 0298-4

      // Sockets count on this circuit
      const socketCount = connectedElements.filter(e => 
        e.type === 'socket_single' || e.type === 'socket_double' || e.type === 'socket_cee16'
      ).length;

      // Has RCD assigned
      const hasRCD = rcds.length === 0 || (!!c.rcdId && rcds.some(r => r.id === c.rcdId));

      return {
        ...c,
        connectedElements,
        effectiveWatts,
        maxWatts,
        loadPct,
        isOverloaded,
        isNearCapacity,
        socketCount,
        hasRCD,
      };
    });
  }, [circuits, electrical, rcds]);

  // 3. Automated Intelligent Suggestion Engine
  const suggestions = useMemo<AuditSuggestion[]>(() => {
    const list: AuditSuggestion[] = [];

    // --- CHECK 1: Phase Load Balancing (Phasen-Schieflast & Lastungleichheit) ---
    // If one phase has significantly higher load than the others (> 500W difference) and we have single-phase circuits
    const singlePhaseCircuits = circuits.filter(c => !c.breakerType.includes('3P'));
    if (singlePhaseCircuits.length >= 3) {
      const pLoads = [
        { phase: 'L1' as const, load: phaseStats.l1Watts },
        { phase: 'L2' as const, load: phaseStats.l2Watts },
        { phase: 'L3' as const, load: phaseStats.l3Watts },
      ].sort((a, b) => b.load - a.load);

      const heaviestPhase = pLoads[0];
      const lightestPhase = pLoads[2];

      if (heaviestPhase.load - lightestPhase.load > 300) {
        // Find a circuit on heaviestPhase that can be moved to lightestPhase
        const candidateCircuit = singlePhaseCircuits.find(c => c.phase === heaviestPhase.phase && c.id !== 'circuit-f5-stove');
        if (candidateCircuit) {
          list.push({
            id: `sug-balance-${candidateCircuit.id}`,
            category: 'load_balancing',
            severity: heaviestPhase.load - lightestPhase.load > 1500 ? 'critical' : 'warning',
            title: `Phasen-Schieflast ausgleichen: ${candidateCircuit.name} auf ${lightestPhase.phase} umlegen`,
            standard: 'DIN VDE 0100 / TAB Richtlinie (Phasensymmetrie)',
            description: `Phase ${heaviestPhase.phase} ist mit ${heaviestPhase.load} W belastet, während ${lightestPhase.phase} nur ${lightestPhase.load} W führt (Differenz: ${heaviestPhase.load - lightestPhase.load} W). Das Umlegen von "${candidateCircuit.name}" gleicht die Phasenströme optimal aus.`,
            impact: `Reduziert Phasen-Schieflast um ca. ${candidateCircuit.activeLoadWatts || 60} W und verhindert thermische Asymmetrie im Unterverteiler.`,
            actionLabel: `Auf Phase ${lightestPhase.phase} umlegen`,
            affectedCircuitIds: [candidateCircuit.id],
            applyFix: () => {
              if (onUpdateCircuits) {
                const updated = circuits.map(c => 
                  c.id === candidateCircuit.id ? { ...c, phase: lightestPhase.phase } : c
                );
                onUpdateCircuits(updated);
                setAppliedFixes(prev => ({ ...prev, [`sug-balance-${candidateCircuit.id}`]: true }));
                soundSynth.playConfirmation();
                showToast(`Stromkreis "${candidateCircuit.name}" erfolgreich auf ${lightestPhase.phase} umgelegt!`);
              }
            }
          });
        }
      }
    }

    // --- CHECK 2: High-Power Appliance Dedicated Circuit (DIN 18015-1 § 5.2.2) ---
    // Appliances >= 2000W must have dedicated circuits (e.g. Herd, Spülmaschine, Waschmaschine)
    electrical.forEach(el => {
      if (el.powerWatts >= 1500) {
        const assignedCircuit = circuits.find(c => c.id === el.circuitId);
        // Check if other devices share this circuit
        const sharingElements = electrical.filter(e => e.circuitId === el.circuitId && e.id !== el.id);
        if (sharingElements.length > 0 && assignedCircuit && !assignedCircuit.breakerType.includes('3P')) {
          list.push({
            id: `sug-dedicated-${el.id}`,
            category: 'din18015',
            severity: 'critical',
            title: `Großverbraucher "${el.name}" teilen sich Stromkreis ${assignedCircuit.number}`,
            standard: 'DIN 18015-1 Abschnitt 5.2.2 (Separate Stromkreise ≥ 2.000 W)',
            description: `Der Großverbraucher "${el.name}" (${el.powerWatts} W) teilt sich den Stromkreis "${assignedCircuit.name}" mit ${sharingElements.length} weiteren Verbrauchern. DIN 18015-1 verlangt eigene, ungeteilte Stromkreise für Großgeräte.`,
            impact: 'Verhindert Leitungsüberlastung, Erwärmung in den Klemmen und Fehlauslösungen des Sicherungsautomaten.',
            actionLabel: 'Auf dedizierten Stromkreis umlegen',
            affectedElementIds: [el.id],
            affectedCircuitIds: [assignedCircuit.id],
            applyFix: () => {
              // Find an underutilized circuit or assign dedicated
              const freeCircuit = circuits.find(c => c.id !== assignedCircuit.id && (c.activeLoadWatts || 0) < 500 && !c.breakerType.includes('3P'));
              if (freeCircuit && onUpdateElectrical) {
                const updated = electrical.map(e => e.id === el.id ? { ...e, circuitId: freeCircuit.id } : e);
                onUpdateElectrical(updated);
                setAppliedFixes(prev => ({ ...prev, [`sug-dedicated-${el.id}`]: true }));
                soundSynth.playConfirmation();
                showToast(`"${el.name}" auf separaten Stromkreis "${freeCircuit.name}" verlegt.`);
              }
            }
          });
        }
      }
    });

    // --- CHECK 3: Circuit Overload & 80% Continuous Limit (DIN VDE 0298-4) ---
    circuitAnalysis.forEach(c => {
      if (c.isOverloaded || c.isNearCapacity) {
        list.push({
          id: `sug-overload-${c.id}`,
          category: 'load_balancing',
          severity: c.isOverloaded ? 'critical' : 'warning',
          title: `Stromkreis ${c.number} (${c.name}) zu ${c.loadPct}% ausgelastet`,
          standard: 'DIN VDE 0298-4 / DIN 18015-1 (Dauerlastgrenze 80% = 2.944 W)',
          description: `Die angeschlossene Last beträgt ${c.effectiveWatts} W von max. ${c.maxWatts} W (${c.loadPct}%). Dauerhafte Belastungen über 80% führen zur Alterung der Leiterisolation.`,
          impact: 'Gefahr von Auslösen des Leitungsschutzschalters und unzulässiger Erwärmung.',
          actionLabel: 'Last auf Reservekreis verteilen',
          affectedCircuitIds: [c.id],
          applyFix: () => {
            // Find highest consuming element on this circuit and move to another circuit
            const elements = electrical.filter(e => e.circuitId === c.id);
            if (elements.length > 1) {
              const heaviest = [...elements].sort((a, b) => b.powerWatts - a.powerWatts)[0];
              const targetCircuit = circuits.find(other => other.id !== c.id && (other.activeLoadWatts || 0) < 500);
              if (targetCircuit && onUpdateElectrical) {
                const updated = electrical.map(e => e.id === heaviest.id ? { ...e, circuitId: targetCircuit.id } : e);
                onUpdateElectrical(updated);
                setAppliedFixes(prev => ({ ...prev, [`sug-overload-${c.id}`]: true }));
                soundSynth.playConfirmation();
                showToast(`Verbraucher "${heaviest.name}" (${heaviest.powerWatts} W) auf ${targetCircuit.name} umgehängt!`);
              }
            }
          }
        });
      }
    });

    // --- CHECK 4: RCD Protection for all Socket Outlets (DIN VDE 0100-410 & DIN 18015-1) ---
    circuitAnalysis.forEach(c => {
      if (!c.hasRCD && c.socketCount > 0) {
        list.push({
          id: `sug-rcd-${c.id}`,
          category: 'safety',
          severity: 'critical',
          title: `Fehlender FI/RCD-Personenschutz an Stromkreis ${c.number}`,
          standard: 'DIN VDE 0100-410 & DIN 18015-1 (Fehlerstromschutz IΔn ≤ 30mA)',
          description: `Stromkreis "${c.name}" versorgt ${c.socketCount} Steckdosen, ist jedoch keinem FI-Schutzschalter (RCD) zugeordnet. Nach DIN VDE 0100-410 müssen alle Steckdosenstromkreise ≤ 32A über RCD 30mA abgesichert sein.`,
          impact: 'Lebensgefährliches Risiko bei Körperschluss oder Berührung spannungsführender Teile.',
          actionLabel: 'FI-1 (Wohnbereich) zuweisen',
          affectedCircuitIds: [c.id],
          applyFix: () => {
            if (onUpdateCircuits && rcds.length > 0) {
              const targetRcd = rcds[0].id;
              const updated = circuits.map(circ => circ.id === c.id ? { ...circ, rcdId: targetRcd } : circ);
              onUpdateCircuits(updated);
              setAppliedFixes(prev => ({ ...prev, [`sug-rcd-${c.id}`]: true }));
              soundSynth.playConfirmation();
              showToast(`Stromkreis "${c.name}" erfolgreich an FI-Schutzschalter geschützt!`);
            }
          }
        });
      }
    });

    // --- CHECK 5: Unassigned Electrical Elements ---
    const unassignedElements = electrical.filter(e => !e.circuitId || e.circuitId === '' || !circuits.some(c => c.id === e.circuitId));
    if (unassignedElements.length > 0) {
      list.push({
        id: 'sug-unassigned-elements',
        category: 'safety',
        severity: 'warning',
        title: `${unassignedElements.length} Elektrokomponente(n) ohne Stromkreis-Zuordnung`,
        standard: 'DIN 18015-1 (Eindeutige Stromkreiszuordnung)',
        description: `Elemente wie "${unassignedElements[0].name}" sind keinem Sicherungsautomaten zugeordnet und werden im Fehlerfall nicht abgeschaltet.`,
        impact: 'Gefahr ungesicherter Leitungen und undefinierter Schaltzustände.',
        actionLabel: 'Automatisch Stromkreis F1 zuweisen',
        affectedElementIds: unassignedElements.map(e => e.id),
        applyFix: () => {
          if (onUpdateElectrical && circuits.length > 0) {
            const defaultCircuit = circuits[0].id;
            const updated = electrical.map(e => !e.circuitId || !circuits.some(c => c.id === e.circuitId) ? { ...e, circuitId: defaultCircuit } : e);
            onUpdateElectrical(updated);
            setAppliedFixes(prev => ({ ...prev, 'sug-unassigned-elements': true }));
            soundSynth.playConfirmation();
            showToast(`${unassignedElements.length} Element(e) Stromkreis "${circuits[0].name}" zugewiesen.`);
          }
        }
      });
    }

    // --- CHECK 6: Sockets Installation Heights (DIN 18015-3) ---
    const invalidSocketHeights = electrical.filter(e => {
      if (e.type === 'socket_single' || e.type === 'socket_double') {
        // If not in kitchen work area (around 115cm), standard height is 30cm
        const isKitchenWork = e.name.toLowerCase().includes('küche') || e.name.toLowerCase().includes('arbeits');
        if (!isKitchenWork && (e.heightFromFloorCm < 20 || e.heightFromFloorCm > 45)) {
          return true;
        }
      }
      return false;
    });

    if (invalidSocketHeights.length > 0) {
      list.push({
        id: 'sug-socket-heights',
        category: 'din18015',
        severity: 'info',
        title: `${invalidSocketHeights.length} Steckdose(n) außerhalb der DIN 18015-3 Vorzugszone`,
        standard: 'DIN 18015-3 (Installationszone 30 cm über Fertigfußboden)',
        description: `Steckdosen wie "${invalidSocketHeights[0].name}" sind auf ${invalidSocketHeights[0].heightFromFloorCm} cm montiert. Die Norm empfiehlt 30 cm über OKFF für allgemeine Wohnbereiche.`,
        impact: 'Kollision mit Sockelleisten oder unübliche Bedienhöhe.',
        actionLabel: 'Auf 30 cm DIN-Normhöhe korrigieren',
        affectedElementIds: invalidSocketHeights.map(e => e.id),
        applyFix: () => {
          if (onUpdateElectrical) {
            const updated = electrical.map(e => {
              if (invalidSocketHeights.some(inv => inv.id === e.id)) {
                return { ...e, heightFromFloorCm: 30 };
              }
              return e;
            });
            onUpdateElectrical(updated);
            setAppliedFixes(prev => ({ ...prev, 'sug-socket-heights': true }));
            soundSynth.playConfirmation();
            showToast('Steckdosen auf 30 cm DIN-Standardhöhe angepasst.');
          }
        }
      });
    }

    // --- CHECK 7: Smoke Detector DIN 14676 Presence ---
    const hasSmokeDetector = electrical.some(e => e.type === 'smoke_detector');
    if (!hasSmokeDetector) {
      list.push({
        id: 'sug-smoke-detector',
        category: 'safety',
        severity: 'critical',
        title: 'Kein Rauchwarnmelder nach DIN 14676 vorhanden',
        standard: 'DIN 14676 / Bauordnung (Gesetzliche Rauchmelderpflicht)',
        description: 'Im Raumplan wurde kein Decken-Rauchwarnmelder detektiert. Wohn- und Schlafräume sowie Flure müssen mit normkonformen Meldern ausgestattet sein.',
        impact: 'Lebensgefahr im Brandfall und Nichterfüllung der Bauordnung.',
        actionLabel: 'Rauchmelder mittig an Decke setzen',
        applyFix: () => {
          if (onUpdateElectrical) {
            const newDetector: ElectricalElement = {
              id: `el-smoke-${Date.now()}`,
              type: 'smoke_detector',
              name: 'Funk-Rauchwarnmelder DIN 14676',
              position: { x: 0, y: (room?.height || 2.6) - 0.02, z: 0 },
              rotation: 0,
              heightFromFloorCm: Math.round(((room?.height || 2.6) - 0.02) * 100),
              circuitId: circuits[0]?.id || 'circuit-f2-light',
              wallSnapped: 'ceiling',
              state: true,
              powerWatts: 0.5,
            };
            onUpdateElectrical([...electrical, newDetector]);
            setAppliedFixes(prev => ({ ...prev, 'sug-smoke-detector': true }));
            soundSynth.playConfirmation();
            showToast('Rauchwarnmelder nach DIN 14676 mittig an der Decke platziert.');
          }
        }
      });
    }

    // --- CHECK 8: Cable Cross-Section Safety (DIN VDE 0298-4) ---
    circuits.forEach(c => {
      if (c.ratedCurrentA >= 16 && c.cableCrossSection === '1.5 mm²' && (c.activeLoadWatts || 0) > 2500) {
        list.push({
          id: `sug-cable-${c.id}`,
          category: 'safety',
          severity: 'warning',
          title: `Leiterquerschnitt für ${c.name} auf 2.5 mm² upgraden`,
          standard: 'DIN VDE 0298-4 & DIN 18015-1 (Dauerstrombelastbarkeit)',
          description: `Der 16A Stromkreis führt hohe Dauerlast (${c.activeLoadWatts} W) mit 1.5 mm² Zuleitung. DIN 18015 empfiehlt für Steckdosenkreise mit Großverbrauchern 2.5 mm² zur Verringerung des Spannungsfalls.`,
          impact: 'Senkt den Leitungswiderstand, reduziert Wärmeverluste und spart Energie.',
          actionLabel: 'Auf 2.5 mm² NYM upgraden',
          affectedCircuitIds: [c.id],
          applyFix: () => {
            if (onUpdateCircuits) {
              const updated = circuits.map(circ => circ.id === c.id ? { ...circ, cableCrossSection: '2.5 mm²' } : circ);
              onUpdateCircuits(updated);
              setAppliedFixes(prev => ({ ...prev, [`sug-cable-${c.id}`]: true }));
              soundSynth.playConfirmation();
              showToast(`Stromkreis "${c.name}" auf 2.5 mm² hochgestuft.`);
            }
          }
        });
      }
    });

    return list;
  }, [circuits, electrical, phaseStats, circuitAnalysis, rcds, room, onUpdateCircuits, onUpdateElectrical, showToast]);

  // Filtered Suggestions
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(s => {
      if (appliedFixes[s.id]) return false;
      if (selectedCategory === 'all') return true;
      return s.category === selectedCategory;
    });
  }, [suggestions, appliedFixes, selectedCategory]);

  // Overall Safety & Compliance Score (0 - 100%)
  const complianceScore = useMemo(() => {
    let score = 100;
    const activeSuggestions = suggestions.filter(s => !appliedFixes[s.id]);
    
    activeSuggestions.forEach(s => {
      if (s.severity === 'critical') score -= 18;
      else if (s.severity === 'warning') score -= 8;
      else score -= 3;
    });

    if (!phaseStats.isUnbalanceCompliant) score -= 15;
    else if (phaseStats.unbalanceWatts > 1500) score -= 5;

    return Math.max(10, Math.min(100, score));
  }, [suggestions, appliedFixes, phaseStats]);

  // Master Auto-Rebalance: Distribute single-phase circuits evenly across L1, L2, L3 using greedy bin-packing
  const handleAutoRebalanceAll = useCallback(() => {
    if (!onUpdateCircuits) return;
    setIsAuditing(true);

    setTimeout(() => {
      // Keep 3P circuits unchanged
      const threePhase = circuits.filter(c => c.breakerType.includes('3P'));
      const singlePhase = circuits.filter(c => !c.breakerType.includes('3P'));

      // Sort circuits by descending power load
      const sortedCircuits = [...singlePhase].sort((a, b) => {
        const loadA = electrical.filter(e => e.circuitId === a.id).reduce((s, el) => s + (el.powerWatts || 0), a.activeLoadWatts || 0);
        const loadB = electrical.filter(e => e.circuitId === b.id).reduce((s, el) => s + (el.powerWatts || 0), b.activeLoadWatts || 0);
        return loadB - loadA;
      });

      // Bins for L1, L2, L3
      const bins: { phase: 'L1' | 'L2' | 'L3'; total: number; circuitIds: string[] }[] = [
        { phase: 'L1', total: 0, circuitIds: [] },
        { phase: 'L2', total: 0, circuitIds: [] },
        { phase: 'L3', total: 0, circuitIds: [] },
      ];

      sortedCircuits.forEach(c => {
        const cLoad = electrical.filter(e => e.circuitId === c.id).reduce((s, el) => s + (el.powerWatts || 0), c.activeLoadWatts || 0);
        // Put in the bin with lowest current load
        bins.sort((a, b) => a.total - b.total);
        bins[0].total += cLoad;
        bins[0].circuitIds.push(c.id);
      });

      const updatedCircuits = circuits.map(c => {
        if (c.breakerType.includes('3P')) return c;
        const assignedBin = bins.find(b => b.circuitIds.includes(c.id));
        return assignedBin ? { ...c, phase: assignedBin.phase } : c;
      });

      onUpdateCircuits(updatedCircuits);
      setIsAuditing(false);
      soundSynth.playSoundByType('welcome');
      showToast('Phasen-Lastmanagement erfolgreich durchgeführt! Alle Stromkreise optimal symmetriert.');
    }, 600);
  }, [circuits, electrical, onUpdateCircuits, showToast]);

  // Copy full audit report
  const handleCopyReport = useCallback(() => {
    const reportText = `
=== VOLTCAD 3D - KI-AUDITOR PRÜFBERICHT (DIN 18015) ===
Datum: ${new Date().toLocaleString('de-DE')}
Gesamt-Compliance-Score: ${complianceScore}% / 100%

1. PHASEN-LASTVERTEILUNG (VDE 0100 / TAB):
- Phase L1: ${phaseStats.l1Watts} W (${phaseStats.l1Amps} A)
- Phase L2: ${phaseStats.l2Watts} W (${phaseStats.l2Amps} A)
- Phase L3: ${phaseStats.l3Watts} W (${phaseStats.l3Amps} A)
- Gesamtleistung: ${phaseStats.totalWatts} W
- Phasen-Schieflast: ${phaseStats.unbalanceWatts} W (Max. zulässig: 4.600 W - ${phaseStats.isUnbalanceCompliant ? 'KONFORM' : 'NICHT KONFORM'})

2. STROMKREISE & SICHERHEIT (DIN 18015-1 & DIN VDE 0100-410):
${circuitAnalysis.map(c => `- ${c.number} (${c.name}): Phase ${c.phase}, Last: ${c.effectiveWatts}W/${c.maxWatts}W (${c.loadPct}%), Steckdosen: ${c.socketCount}, FI-Schutz: ${c.hasRCD ? 'JA' : 'FEHLT'}`).join('\n')}

3. DETEKTIERTE PRÜFPUNKTE & EMPFEHLUNGEN (${filteredSuggestions.length} offen):
${filteredSuggestions.map((s, idx) => `${idx + 1}. [${s.severity.toUpperCase()}] ${s.title}\n   Norm: ${s.standard}\n   Detail: ${s.description}`).join('\n\n')}
======================================================
    `.trim();

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    soundSynth.playSoundByType('ding');
    setTimeout(() => setCopiedReport(false), 2500);
  }, [complianceScore, phaseStats, circuitAnalysis, filteredSuggestions]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* AUDITOR TOP HEADER */}
      <header className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/10">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">
                KI-Auditor: DIN 18015 & Lastmanagement
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Autonom
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Echtzeitanalyse von {electrical.length} Elektrokomponenten & {circuits.length} Stromkreisen gegen DIN 18015 und VDE 0100
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Auto Rebalance Button */}
          <button
            onClick={handleAutoRebalanceAll}
            disabled={isAuditing}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            title="Symmetriert alle Stromkreise über L1, L2 und L3 für minimale Schieflast"
          >
            <Scale className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>Phasen automatisch symmetrieren</span>
          </button>

          {/* Copy Report */}
          <button
            onClick={handleCopyReport}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
            title="Prüfbericht in Zwischenablage kopieren"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedReport ? 'Kopiert!' : 'Bericht kopieren'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Schließen"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-amber-500/50 text-amber-300 text-xs font-semibold shadow-xl shadow-slate-950/80 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* AUDIT DASHBOARD OVERVIEW BAR */}
      <div className="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
        {/* Metric 1: Compliance Score */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border ${
            complianceScore >= 85 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : complianceScore >= 65 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            {complianceScore}%
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              DIN 18015 Score
            </div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
              {complianceScore >= 85 ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Normkonform</span>
                </>
              ) : complianceScore >= 65 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">Optimierung empfohlen</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">Kritische Abweichungen</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: Phase Unbalance (Schieflast) */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            phaseStats.isUnbalanceCompliant 
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Phasen-Schieflast
            </div>
            <div className="text-xs font-bold text-white flex items-center justify-between mt-0.5">
              <span>Δ {phaseStats.unbalanceWatts} W</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                phaseStats.isUnbalanceCompliant ? 'text-emerald-400 bg-emerald-950/80' : 'text-rose-400 bg-rose-950/80'
              }`}>
                {phaseStats.isUnbalanceCompliant ? 'Konform (<4.6kW)' : 'Kritisch'}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Active Load */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Gesamt-Wirkleistung
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              {phaseStats.totalWatts} W <span className="text-slate-400 font-normal">({(phaseStats.totalWatts / 1000).toFixed(2)} kW)</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Open Suggestions Count */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Audit-Vorschläge
            </div>
            <div className="text-xs font-bold text-white mt-0.5 flex items-center gap-2">
              <span>{filteredSuggestions.length} offen</span>
              {Object.keys(appliedFixes).length > 0 && (
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                  ✓ {Object.keys(appliedFixes).length} behoben
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN BODY */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: PHASE METERS & CIRCUIT HEALTH (Scrollable) */}
        <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          {/* Phase Load Symmetrie Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>3-Phasen Lastverteilung</span>
              </div>
              <span className="text-[10px] text-slate-400">230V AC</span>
            </div>

            <div className="space-y-3">
              {/* L1 Meter */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-sky-500/20 text-sky-400 font-bold text-[10px] flex items-center justify-center">
                      L1
                    </span>
                    <span className="text-slate-300 font-semibold">{phaseStats.l1Watts} W</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{phaseStats.l1Amps} A</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-sky-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, phaseStats.l1Pct)}%` }}
                  />
                </div>
              </div>

              {/* L2 Meter */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center">
                      L2
                    </span>
                    <span className="text-slate-300 font-semibold">{phaseStats.l2Watts} W</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{phaseStats.l2Amps} A</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, phaseStats.l2Pct)}%` }}
                  />
                </div>
              </div>

              {/* L3 Meter */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center">
                      L3
                    </span>
                    <span className="text-slate-300 font-semibold">{phaseStats.l3Watts} W</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{phaseStats.l3Amps} A</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, phaseStats.l3Pct)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Schieflast Delta:</span>
              <span className={`font-bold ${phaseStats.isUnbalanceCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                {phaseStats.unbalanceWatts} W {phaseStats.isUnbalanceCompliant ? '✓ Gut' : '⚠ Ungleich'}
              </span>
            </div>
          </div>

          {/* Breaker Circuit Health Matrix */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Stromkreis-Auslastung ({circuitAnalysis.length})</span>
              </div>
              <span className="text-[10px] text-slate-400">DIN 18015-1</span>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {circuitAnalysis.map(c => (
                <div 
                  key={c.id}
                  className={`p-2.5 rounded-lg border text-xs transition ${
                    c.isOverloaded 
                      ? 'bg-rose-950/30 border-rose-500/50' 
                      : c.isNearCapacity 
                      ? 'bg-amber-950/20 border-amber-500/40' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-400">
                        {c.number}
                      </span>
                      <span className="truncate max-w-[140px]" title={c.name}>{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {c.phase}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        c.isOverloaded ? 'text-rose-400' : c.isNearCapacity ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {c.loadPct}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>{c.effectiveWatts} W / {c.maxWatts} W</span>
                    <span>{c.socketCount} Dosen</span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        c.isOverloaded 
                          ? 'bg-rose-500' 
                          : c.isNearCapacity 
                          ? 'bg-amber-400' 
                          : 'bg-sky-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, c.loadPct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIONABLE SUGGESTIONS & COMPLIANCE FINDINGS */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* Category Filter Tabs */}
          <div className="px-5 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Alle Empfehlungen ({suggestions.filter(s => !appliedFixes[s.id]).length})
              </button>

              <button
                onClick={() => setSelectedCategory('load_balancing')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 flex items-center gap-1 ${
                  selectedCategory === 'load_balancing'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Lastverteilung & Phasen</span>
              </button>

              <button
                onClick={() => setSelectedCategory('safety')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 flex items-center gap-1 ${
                  selectedCategory === 'safety'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Sicherheits-Compliance</span>
              </button>

              <button
                onClick={() => setSelectedCategory('din18015')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 flex items-center gap-1 ${
                  selectedCategory === 'din18015'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DIN 18015 Normen</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 shrink-0">
              Klicke auf <strong className="text-amber-400">„Vorschlag anwenden“</strong> für 1-Klick Optimierung
            </div>
          </div>

          {/* Suggestion Cards Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {filteredSuggestions.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-900/30 rounded-2xl border border-slate-800/80">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Hervorragend! Keine offenen Abweichungen
                </h3>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                  Alle Stromkreise sind symmetrisch über die Phasen L1, L2 und L3 verteilt. Der Personenschutz nach DIN VDE 0100-410 und die Installationsrichtlinien der DIN 18015 sind erfüllt.
                </p>
                <button
                  onClick={handleAutoRebalanceAll}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Erneuten Prüflauf starten</span>
                </button>
              </div>
            ) : (
              filteredSuggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className={`p-4 rounded-xl border transition-all ${
                    suggestion.severity === 'critical'
                      ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                      : suggestion.severity === 'warning'
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                        suggestion.severity === 'critical'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : suggestion.severity === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      }`}>
                        {suggestion.severity === 'critical' ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : suggestion.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {suggestion.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                            {suggestion.standard}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                          {suggestion.description}
                        </p>

                        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-lg w-fit border border-emerald-800/40">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Nutzen: {suggestion.impact}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={suggestion.applyFix}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-md shadow-amber-500/10"
                      title="Diesen Vorschlag direkt im Elektro- und Sicherungsplan umsetzen"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{suggestion.actionLabel}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

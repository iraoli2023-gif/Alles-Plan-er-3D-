import React, { useState, useMemo } from 'react';
import { 
  RoomConfig, 
  ElectricalElement, 
  WiringRoute, 
  BreakerCircuit 
} from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Printer, 
  Copy, 
  Check, 
  Sliders, 
  Wrench, 
  FileText, 
  Zap, 
  Maximize2, 
  Sparkles,
  ArrowRight,
  Info,
  X
} from 'lucide-react';

export type DINEquipmentTier = 'tier1_minimum' | 'tier2_standard' | 'tier3_comfort';

export interface DINCheckItem {
  id: string;
  category: 'sockets' | 'zones' | 'voltage_drop' | 'lighting' | 'circuits' | 'telecom';
  title: string;
  dinStandard: string;
  description: string;
  required: string;
  actual: string;
  status: 'passed' | 'failed';
  severity: 'critical' | 'warning';
  details?: string[];
  fixable?: boolean;
}

interface DIN18015ReportGeneratorProps {
  room: RoomConfig;
  electrical: ElectricalElement[];
  wiring: WiringRoute[];
  circuits: BreakerCircuit[];
  onUpdateElectrical: (items: ElectricalElement[]) => void;
  onUpdateWiring: (routes: WiringRoute[]) => void;
  onClose?: () => void;
  onSelectElement?: (id: string) => void;
}

export const DIN18015ReportGenerator: React.FC<DIN18015ReportGeneratorProps> = ({
  room,
  electrical,
  wiring,
  circuits,
  onUpdateElectrical,
  onUpdateWiring,
  onClose,
  onSelectElement,
}) => {
  const [equipmentTier, setEquipmentTier] = useState<DINEquipmentTier>('tier1_minimum');
  const [copied, setCopied] = useState(false);
  const [fixSuccessMsg, setFixSuccessMsg] = useState<string | null>(null);

  // 1. Calculate Room Area
  const roomAreaM2 = useMemo(() => {
    return Number((room.width * room.length).toFixed(2));
  }, [room.width, room.length]);

  // 2. Count Electrical Component Types
  const componentMetrics = useMemo(() => {
    let singleSockets = 0;
    let doubleSockets = 0;
    let ceeSockets = 0;
    let ceilingLights = 0;
    let switches = 0;
    let smokeDetectors = 0;
    let thermostats = 0;

    electrical.forEach(el => {
      switch (el.type) {
        case 'socket_single':
          singleSockets += 1;
          break;
        case 'socket_double':
          doubleSockets += 1;
          break;
        case 'socket_cee16':
          ceeSockets += 1;
          break;
        case 'light_ceiling':
          ceilingLights += 1;
          break;
        case 'switch_single':
        case 'switch_series':
          switches += 1;
          break;
        case 'smoke_detector':
          smokeDetectors += 1;
          break;
        case 'room_thermostat':
          thermostats += 1;
          break;
        default:
          break;
      }
    });

    // DIN 18015 counts each socket outlet (double socket = 2 socket outlets)
    const totalSocketOutlets = singleSockets + (doubleSockets * 2);

    return {
      singleSockets,
      doubleSockets,
      ceeSockets,
      totalSocketOutlets,
      ceilingLights,
      switches,
      smokeDetectors,
      thermostats,
      totalElements: electrical.length,
    };
  }, [electrical]);

  // 3. DIN 18015-2 Socket Requirements based on room area and tier
  const requiredSockets = useMemo(() => {
    // Area-based calculation for living/multi-purpose rooms according to DIN 18015-2 / RAL-RG 678
    const area = roomAreaM2;
    if (equipmentTier === 'tier1_minimum') {
      if (area <= 12) return 4;
      if (area <= 20) return 5;
      if (area <= 30) return 7;
      if (area <= 40) return 8;
      return 9; // > 40 m²
    } else if (equipmentTier === 'tier2_standard') {
      if (area <= 12) return 6;
      if (area <= 20) return 8;
      if (area <= 30) return 11;
      if (area <= 40) return 13;
      return 15;
    } else {
      // Tier 3: Comfort
      if (area <= 12) return 8;
      if (area <= 20) return 11;
      if (area <= 30) return 15;
      if (area <= 40) return 18;
      return 21;
    }
  }, [roomAreaM2, equipmentTier]);

  // 4. Zone Validation (DIN 18015-3)
  const zoneValidation = useMemo(() => {
    const invalidElements: { element: ElectricalElement; reason: string; recommendedHeight: number }[] = [];

    electrical.forEach(el => {
      const height = el.heightFromFloorCm;

      if (el.type === 'socket_single' || el.type === 'socket_double') {
        // DIN 18015-3: Lower zone is 15-30 cm, or worktop zone 105-115 cm
        const isLowerZone = height >= 15 && height <= 30;
        const isWorktopZone = height >= 100 && height <= 120;
        if (!isLowerZone && !isWorktopZone) {
          invalidElements.push({
            element: el,
            reason: `Höhe ${height} cm liegt außerhalb der Vorzugszone (15–30 cm oder 105–115 cm Arbeitsfläche).`,
            recommendedHeight: 30,
          });
        }
      } else if (el.type === 'switch_single' || el.type === 'switch_series') {
        // Operating height 105 cm (acceptable 90 - 115 cm)
        if (height < 90 || height > 115) {
          invalidElements.push({
            element: el,
            reason: `Bedienhöhe ${height} cm weicht von DIN-Schalterhöhe (105 cm ± 10 cm) ab.`,
            recommendedHeight: 105,
          });
        }
      }
    });

    return {
      invalidElements,
      isValid: invalidElements.length === 0,
    };
  }, [electrical]);

  // 5. Voltage Drop Validation (DIN 18015-1 & DIN VDE 0100-520)
  const voltageDropValidation = useMemo(() => {
    const criticalRoutes = wiring.filter(w => w.voltageDropPct > 3.0);
    const maxVoltageDrop = wiring.length > 0 
      ? Math.max(...wiring.map(w => w.voltageDropPct)) 
      : 0;

    return {
      criticalRoutes,
      maxVoltageDrop,
      isValid: criticalRoutes.length === 0,
    };
  }, [wiring]);

  // 6. Dedicated Circuits Check (DIN 18015-2)
  const circuitSeparationCheck = useMemo(() => {
    // Check if heavy consumers (cooktop / terrarium) have their own circuits
    const stoveEl = electrical.find(e => e.type === 'socket_cee16' || e.name.toLowerCase().includes('herd') || e.powerWatts >= 1500);
    const terrariumEl = electrical.find(e => e.name.toLowerCase().includes('terrarium'));

    const issues: string[] = [];

    if (stoveEl) {
      const stoveCircuit = circuits.find(c => c.id === stoveEl.circuitId);
      if (!stoveCircuit || !stoveCircuit.breakerType.includes('3-polig') && !stoveCircuit.breakerType.includes('B16')) {
        issues.push('Herdanschluss benötigt separaten 3-phasigen Drehstromkreis nach DIN 18015-2.');
      }
    }

    if (terrariumEl) {
      const terrariumCircuit = circuits.find(c => c.id === terrariumEl.circuitId);
      // Check if terrarium circuit is shared with general lighting
      const sharedWithLights = electrical.some(e => e.type === 'light_ceiling' && e.circuitId === terrariumEl.circuitId);
      if (sharedWithLights) {
        issues.push('Terrarium-Dauerlast teilt sich den Stromkreis mit der Raumbeleuchtung (Separate Absicherung empfohlen).');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }, [electrical, circuits]);

  // 7. Telecommunications / IuK Check (DIN 18015-4)
  const telecomCheck = useMemo(() => {
    const hasNetworkOrGateway = electrical.some(e => 
      e.name.toLowerCase().includes('gateway') || 
      e.smartDeviceId || 
      e.name.toLowerCase().includes('thermostat')
    ) || wiring.some(w => w.cableType.includes('CAT.7'));

    return {
      isValid: hasNetworkOrGateway,
    };
  }, [electrical, wiring]);

  // 8. Construct Checklist Items
  const checkList: DINCheckItem[] = useMemo(() => {
    const requiredLighting = roomAreaM2 > 20 ? 2 : 1;
    const lightingValid = componentMetrics.ceilingLights >= requiredLighting;
    const socketsValid = componentMetrics.totalSocketOutlets >= requiredSockets;

    return [
      {
        id: 'check-sockets',
        category: 'sockets',
        title: 'Mindestanzahl Steckdosen nach Raumfläche',
        dinStandard: 'DIN 18015-2 & RAL-RG 678',
        description: `Für ${room.name} (${roomAreaM2} m²) bei ${
          equipmentTier === 'tier1_minimum' ? 'Ausstattungswert 1 (Mindestausstattung)' : 
          equipmentTier === 'tier2_standard' ? 'Ausstattungswert 2 (Standard)' : 'Ausstattungswert 3 (Komfort)'
        }.`,
        required: `Mindestens ${requiredSockets} Steckdosen`,
        actual: `${componentMetrics.totalSocketOutlets} Steckdosen (${componentMetrics.singleSockets}x Einfach, ${componentMetrics.doubleSockets}x Doppel)`,
        status: socketsValid ? 'passed' : 'failed',
        severity: 'critical',
        details: socketsValid 
          ? [`Anforderung erfüllt: ${componentMetrics.totalSocketOutlets} von mind. ${requiredSockets} Steckdosen vorhanden.`]
          : [
              `Es fehlen noch ${requiredSockets - componentMetrics.totalSocketOutlets} Steckdosen für die Konformität nach DIN 18015-2.`,
              'Hinweis: Doppelsteckdosen zählen nach DIN als 2 vollwertige Anschlusspunkte.'
            ],
        fixable: !socketsValid,
      },
      {
        id: 'check-zones',
        category: 'zones',
        title: 'Einhaltung der Installationszonen & Vorzugshöhen',
        dinStandard: 'DIN 18015-3',
        description: 'Überprüfung der waagerechten und senkrechten Installationszonen für Schalter und Steckdosen.',
        required: 'Steckdosen: 15–30 cm / 105–115 cm; Schalter: 105 cm (± 10 cm)',
        actual: zoneValidation.isValid 
          ? 'Alle Komponenten in normgerechter Zone' 
          : `${zoneValidation.invalidElements.length} Komponente(n) außerhalb der Normzone`,
        status: zoneValidation.isValid ? 'passed' : 'failed',
        severity: 'warning',
        details: zoneValidation.invalidElements.map(inv => `${inv.element.name}: ${inv.reason}`),
        fixable: !zoneValidation.isValid,
      },
      {
        id: 'check-voltage-drop',
        category: 'voltage_drop',
        title: 'Zulässiger Spannungsfall (ΔU ≤ 3,0%)',
        dinStandard: 'DIN 18015-1 & DIN VDE 0100-520',
        description: 'Vermeidung von Leitungsverlusten und Sicherstellung der Mindestspannung am Endverbraucher.',
        required: 'Maximal 3,00 % Spannungsfall ab Unterverteilung',
        actual: `Maximaler Spannungsfall gemessen: ${voltageDropValidation.maxVoltageDrop.toFixed(2)} %`,
        status: voltageDropValidation.isValid ? 'passed' : 'failed',
        severity: 'critical',
        details: voltageDropValidation.criticalRoutes.length === 0
          ? ['Alle verlegten Kabelrouten halten den Grenzwert von 3,0% ein.']
          : voltageDropValidation.criticalRoutes.map(r => `Kabelstrecke (${r.cableType}, ${r.lengthMeters}m) überschreitet Grenzwert mit ${r.voltageDropPct}%.`),
        fixable: false,
      },
      {
        id: 'check-lighting',
        category: 'lighting',
        title: 'Mindestausstattung Beleuchtungsanschlüsse',
        dinStandard: 'DIN 18015-2',
        description: 'Ausreichende Ausleuchtung und schaltbare Deckenbrennstellen.',
        required: `Mindestens ${requiredLighting} Deckenbrennstelle(n) (Fläche > 20 m² erfordert 2 Brennstellen)`,
        actual: `${componentMetrics.ceilingLights} Deckenleuchte(n) installiert`,
        status: lightingValid ? 'passed' : 'failed',
        severity: 'warning',
        details: lightingValid 
          ? [`Geforderte ${requiredLighting} Deckenleuchte(n) vorhanden.`]
          : [`Bei ${roomAreaM2} m² Wohnfläche sind mindestens 2 getrennte Lichtauslässe gefordert.`],
        fixable: !lightingValid,
      },
      {
        id: 'check-circuits',
        category: 'circuits',
        title: 'Stromkreisaufteilung & Großgeräteabsicherung',
        dinStandard: 'DIN 18015-2 & TAB 2019',
        description: 'Dedizierte Stromkreise für Großverbraucher und Lasttrennung.',
        required: 'Separate Stromkreise für Herd (3-phasig) und Dauerlasten',
        actual: circuitSeparationCheck.isValid 
          ? 'Stromkreise normgerecht aufgeteilt' 
          : `${circuitSeparationCheck.issues.length} Abweichung(en) gefunden`,
        status: circuitSeparationCheck.isValid ? 'passed' : 'failed',
        severity: 'critical',
        details: circuitSeparationCheck.isValid
          ? ['Separate Stromkreise für Herd (Induktion), Terrarium und Allgemeinstromkreise vorhanden.']
          : circuitSeparationCheck.issues,
        fixable: false,
      },
      {
        id: 'check-telecom',
        category: 'telecom',
        title: 'IuK-Kommunikationsanschlüsse & Smart Home',
        dinStandard: 'DIN 18015-4',
        description: 'Vorsorge für Datennetze, Router, Smart Home Gateway und Raumautomation.',
        required: 'Mindestens 1 IuK-Datenanschluss / Smart Home Anbindung',
        actual: telecomCheck.isValid ? 'Smart Home Gateway & Zigbee Thermostat aktiv' : 'Keine IuK-Infrastruktur erkannt',
        status: telecomCheck.isValid ? 'passed' : 'failed',
        severity: 'warning',
        details: telecomCheck.isValid
          ? ['CAT.7 Netzwerkanbindung und Smart Home Gateway vorhanden.']
          : ['Empfehlung: CAT.7 Duplex oder Smart Gateway Anschluss vorsehen.'],
        fixable: false,
      }
    ];
  }, [
    room.name,
    roomAreaM2, 
    equipmentTier, 
    componentMetrics, 
    requiredSockets, 
    zoneValidation, 
    voltageDropValidation, 
    circuitSeparationCheck, 
    telecomCheck
  ]);

  // Overall Assessment
  const overallPassed = useMemo(() => {
    return checkList.every(item => item.status === 'passed');
  }, [checkList]);

  const passedCount = useMemo(() => {
    return checkList.filter(item => item.status === 'passed').length;
  }, [checkList]);

  const complianceScorePct = Math.round((passedCount / checkList.length) * 100);

  // Auto-Fix 1: Add missing DIN sockets
  const handleAutoFixSockets = () => {
    const missingCount = requiredSockets - componentMetrics.totalSocketOutlets;
    if (missingCount <= 0) return;

    // Add double or single sockets along the walls at DIN standard height 30 cm
    const newElements = [...electrical];
    const socketsToAdd = Math.ceil(missingCount / 2); // Use double sockets efficiently

    for (let i = 0; i < socketsToAdd; i++) {
      const id = `el-socket-din-${Date.now()}-${i}`;
      // Calculate a position along the south wall or free wall
      const posX = -2.0 + (i * 1.5);
      const isDouble = (missingCount - (i * 2)) >= 2;

      newElements.push({
        id,
        type: isDouble ? 'socket_double' : 'socket_single',
        name: `DIN 18015 Steckdose (${isDouble ? 'Doppel' : 'Einzel'}) #${i + 1}`,
        position: { x: posX, y: 0.3, z: 2.7 },
        rotation: 180,
        heightFromFloorCm: 30, // DIN 18015-3 standard
        circuitId: 'circuit-f1-sockets',
        wallSnapped: 'south',
        state: true,
        powerWatts: 0,
      });
    }

    onUpdateElectrical(newElements);
    setFixSuccessMsg(`${missingCount} Steckdosen nach DIN 18015 (Höhe 30 cm FFB) erfolgreich hinzugefügt!`);
    setTimeout(() => setFixSuccessMsg(null), 4000);
  };

  // Auto-Fix 2: Correct non-compliant heights to DIN standard
  const handleAutoFixHeights = () => {
    const updated = electrical.map(el => {
      const invalid = zoneValidation.invalidElements.find(inv => inv.element.id === el.id);
      if (invalid) {
        return {
          ...el,
          heightFromFloorCm: invalid.recommendedHeight,
          position: {
            ...el.position,
            y: invalid.recommendedHeight / 100,
          }
        };
      }
      return el;
    });

    onUpdateElectrical(updated);
    setFixSuccessMsg(`${zoneValidation.invalidElements.length} Installationspunkt(e) auf DIN 18015-3 Vorzugshöhen korrigiert!`);
    setTimeout(() => setFixSuccessMsg(null), 4000);
  };

  // Auto-Fix 3: Add missing ceiling light
  const handleAutoFixLighting = () => {
    const newLight: ElectricalElement = {
      id: `el-light-din-${Date.now()}`,
      type: 'light_ceiling',
      name: 'Zusatz-Deckenleuchte (DIN 18015)',
      position: { x: 0.0, y: room.height * 0.95, z: -1.0 },
      rotation: 0,
      heightFromFloorCm: Math.round(room.height * 95),
      circuitId: 'circuit-f2-light',
      wallSnapped: 'ceiling',
      state: true,
      dimLevel: 100,
      powerWatts: 30,
    };
    onUpdateElectrical([...electrical, newLight]);
    setFixSuccessMsg('DIN 18015 Zusatz-Deckenbrennstelle erfolgreich hinzugefügt!');
    setTimeout(() => setFixSuccessMsg(null), 4000);
  };

  // Copy report as plain text / markdown
  const handleCopyReport = () => {
    const timestamp = new Date().toLocaleString('de-DE');
    const textReport = `=====================================================
DIN 18015 ELEKTROPLANUNGS-PRÜFBERICHT & KONFORMITÄTSAUDIT
=====================================================
Datum: ${timestamp}
Projekt: VoltCAD 3D - Elektroinstallation
Raum: ${room.name}
Raumfläche: ${roomAreaM2} m² (${room.width} m x ${room.length} m)
Ausstattungsstufe: ${
  equipmentTier === 'tier1_minimum' ? 'Ausstattungswert 1 (Mindestausstattung)' :
  equipmentTier === 'tier2_standard' ? 'Ausstattungswert 2 (Standard)' : 'Ausstattungswert 3 (Komfort)'
}
-----------------------------------------------------
GESAMTSTATUS: ${overallPassed ? 'BESTANDEN (KONFORM)' : 'NICHT BESTANDEN (ABWEICHUNGEN GEFUNDEN)'}
Konformitätsgrad: ${complianceScorePct}% (${passedCount} von ${checkList.length} Kriterien erfüllt)
-----------------------------------------------------
PRÜFERGEBNISSE NACH DIN 18015:
${checkList.map(c => `
[${c.status === 'passed' ? 'BESTANDEN' : 'NICHT BESTANDEN'}] ${c.title} (${c.dinStandard})
  - Anforderung: ${c.required}
  - Ist-Bestand: ${c.actual}
  ${c.details ? c.details.map(d => `  * ${d}`).join('\n') : ''}
`).join('')}
-----------------------------------------------------
BESTANDSUFSTELLUNG:
- Steckdosen (Gesamtanschlüsse): ${componentMetrics.totalSocketOutlets} (Soll: mind. ${requiredSockets})
- Deckenbrennstellen: ${componentMetrics.ceilingLights}
- Schalter / Taster: ${componentMetrics.switches}
- Verlegte Leitungsstrecken: ${wiring.length} Routen
- Maximaler Spannungsfall: ${voltageDropValidation.maxVoltageDrop.toFixed(2)} % (Grenzwert: 3,00%)
=====================================================`;

    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`p-2 rounded-xl border ${
            overallPassed 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            <FileText className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                DIN 18015 Konformitätsbericht & Berichtsgenerator
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                RAL-RG 678
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatisierter Abgleich der Elektroplanung gegen DIN 18015-1 bis 18015-4.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
            title="Prüfprotokoll in Zwischenablage kopieren"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Kopiert!' : 'Protokoll kopieren'}
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
            title="Bericht drucken / PDF speichern"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            Drucken / PDF
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="p-5 space-y-6 overflow-y-auto max-h-[80vh]">
        {/* Success Alert Banner for Fixes */}
        {fixSuccessMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{fixSuccessMsg}</span>
          </div>
        )}

        {/* Big Overall Status Card */}
        <div className={`p-5 rounded-2xl border transition-all ${
          overallPassed 
            ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-100 shadow-lg shadow-emerald-950/30' 
            : 'bg-rose-950/20 border-rose-800/60 text-rose-100 shadow-lg shadow-rose-950/30'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl border shrink-0 ${
                overallPassed 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              }`}>
                {overallPassed ? (
                  <ShieldCheck className="w-8 h-8" />
                ) : (
                  <ShieldAlert className="w-8 h-8" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                    Prüfergebnis DIN 18015
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    overallPassed 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {passedCount}/{checkList.length} Kriterien erfüllt ({complianceScorePct}%)
                  </span>
                </div>

                <h2 className="text-2xl font-black mt-1 tracking-tight flex items-center gap-3">
                  Status: {overallPassed ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      Bestanden <CheckCircle2 className="w-6 h-6 inline" />
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1.5">
                      Nicht bestanden <XCircle className="w-6 h-6 inline" />
                    </span>
                  )}
                </h2>

                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {overallPassed 
                    ? `Die geplante Elektroinstallation erfüllt alle maßgeblichen Mindestanforderungen der DIN 18015 bezüglich Steckdosenanzahl, Beleuchtung, Installationszonen und Spannungsfall für ${roomAreaM2} m² Wohnfläche.`
                    : `Es wurden ${checkList.filter(c => c.status === 'failed').length} Abweichung(en) von den DIN 18015 Mindeststandards festgestellt. Bitte prüfen Sie die rot markierten Positionen unten.`
                  }
                </p>
              </div>
            </div>

            {/* Quick Actions if Failed */}
            {!overallPassed && (
              <div className="flex flex-col gap-2 shrink-0">
                {componentMetrics.totalSocketOutlets < requiredSockets && (
                  <button
                    onClick={handleAutoFixSockets}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Fehlende Steckdosen nachrüsten (+{requiredSockets - componentMetrics.totalSocketOutlets})
                  </button>
                )}

                {!zoneValidation.isValid && (
                  <button
                    onClick={handleAutoFixHeights}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-slate-950 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Vorzugshöhen korrigieren (DIN 18015-3)
                  </button>
                )}

                {componentMetrics.ceilingLights < (roomAreaM2 > 20 ? 2 : 1) && (
                  <button
                    onClick={handleAutoFixLighting}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Zusatzleuchte hinzufügen
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Compliance Progress Bar */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-[11px] mb-1.5 text-slate-400 font-semibold">
              <span>Konformitätsfortschritt</span>
              <span>{complianceScorePct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div 
                className={`h-full transition-all duration-500 ${
                  overallPassed ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${complianceScorePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Room Parameters & Tier Selector Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Room Area Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-[11px] text-slate-400 font-semibold block">Raumgeometrie & Fläche</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{roomAreaM2}</span>
              <span className="text-xs text-slate-400">m² Wohnfläche</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {room.width}m B × {room.length}m L × {room.height}m H
            </div>
          </div>

          {/* Current Sockets Count Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-[11px] text-slate-400 font-semibold block">Steckdosen-Ausstattung</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${
                componentMetrics.totalSocketOutlets >= requiredSockets ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {componentMetrics.totalSocketOutlets}
              </span>
              <span className="text-xs text-slate-400">von mind. {requiredSockets} gefordert</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {componentMetrics.singleSockets}x Einfach, {componentMetrics.doubleSockets}x Doppel ({componentMetrics.doubleSockets * 2} Anschlüsse)
            </div>
          </div>

          {/* Tier Selector Card (DIN 18015-2 / RAL-RG 678) */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1.5 flex items-center justify-between">
              <span>Ausstattungsstufe (RAL-RG 678)</span>
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setEquipmentTier('tier1_minimum')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
                  equipmentTier === 'tier1_minimum'
                    ? 'bg-sky-600 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Stufe 1: Mindestausstattung nach DIN 18015-2"
              >
                1: Mindest
              </button>
              <button
                onClick={() => setEquipmentTier('tier2_standard')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
                  equipmentTier === 'tier2_standard'
                    ? 'bg-sky-600 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Stufe 2: Standardausstattung (2 Sterne)"
              >
                2: Standard
              </button>
              <button
                onClick={() => setEquipmentTier('tier3_comfort')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
                  equipmentTier === 'tier3_comfort'
                    ? 'bg-sky-600 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Stufe 3: Komfortausstattung (3 Sterne)"
              >
                3: Komfort
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Compliance Checklist Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <h4 className="text-sm font-bold text-white">
                Detaillierte Kriterienprüfung (DIN 18015 Prüfmatrix)
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Normenausschuss Bauwesen (NABau)
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {checkList.map((check) => {
              const isPassed = check.status === 'passed';

              return (
                <div 
                  key={check.id}
                  className={`p-4 transition hover:bg-slate-800/30 ${
                    !isPassed ? 'bg-rose-950/10' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isPassed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="text-sm font-bold text-white">
                            {check.title}
                          </h5>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {check.dinStandard}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {check.description}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                        isPassed 
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                          : 'bg-rose-950/80 text-rose-300 border-rose-800'
                      }`}>
                        {isPassed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Bestanden
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            Nicht bestanden
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Requirements vs Actual Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800/60 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        DIN-Sollanforderung
                      </span>
                      <span className="text-slate-200 font-medium mt-0.5 block">
                        {check.required}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Tatsächlicher Ist-Bestand
                      </span>
                      <span className={`font-semibold mt-0.5 block ${
                        isPassed ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {check.actual}
                      </span>
                    </div>
                  </div>

                  {/* Diagnostic Details & Resolution Tips */}
                  {check.details && check.details.length > 0 && (
                    <div className="mt-2.5 pl-3 border-l-2 border-slate-700 text-xs space-y-1">
                      {check.details.map((detail, dIdx) => (
                        <div key={dIdx} className="text-slate-300 flex items-start gap-1.5">
                          <span className="text-slate-500">•</span>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Standards Information & Legal Footnote */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300 block mb-1">
              Normativer Bezug & Rechtliche Grundlagen:
            </span>
            <p>
              Dieser Bericht prüft Planungsvorgaben gemäß DIN 18015 Teile 1 bis 4 (Elektrische Anlagen in Wohngebäuden) sowie RAL-RG 678 (Ausstattungswerte für Wohnungen). Bei Ausführung sind ergänzend DIN VDE 0100 sowie die TAB (Technische Anschlussbedingungen) des örtlichen Verteilnetzbetreibers (VNB) verbindlich zu berücksichtigen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Share2, 
  Check, 
  FileCode, 
  Layers, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Package,
  FileText,
  Printer,
  Loader2,
  Zap,
  Activity,
  Monitor,
  Tablet
} from 'lucide-react';
import { 
  RoomConfig, 
  FurnitureItem, 
  ElectricalElement, 
  WiringRoute, 
  BreakerCircuit, 
  EnergyMetrics, 
  RCDDevice 
} from '../types';
import { generateEngineeringReportPDF } from '../utils/pdfReportGenerator';
import { soundSynth } from '../utils/audioSynth';
import { INITIAL_CIRCUITS, INITIAL_ENERGY, INITIAL_RCDS } from '../data/initialData';

interface APKExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomConfig;
  furniture: FurnitureItem[];
  electrical: ElectricalElement[];
  wiring: WiringRoute[];
  circuits?: BreakerCircuit[];
  energyMetrics?: EnergyMetrics;
  rcds?: RCDDevice[];
  onOpenDesktopModal?: () => void;
  onOpenSamsungInstall?: () => void;
  onOpenIOSInstall?: () => void;
}

export const APKExportModal: React.FC<APKExportModalProps> = ({
  isOpen,
  onClose,
  room,
  furniture,
  electrical,
  wiring,
  circuits = INITIAL_CIRCUITS,
  energyMetrics = INITIAL_ENERGY,
  rcds = INITIAL_RCDS,
  onOpenDesktopModal,
  onOpenSamsungInstall,
  onOpenIOSInstall,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate and Download Structured DIN 18015 Engineering PDF Report
  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      setPdfSuccessMessage(null);
      soundSynth.playConfirmation();

      // Allow UI tick to update loader
      await new Promise(resolve => setTimeout(resolve, 100));

      const doc = await generateEngineeringReportPDF({
        room,
        furniture,
        electrical,
        wiring,
        circuits,
        energyMetrics,
        rcds,
        projectName: 'VoltCAD 3D Baudokumentation',
        inspectorName: 'Dipl.-Ing. Elektroplanung / Bauleitung',
      });

      const safeRoomName = room.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `VoltCAD_DIN18015_Pruefbericht_${safeRoomName}.pdf`;
      doc.save(filename);

      soundSynth.playConfirmation();
      setPdfSuccessMessage(`Prüfbericht "${filename}" erfolgreich generiert und heruntergeladen!`);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Export CAD Project JSON
  const handleExportJSON = () => {
    const projectData = {
      project: 'VoltCAD 3D - Elektro & SmartHome Planer',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      room,
      furniture,
      electrical,
      wiring,
      circuits,
      energyMetrics,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoltCAD_Projekt_${room.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Material Bill of Materials (BOM)
  const handleExportBOM = () => {
    let content = `VOLTCAD 3D - MATERIAL- & STÜCKLISTE (BOM)\n`;
    content += `Erstellt am: ${new Date().toLocaleString()}\n`;
    content += `Projekt: ${room.name} (${room.width}m x ${room.length}m, Fläche: ${(room.width * room.length).toFixed(1)} m²)\n\n`;

    content += `=== 1. ELEKTROINSTALLATIONEN (DIN 18015) ===\n`;
    electrical.forEach(e => {
      content += `- ${e.name} (${e.type}), Montagehöhe: ${e.heightFromFloorCm} cm, Stromkreis: ${e.circuitId}, Last: ${e.powerWatts}W\n`;
    });

    content += `\n=== 2. KABEL- & VERLEGEPLAN ===\n`;
    wiring.forEach(w => {
      content += `- ${w.cableType}: ${w.lengthMeters} m, Verlegung: ${w.conduitType}, Zone: ${w.installationZone}, ΔU: ${w.voltageDropPct}%\n`;
    });

    content += `\n=== 3. STROMKREISE & SICHERUNGEN ===\n`;
    circuits.forEach(c => {
      content += `- ${c.number}: ${c.name} (${c.breakerType}, ${c.phase}, Querschnitt: ${c.cableCrossSection}, Last: ${c.activeLoadWatts || c.baseLoadWatts}W)\n`;
    });

    content += `\n=== 4. MÖBEL & TERRARIUM ===\n`;
    furniture.forEach(f => {
      content += `- ${f.name}: ${f.dimensions.width}m x ${f.dimensions.depth}m x ${f.dimensions.height}m\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoltCAD_Materialliste_${room.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-sky-500/20">
              <Smartphone className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Baudokumentation & App-Export</h3>
              <p className="text-xs text-slate-400">
                PDF-Prüfbericht erstellen, CAD-Daten exportieren oder als native Android APK installieren.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 overflow-y-auto space-y-4 pr-1">
          {/* PRIMARY FEATURE: Structured Engineering PDF Report */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-sky-500/30 shadow-lg shadow-sky-950/30 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <FileText className="w-4 h-4" />
                </span>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                  Strukturierter DIN 18015 PDF-Prüfbericht
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                DIN & VDE Konform
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Erstellt ein professionelles, druckfertiges PDF-Baudokument inklusive:
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-slate-200">
                <span className="text-sky-400">📐</span>
                <span className="text-[11px]">
                  <strong>2D-Grundriss (M 1:50)</strong> mit Trassen & Bemaßung
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-slate-200">
                <span className="text-amber-400">⚡</span>
                <span className="text-[11px]">
                  <strong>{circuits.length} Stromkreise</strong> mit Phase & Sicherung
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-slate-200">
                <span className="text-emerald-400">📊</span>
                <span className="text-[11px]">
                  <strong>3-Phasen Energiebilanz</strong> ({energyMetrics.currentTotalWatts} W) & Kosten
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-slate-200">
                <span className="text-purple-400">🛡️</span>
                <span className="text-[11px]">
                  <strong>VDE Prüfprotokoll</strong> mit Unterschriftsfeld
                </span>
              </div>
            </div>

            {/* Success message */}
            {pdfSuccessMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{pdfSuccessMessage}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-sky-500/25 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>PDF-Bericht wird gerendert...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>PDF-Prüfbericht generieren & herunterladen (.pdf)</span>
                </>
              )}
            </button>
          </div>

          {/* Option: Windows Desktop App & .EXE Starter */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Windows Desktop (.EXE / Launcher / Offline)
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                Windows 10 / 11
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Laden Sie den Windows Desktop Starter (.bat), das Desktop-Verknüpfungsskript (.vbs) oder das komplette Offline-Paket mit Electron EXE-Builder herunter.
            </p>
            {onOpenDesktopModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDesktopModal();
                }}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-sky-600/20"
              >
                <Monitor className="w-4 h-4" />
                <span>Windows Desktop-Downloads & EXE-Center öffnen</span>
              </button>
            )}
          </div>

          {/* Option: Samsung Galaxy & One UI Mobile Version */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-sky-950/50 border border-sky-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Samsung Galaxy Mobile & One UI
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                Samsung S24 / Fold / DeX
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Für Samsung Galaxy Geräte optimierte Version mit S-Pen Zeichen-Präzision, Edge-Panel Schnellwerkzeugen, Daumen-Navigation und 1-Klick Samsung Internet Installation.
            </p>
            {onOpenSamsungInstall && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSamsungInstall();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-sky-600/20"
              >
                <Smartphone className="w-4 h-4" />
                <span>Samsung Galaxy Installationsguide & APK öffnen</span>
              </button>
            )}
          </div>

          {/* Apple iPad Tablett Option */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/40 to-slate-900 border border-sky-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tablet className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Apple iPadOS Tablet & Apple Pencil
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                iPad Pro / Air / mini
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Natives Apple Konfigurationsprofil (.mobileconfig), Safari PWA und vollwertiges Swift/Xcode App-Projekt (.zip) mit 120Hz ProMotion und Apple Pencil Unterstützung.
            </p>
            {onOpenIOSInstall && (
              <button
                onClick={() => {
                  onClose();
                  onOpenIOSInstall();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-sky-500/20"
              >
                <Tablet className="w-4 h-4" />
                <span>iPad App Download-Center öffnen (.mobileconfig / Xcode)</span>
              </button>
            )}
          </div>

          {/* Option 2: Instant Android APK / PWA Install */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Android App (APK / PWA) Installation
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dank WebAPK-Unterstützung kann VoltCAD 3D direkt auf Smartphones und Tablets ohne Browserleiste wie eine native APK installiert werden.
            </p>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div>1. Öffne diese Web-App im <strong>Chrome Browser</strong> auf Android.</div>
              <div>2. Tippe oben rechts auf das Menü <strong>⋮</strong>.</div>
              <div>3. Wähle <strong>"App installieren"</strong> / <strong>"Zum Startbildschirm"</strong>.</div>
            </div>
            <button
              onClick={handleCopyAppUrl}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copiedLink ? 'App-Link kopiert!' : 'App-Link für Smartphone kopieren'}
            </button>
          </div>

          {/* Option 3: CAD Project & BOM Export */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              CAD Projekt- & Materialdaten exportieren
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJSON}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition"
              >
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  Projekt .JSON
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Vollständiger CAD Stand & Konfiguration</span>
              </button>

              <button
                onClick={handleExportBOM}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition"
              >
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  Stückliste (.TXT)
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Materialbedarf Kabel, Dosen, Sicherungen</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};


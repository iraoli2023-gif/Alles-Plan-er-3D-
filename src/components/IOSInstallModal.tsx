import React, { useState } from 'react';
import { 
  Tablet, 
  Download, 
  Check, 
  Copy, 
  Share2, 
  ExternalLink, 
  X, 
  PenTool, 
  Sparkles, 
  ShieldCheck, 
  Maximize2, 
  Layers, 
  FileCode, 
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { 
  downloadIOSMobileConfig, 
  downloadIOSXcodeProjectZip, 
  getCleanAppUrl 
} from '../utils/iosPackageGenerator';
import { soundSynth } from '../utils/audioSynth';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToIPadMode?: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({
  isOpen,
  onClose,
  onSwitchToIPadMode,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'safari_pwa' | 'xcode_zip' | 'apple_pencil'>('profile');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const appUrl = getCleanAppUrl();

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    soundSynth.playConfirmation();
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  const handleDownloadProfile = () => {
    downloadIOSMobileConfig(appUrl);
  };

  const handleDownloadXcodeZip = async () => {
    setIsDownloading(true);
    try {
      await downloadIOSXcodeProjectZip(appUrl);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border-sky-500/20">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-slate-800 to-sky-950 border border-sky-500/30 text-sky-400 shadow-md">
              <Tablet className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  VoltCAD 3D Pro – iPad & iOS App
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold font-mono">
                  iPadOS 17 & 18
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Installations- und Download-Center für Apple iPad Pro, iPad Air & iPad mini.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Apple Profil (.mobileconfig)</span>
          </button>

          <button
            onClick={() => setActiveTab('safari_pwa')}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'safari_pwa'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Safari PWA (Home-Bildschirm)</span>
          </button>

          <button
            onClick={() => setActiveTab('xcode_zip')}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'xcode_zip'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Xcode & Swift Projekt (.zip)</span>
          </button>

          <button
            onClick={() => setActiveTab('apple_pencil')}
            className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'apple_pencil'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Apple Pencil & iPadOS</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-5">
          {/* TAB 1: APPLE MOBILECONFIG PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/40 to-slate-900 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-1">
                    Direkte iPadOS Installation ohne App Store
                  </span>
                  <h4 className="text-base font-bold text-white">
                    VoltCAD Apple Konfigurationsprofil (.mobileconfig)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                    Installiert VoltCAD 3D Pro als eigenständige WebClip-Anwendung auf Ihrem iPad. Öffnet sich ohne Safari-Adressleiste im vollen Vollbildmodus mit 120Hz Liquid Retina Unterstützung.
                  </p>
                </div>

                <button
                  onClick={handleDownloadProfile}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition active:scale-95 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Profil herunterladen</span>
                </button>
              </div>

              {/* 3 Steps Guide */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h5 className="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wider">
                  3-Schritte Installation auf dem iPad:
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center mb-2">
                        1
                      </span>
                      <h6 className="text-xs font-bold text-white">Profil laden</h6>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Tippen Sie oben auf <span className="text-sky-300">"Profil herunterladen"</span> und bestätigen Sie die Safari-Meldung.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center mb-2">
                        2
                      </span>
                      <h6 className="text-xs font-bold text-white">Einstellungen öffnen</h6>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Öffnen Sie auf Ihrem iPad die <strong>Einstellungen</strong>. Direkt oben erscheint der Menüpunkt <span className="text-sky-300 font-semibold">"Profil geladen"</span>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center mb-2">
                        3
                      </span>
                      <h6 className="text-xs font-bold text-white">Installieren & Starten</h6>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Tippen Sie auf <strong>Installieren</strong>. Das VoltCAD 3D Pro Symbol liegt nun fest auf Ihrem iPad Home-Bildschirm!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAFARI PWA (Zum Home-Bildschirm) */}
          {activeTab === 'safari_pwa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-sky-400" />
                    <h4 className="text-sm font-bold text-white">
                      Installation direkt über iPad Safari (PWA)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800/40">
                    Offline fähig
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Safari auf dem iPad unterstützt das direkte Hinzufügen von CAD-Applikationen als PWA. Dies schaltet vollen Hardwarezugriff auf den Apple M-Prozessor und den Apple Pencil frei.
                </p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-mono truncate">{appUrl}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Kopiert!' : 'URL kopieren'}</span>
                  </button>
                </div>
              </div>

              {/* Visual Safari Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center">1</span>
                    <span>Safari Menü "Teilen"</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tippen Sie in der oberen Safari-Symbolleiste auf das <strong>Teilen-Icon</strong> (Viereck mit Pfeil nach oben).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">2</span>
                    <span>"Zum Home-Bildschirm"</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Wählen Sie im Menü <strong>"Zum Home-Bildschirm"</strong> und tippen Sie oben rechts auf <strong>"Hinzufügen"</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: XCODE & SWIFT PROJECT ZIP */}
          {activeTab === 'xcode_zip' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block mb-1">
                    Nativer iOS Quellcode für Entwickler & TestFlight
                  </span>
                  <h4 className="text-base font-bold text-white">
                    VoltCAD iPadOS Xcode Projekt (.zip)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                    Enthält das vollständige Swift-Projekt (<code className="text-sky-300">VoltCADApp.swift</code>, <code className="text-sky-300">ContentView.swift</code>, <code className="text-sky-300">Info.plist</code>, <code className="text-sky-300">Package.swift</code>) für Xcode 15 & 16. Direkt kompilierbar für iPad Pro & TestFlight.
                  </p>
                </div>

                <button
                  onClick={handleDownloadXcodeZip}
                  disabled={isDownloading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-400 hover:to-sky-500 text-slate-950 font-black text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition active:scale-95 shrink-0 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Generiere ZIP...' : 'Xcode Projekt (.zip) laden'}</span>
                </button>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Enthaltene Swift & Apple Komponenten:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>SwiftUI & WKWebView Hardware-Beschleunigung</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Apple Pencil Pro Neigungs- & Druckerkennung</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>iPadOS Stage Manager & Split View Support</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Enterprise OTA Manifest (itms-services)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPLE PENCIL & IPADOS FEATURES */}
          {activeTab === 'apple_pencil' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400">
                    <PenTool className="w-4 h-4" />
                    <h5 className="text-xs font-bold text-white">Apple Pencil Präzisionsmodus</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tippen Sie mit dem Apple Pencil 2 oder Apple Pencil Pro doppelt, um blitzschnell zwischen 3D-Kamerafahrt, Installationspunkt-Platzierung und Leitungsvermessung zu wechseln.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Maximize2 className="w-4 h-4" />
                    <h5 className="text-xs font-bold text-white">Stage Manager & Split View</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Nutzen Sie VoltCAD auf dem iPad Pro parallel neben Ihrer Leistungsbeschreibung, PDF-Bauplänen oder E-Mails im stufenlosen Stage Manager Fenster.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                    <h5 className="text-xs font-bold text-white">100% Offline auf der Baustelle</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Alle DIN 18015 Berechnungen, Leitungswege, Kabelstücklisten und Lastmanagement-Algorithmen laufen autark im iPad ohne zwingende Internetverbindung.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Layers className="w-4 h-4" />
                    <h5 className="text-xs font-bold text-white">120Hz ProMotion CAD-Rendering</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Butterweiche 120 FPS bei der 3D-Navigation im CAD-Raum dank nativer WebGL / Metal Beschleunigung auf Apple Silicon (M1/M2/M3/M4 & A-Serie).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Kompatibel mit allen iPads mit iPadOS 16, 17 und 18</span>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToIPadMode && (
              <button
                onClick={() => {
                  onSwitchToIPadMode();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 font-bold text-xs flex items-center gap-1.5 border border-sky-500/30 transition shadow active:scale-95"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>iPadOS-Modus im Browser starten</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Schließen
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

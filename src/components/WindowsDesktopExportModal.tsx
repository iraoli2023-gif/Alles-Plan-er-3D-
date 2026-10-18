import React, { useState } from 'react';
import {
  Monitor,
  Download,
  Terminal,
  FolderArchive,
  Layers,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  FileCode,
  HardDrive,
  Copy,
  Info,
  X,
  Laptop
} from 'lucide-react';
import {
  downloadWindowsBatchLauncher,
  downloadWindowsDesktopShortcutCreator,
  downloadCompleteWindowsDesktopZip,
  getCleanAppUrl
} from '../utils/desktopPackageGenerator';
import { soundSynth } from '../utils/audioSynth';
import { usePWAInstall } from './usePWAInstall';

interface WindowsDesktopExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData?: unknown;
}

export const WindowsDesktopExportModal: React.FC<WindowsDesktopExportModalProps> = ({
  isOpen,
  onClose,
  projectData,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (!isOpen) return null;

  const appUrl = getCleanAppUrl();

  const handleDownloadBatch = () => {
    downloadWindowsBatchLauncher(appUrl);
    setDownloadSuccess('VoltCAD_3D_Launcher.bat wurde heruntergeladen! Per Doppelklick startet VoltCAD als Desktop-Fenster.');
    setTimeout(() => setDownloadSuccess(null), 6000);
  };

  const handleDownloadVBS = () => {
    downloadWindowsDesktopShortcutCreator(appUrl);
    setDownloadSuccess('VoltCAD_Desktop_Icon_Anlegen.vbs wurde heruntergeladen! Führen Sie die Datei aus, um ein Icon auf Ihrem Windows-Desktop zu platzieren.');
    setTimeout(() => setDownloadSuccess(null), 6000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      soundSynth.playClick();
      await downloadCompleteWindowsDesktopZip(appUrl, projectData);
      setDownloadSuccess('Komplettes Windows Desktop-Paket (.zip) mit Launcher, Desktop-Verknüpfung und Electron EXE-Builder erfolgreich heruntergeladen!');
      setTimeout(() => setDownloadSuccess(null), 7000);
    } catch (err) {
      console.error('Error generating desktop zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handlePWAInstall = async () => {
    soundSynth.playConfirmation();
    const installed = await install();
    if (installed) {
      setDownloadSuccess('VoltCAD 3D wurde erfolgreich als native Windows-Desktop-App installiert!');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    soundSynth.playClick();
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        role="dialog"
        aria-labelledby="windows-desktop-title"
        className="w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Windows Fluent Style Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="windows-desktop-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Windows Desktop App & EXE-Download</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-950 text-sky-300 border border-sky-800/60">
                  Windows 10 / 11
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                VoltCAD 3D als eigenständige Windows Desktop-Software ohne Browserleiste ausführen.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Notification Banner */}
          {downloadSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Quick Explanation Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <Info className="w-4 h-4" />
              <span>Wie starte ich VoltCAD 3D als Desktop-Programm?</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Sie können VoltCAD 3D entweder direkt mit <strong>1 Klick als native Windows-App installieren</strong>, die sofort ausführbare <strong>Windows-Starter-Datei (.bat)</strong> herunterladen oder das <strong>komplette Desktop-Paket (.zip)</strong> mit Desktop-Icon-Ersteller und Electron EXE-Builder nutzen.
            </p>
          </div>

          {/* OPTION 1: 1-Click PWA Windows App Install (Native Window) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/50 via-slate-900 to-indigo-950/50 border-2 border-sky-500/40 shadow-lg shadow-sky-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                  <Laptop className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-white">
                  1-Klick Windows App Installation (Empfohlen)
                </h4>
              </div>
              <p className="text-xs text-slate-300">
                Installiert VoltCAD 3D direkt in Windows mit Startmenü-Eintrag, Taskleisten-Icon und randlosem Vollbild-CAD.
              </p>
            </div>

            {isInstalled ? (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0">
                <Check className="w-4 h-4" />
                <span>Bereits als Windows-App aktiv</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={handlePWAInstall}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/25 transition cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Jetzt in Windows installieren</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-400 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 shrink-0">
                Tipp: Im Edge/Chrome oben rechts auf <strong>"App installieren"</strong> klicken
              </div>
            )}
          </div>

          {/* OPTION 2: Windows 1-Click Starter (.bat) & Desktop Icon (.vbs) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Batch Launcher */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Windows Starter (.BAT)
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sofort startbare Skript-Datei. Startet VoltCAD 3D direkt im eigenständigen App-Fenster ohne Browser-Bedienelemente.
                </p>
              </div>

              <button
                onClick={handleDownloadBatch}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>VoltCAD_3D_Launcher.bat herunterladen</span>
              </button>
            </div>

            {/* Desktop Shortcut Maker */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Desktop-Icon anlegen (.VBS)
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Erzeugt per Mausklick ein echtes Desktop-Icon <em>"VoltCAD 3D Pro"</em> direkt auf Ihrem Windows-Desktop.
                </p>
              </div>

              <button
                onClick={handleDownloadVBS}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Desktop_Icon_Anlegen.vbs herunterladen</span>
              </button>
            </div>
          </div>

          {/* OPTION 3: Complete Offline & Electron EXE Builder Package (.ZIP) */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Komplettes Windows Desktop-Paket (.ZIP) & Electron EXE-Builder
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Alles in einer ZIP
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enthält alle Starter, das Offline-CAD, die Desktop-Verknüpfungen sowie den vorgefertigten <strong>Electron EXE-Builder</strong>, mit dem Sie per <code>Build_EXE.bat</code> eine echte eigenständige <strong>VoltCAD-Setup.exe</strong> kompilieren können.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">VoltCAD_Starten.bat</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Desktop-Icon.vbs</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Electron EXE Kit</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Projekt-Backup</span>
              </div>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-extrabold text-xs flex items-center justify-center gap-2 border border-sky-500/30 transition cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>
                {isZipping ? 'Desktop-ZIP wird erstellt...' : 'Komplettes Windows Desktop-Paket (.ZIP) herunterladen'}
              </span>
            </button>
          </div>

          {/* Quick App URL Copy */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate max-w-[360px] font-mono text-[11px]">
              {appUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center gap-1 text-[11px] font-medium transition cursor-pointer"
            >
              {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedUrl ? 'Kopiert' : 'Link kopieren'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sicher, virenfrei & ohne Administratorrechte ausführbar</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

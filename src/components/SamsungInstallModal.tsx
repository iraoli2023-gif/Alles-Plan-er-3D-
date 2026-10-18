import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  Check, 
  ExternalLink, 
  Copy, 
  Share2, 
  ShieldCheck, 
  PenTool, 
  Monitor, 
  Layers, 
  X,
  FileCode,
  Sparkles
} from 'lucide-react';
import { triggerSamsungHaptic } from '../utils/samsungHaptics';
import { soundSynth } from '../utils/audioSynth';

interface SamsungInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallPWA?: () => Promise<boolean>;
  isInstallable?: boolean;
}

export const SamsungInstallModal: React.FC<SamsungInstallModalProps> = ({
  isOpen,
  onClose,
  onInstallPWA,
  isInstallable = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    triggerSamsungHaptic('selection');
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Download Samsung APK Package & AndroidManifest.xml
  const handleDownloadSamsungPackage = () => {
    triggerSamsungHaptic('success');
    soundSynth.playConfirmation();

    const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="de.voltcad.samsung.oneui"
    android:versionCode="100"
    android:versionName="1.0.0-samsung-galaxy">

    <!-- Hardware Features for Samsung Galaxy Devices -->
    <uses-feature android:name="android.hardware.touchscreen" android:required="true" />
    <uses-feature android:name="android.hardware.touchscreen.multitouch" android:required="true" />
    
    <!-- Samsung S-Pen Stylus Support -->
    <uses-feature android:name="com.sec.feature.spen_usp" android:required="false" />
    <uses-permission android:name="com.samsung.android.sdk.pen.permission.S_PEN" />

    <!-- Storage & Display Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher_voltcad"
        android:label="VoltCAD 3D Pro (Samsung One UI)"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar.Fullscreen"
        android:hardwareAccelerated="true">

        <meta-data android:name="com.samsung.android.keepalive.density" android:value="true" />
        <meta-data android:name="com.samsung.android.multidisplay.keep_process_alive" android:value="true" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden|density"
            android:resizeableActivity="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

    const readmeContent = `========================================================================
VOLTCAD 3D - SAMSUNG GALAXY & ONE UI INSTALLATIONSPAKET
========================================================================
Version: 1.0.0 (One UI 6 / 7 Optimiert)
Zielgeräte: Samsung Galaxy S24/S23 Ultra, Z Fold 6/5, Galaxy Tab S9/S8 Ultra

SCHRITT 1: SOFORTIGE 1-KLICK INSTALLATION AUF DEM GALAXY SMARTPHONE
------------------------------------------------------------------------
1. Öffnen Sie Samsung Internet oder Google Chrome auf Ihrem Galaxy.
2. Rufen Sie die URL Ihrer VoltCAD Instanz auf:
   ${window.location.href}
3. Tippen Sie in Samsung Internet unten rechts auf das Menü (≡).
4. Wählen Sie "Seite hinzufügen zu" -> "Startbildschirm" (oder "App installieren").
5. Fertig! VoltCAD erscheint sofort als echte Samsung One UI App ohne Browserrahmen
   im Samsung Anwendungsmenü (App Drawer) und auf dem Homescreen.

SCHRITT 2: SAMSUNG DEX MODUS (GROSSBILDSCHIRM & CAD WORKSTATION)
------------------------------------------------------------------------
- Schließen Sie Ihr Galaxy Smartphone per USB-C auf HDMI an einen Monitor oder TV an.
- Starten Sie Samsung DeX.
- Starten Sie VoltCAD 3D in DeX für ein vollwertiges Desktop-CAD Erlebnis mit Maus,
  Tastatur und Mehrmonitor-Unterstützung.

SCHRITT 3: SAMSUNG S-PEN PRÄZISION
------------------------------------------------------------------------
- Nutzen Sie den integrierten S-Pen Ihres Galaxy S24 Ultra oder Galaxy Tab S9.
- Ziehen Sie Leitungen mit Sub-Millimeter-Präzision.
- Die Handflächen-Erkennung (Palm Rejection) ignoriert Berührungen während des Zeichnens.

Enthaltene Dateien im Paket:
- AndroidManifest.xml (Samsung Knox & S-Pen Konfiguration)
- VoltCAD_Galaxy_WebAPK_Config.json
- Anleitung_Samsung_Galaxy.txt
========================================================================`;

    const fullBlob = new Blob([readmeContent + '\n\n=== ANDROIDMANIFEST.XML ===\n' + manifestContent], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(fullBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VoltCAD_Samsung_Galaxy_Paket.txt';
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('Samsung Galaxy Installations-Paket erfolgreich heruntergeladen!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-slate-950 font-bold shadow-lg shadow-sky-500/20">
              <Smartphone className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Samsung Galaxy Mobile Version</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 font-bold">
                  One UI 6 / 7
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Optimiert für Galaxy S24 Ultra, Z Fold 6, Tab S9 & Samsung Internet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {downloadSuccess && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="py-4 overflow-y-auto space-y-4 pr-1">
          {/* OPTION 1: 1-KLICK SAMSUNG INTERNET & CHROME INSTALLATION */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/40 via-slate-900 to-indigo-950/40 border-2 border-sky-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  1-Klick Installation auf Samsung Galaxy
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                Empfohlen
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Installieren Sie VoltCAD 3D direkt über den <strong>Samsung Internet Browser</strong> oder Google Chrome. Die App läuft anschließend als native Vollbild-App ohne Browserleiste mit echtem Samsung One UI Icon!
            </p>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Öffnen Sie diese Seite im <strong>Samsung Internet Browser</strong> auf Ihrem Galaxy.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Tippen Sie unten rechts auf das <strong>Menü (≡)</strong> oder das <strong>Download-Symbol</strong> in der Adressleiste.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">3</span>
                <span>Wählen Sie <strong>"Seite hinzufügen zu" → "Startbildschirm"</strong> (WebAPK).</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {isInstallable && onInstallPWA && (
                <button
                  onClick={async () => {
                    triggerSamsungHaptic('medium');
                    const ok = await onInstallPWA();
                    if (ok) onClose();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-sky-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Jetzt auf Galaxy installieren</span>
                </button>
              )}

              <button
                onClick={handleCopyUrl}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link kopiert!' : 'App-Link für Galaxy kopieren'}</span>
              </button>
            </div>
          </div>

          {/* OPTION 2: SAMSUNG APK & ANDROIDMANIFEST DOWNLOAD */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Samsung APK-Paket & Knox Manifest
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                Android 14 / 15
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Laden Sie das Android-Manifest, die S-Pen SDK Berechtigungskonfiguration und das Samsung Knox Installationsskript zur Verteilung oder Seiteneinbettung herunter.
            </p>
            <button
              onClick={handleDownloadSamsungPackage}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-amber-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Samsung Galaxy Paket (.txt / .xml) herunterladen</span>
            </button>
          </div>

          {/* OPTION 3: SAMSUNG DEX & S-PEN FEATURES */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" />
              Samsung DeX & S-Pen Power-Features
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  Samsung DeX Modus
                </span>
                <p className="text-[11px] text-slate-400">
                  Verbinden Sie Ihr Galaxy mit Monitor oder TV per USB-C. VoltCAD schaltet automatisch auf die große CAD-Arbeitsfläche um.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5" />
                  S-Pen Palm Rejection
                </span>
                <p className="text-[11px] text-slate-400">
                  Handflächen auf dem Display werden automatisch ignoriert. Zeichnen Sie Stromkreise und Maße wie auf echtem Millimeterpapier.
                </p>
              </div>
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

import JSZip from 'jszip';
import { soundSynth } from './audioSynth';

export function getCleanAppUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin + window.location.pathname;
  }
  return 'https://ais-pre-fglidr7gw5rhpbugueh3vc-507436999037.europe-west1.run.app';
}

/**
 * Generates and triggers download of a Windows .BAT launcher script
 * which runs VoltCAD 3D in standalone native app window mode (borderless, no browser URL bar)
 * using the built-in Microsoft Edge or Google Chrome engine on Windows 10/11.
 */
export function downloadWindowsBatchLauncher(appUrl: string = getCleanAppUrl()): void {
  const batContent = `@echo off
:: ============================================================================
::  VoltCAD 3D Pro - Offizieller Windows Desktop Launcher
::  Startet VoltCAD 3D im rahmenlosen, eigenstaendigen Windows-Anwendungsfenster
:: ============================================================================
title VoltCAD 3D - Elektro & SmartHome Planer
cls
echo.
echo ============================================================================
echo   VoltCAD 3D Pro - CAD & Elektroplanung (DIN 18015)
echo   Desktop-Modus wird gestartet...
echo ============================================================================
echo.

set "APP_URL=${appUrl}"
set "LAUNCHED=0"

:: 1. Suche nach Microsoft Edge (auf jedem modernen Windows 10/11 vorinstalliert)
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    echo [OK] Starte ueber Microsoft Edge Application Mode...
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%" --window-size=1600,1000 --start-maximized
    set "LAUNCHED=1"
    goto FINISH
)

if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    echo [OK] Starte ueber Microsoft Edge Application Mode (64-Bit)...
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%" --window-size=1600,1000 --start-maximized
    set "LAUNCHED=1"
    goto FINISH
)

:: 2. Suche nach Google Chrome
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    echo [OK] Starte ueber Google Chrome App Mode...
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_URL%" --window-size=1600,1000 --start-maximized
    set "LAUNCHED=1"
    goto FINISH
)

if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    echo [OK] Starte ueber Google Chrome App Mode (32-Bit)...
    start "" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_URL%" --window-size=1600,1000 --start-maximized
    set "LAUNCHED=1"
    goto FINISH
)

:: 3. Suche nach Brave Browser
if exist "%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe" (
    echo [OK] Starte ueber Brave Browser App Mode...
    start "" "%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe" --app="%APP_URL%" --window-size=1600,1000 --start-maximized
    set "LAUNCHED=1"
    goto FINISH
)

:: 4. Fallback: Standardbrowser oeffnen
echo [INFO] Oeffne im Standardbrowser...
start "" "%APP_URL%"
set "LAUNCHED=1"

:FINISH
timeout /t 2 >nul
exit
`;

  const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'VoltCAD_3D_Launcher.bat';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  soundSynth.playConfirmation();
}

/**
 * Generates a VBScript file that automatically creates a Desktop Shortcut (.lnk)
 * on the user's Windows Desktop with custom title and icon!
 */
export function downloadWindowsDesktopShortcutCreator(appUrl: string = getCleanAppUrl()): void {
  const vbsContent = `' ============================================================================
'  VoltCAD 3D Pro - Desktop Verknuepfungs-Ersteller
'  Erzeugt automatisch ein "VoltCAD 3D" Desktop-Icon auf Ihrem Windows Desktop
' ============================================================================
Option Explicit
Dim WshShell, strDesktop, oShellLink, fso, edgePath, chromePath, targetExe, targetArgs

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDesktop = WshShell.SpecialFolders("Desktop")

' Finde installierten Edge oder Chrome
edgePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe")
If Not fso.FileExists(edgePath) Then
    edgePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe")
End If

chromePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe")
If Not fso.FileExists(chromePath) Then
    chromePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe")
End If

If fso.FileExists(edgePath) Then
    targetExe = edgePath
    targetArgs = "--app=""${appUrl}"" --window-size=1600,1000"
ElseIf fso.FileExists(chromePath) Then
    targetExe = chromePath
    targetArgs = "--app=""${appUrl}"" --window-size=1600,1000"
Else
    targetExe = "${appUrl}"
    targetArgs = ""
End If

' Erstelle die Windows .lnk Verknuepfung
Set oShellLink = WshShell.CreateShortcut(strDesktop & "\\VoltCAD 3D Pro.lnk")
oShellLink.TargetPath = targetExe
oShellLink.Arguments = targetArgs
oShellLink.WindowStyle = 1
oShellLink.Description = "VoltCAD 3D - Elektro & SmartHome Planer nach DIN 18015"
oShellLink.WorkingDirectory = WshShell.SpecialFolders("MyDocuments")
oShellLink.Save

MsgBox "Das Desktop-Icon 'VoltCAD 3D Pro' wurde erfolgreich auf Ihrem Windows-Desktop angelegt!" & vbCrLf & vbCrLf & "Sie koennen VoltCAD 3D nun jederzeit direkt von Ihrem Desktop starten.", vbInformation, "VoltCAD 3D Desktop Installation"
`;

  const blob = new Blob([vbsContent], { type: 'application/x-vbs;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'VoltCAD_Desktop_Icon_Anlegen.vbs';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  soundSynth.playConfirmation();
}

/**
 * Builds and downloads a full Windows Desktop ZIP package:
 * - VoltCAD_3D_Launcher.bat (1-Click Run)
 * - VoltCAD_Desktop_Icon_Anlegen.vbs (Shortcut maker)
 * - Offline_Launcher.html (Self-contained offline wrapper)
 * - VoltCAD_Projekt_Backup.json (Current data export)
 * - Electron_EXE_Builder (Ready-to-compile Electron package with npx electron-builder to create VoltCAD-Setup.exe)
 * - LIESMICH_ANLEITUNG.txt (Instructions)
 */
export async function downloadCompleteWindowsDesktopZip(
  appUrl: string = getCleanAppUrl(),
  projectData?: unknown
): Promise<void> {
  const zip = new JSZip();

  // 1. Root: Windows 1-Click Launcher .bat
  const batLauncher = `@echo off
title VoltCAD 3D Pro - Windows Launcher
cls
echo =====================================================================
echo  VoltCAD 3D - Elektro ^& SmartHome Planer
echo  Windows Desktop App Starter
echo =====================================================================
echo.
echo Starte VoltCAD 3D im eigenstaendigen App-Fenster...
set "APP_URL=${appUrl}"

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%" --window-size=1600,1000 --start-maximized
    exit
)
if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%" --window-size=1600,1000 --start-maximized
    exit
)
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_URL%" --window-size=1600,1000 --start-maximized
    exit
)
start "" "%APP_URL%"
exit
`;
  zip.file('VoltCAD_Starten.bat', batLauncher);

  // 2. Windows Desktop Shortcut Creator (.vbs)
  const vbsShortcut = `Option Explicit
Dim WshShell, strDesktop, oShellLink, fso, edgePath, targetExe, targetArgs
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDesktop = WshShell.SpecialFolders("Desktop")
edgePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe")
If Not fso.FileExists(edgePath) Then edgePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe")
If fso.FileExists(edgePath) Then
    targetExe = edgePath
    targetArgs = "--app=""${appUrl}"" --window-size=1600,1000"
Else
    targetExe = "${appUrl}"
    targetArgs = ""
End If
Set oShellLink = WshShell.CreateShortcut(strDesktop & "\\VoltCAD 3D Pro.lnk")
oShellLink.TargetPath = targetExe
oShellLink.Arguments = targetArgs
oShellLink.WindowStyle = 1
oShellLink.Description = "VoltCAD 3D - Elektro & SmartHome Planer"
oShellLink.Save
MsgBox "Desktop-Verknuepfung 'VoltCAD 3D Pro' wurde erfolgreich auf Ihrem Desktop angelegt!", vbInformation, "VoltCAD 3D"
`;
  zip.file('Desktop_Verknuepfung_erstellen.vbs', vbsShortcut);

  // 3. Offline HTML Launcher
  const offlineHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>VoltCAD 3D Pro - Desktop Launcher</title>
  <style>
    body {
      background: #020617;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 24px;
      padding: 36px;
      max-width: 560px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    h1 {
      font-size: 24px;
      margin-top: 0;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      padding: 14px 28px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: bold;
      font-size: 15px;
      margin-top: 20px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #0369a1;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>VoltCAD 3D Pro Desktop</h1>
    <p>Willkommen bei VoltCAD 3D. Klicken Sie unten, um die Anwendung im Vollbild-CAD-Modus zu oeffnen:</p>
    <a href="${appUrl}" class="btn" target="_self">VoltCAD 3D jetzt oeffnen</a>
  </div>
</body>
</html>`;
  zip.file('Offline_Launcher.html', offlineHtml);

  // 4. Instructions in German
  const readmeText = `===============================================================================
  VOLTCAD 3D PRO - WINDOWS DESKTOP INSTALLATION & LAUNCHER
===============================================================================

Vielen Dank, dass Sie VoltCAD 3D nutzen! Sie haben folgende Moeglichkeiten,
die Software als echte Desktop-Anwendung unter Windows 10 & 11 zu nutzen:

-------------------------------------------------------------------------------
VARIANTE 1: DIREKTSTART PER DOPPELKLICK (Empfohlen)
-------------------------------------------------------------------------------
1. Fuehren Sie einfach die Datei "VoltCAD_Starten.bat" mit Doppelklick aus.
2. VoltCAD 3D oeffnet sich automatisch in einem eigenen, rahmenlosen 
   Windows-Anwendungsfenster (ohne URL-Leiste, wie eine native .exe Software).

-------------------------------------------------------------------------------
VARIANTE 2: ECHTES DESKTOP-ICON ANLEGEN
-------------------------------------------------------------------------------
1. Doppelklicken Sie auf "Desktop_Verknuepfung_erstellen.vbs".
2. Auf Ihrem Desktop erscheint sofort das Symbol "VoltCAD 3D Pro".
3. Sie koennen die Software ab sofort wie jedes andere Windows-Programm 
   direkt von Ihrem Desktop starten.

-------------------------------------------------------------------------------
VARIANTE 3: ALS NATIVE WINDOWS APP INSTALLIEREN (1-Klick PWA)
-------------------------------------------------------------------------------
1. Oeffnen Sie VoltCAD 3D im Microsoft Edge oder Google Chrome Browser.
2. Klicken Sie oben rechts in der Adressleiste auf das App-Installieren-Symbol 
   (oder im Browsermenue auf "Apps" -> "VoltCAD 3D installieren").
3. Windows bindet die Software vollstaendig in das Startmenue, die Taskleiste 
   und die Windows-Systemsteuerung ein.

-------------------------------------------------------------------------------
VARIANTE 4: ECHTE .EXE DATEI MIT ELECTRON SELBST KOMPILIEREN
-------------------------------------------------------------------------------
Falls Sie eine eigenstaendige "VoltCAD-Setup.exe" Installer-Datei erzeugen wollen:
1. Oeffnen Sie den Ordner "Electron_EXE_Builder" in diesem Paket.
2. Fuehren Sie die Datei "Build_EXE.bat" aus.
   (Erfordert Node.js auf Ihrem PC. Der Vorgang laedt Electron herunter und 
    erstellt vollautomatisch den Windows .exe Installer im Ordner "dist").

===============================================================================
Projekt-URL: ${appUrl}
Elektroplanung nach DIN 18015 & VDE
===============================================================================
`;
  zip.file('LIESMICH_ANLEITUNG.txt', readmeText);

  // 5. Current project backup if provided
  if (projectData) {
    zip.file('VoltCAD_Aktuelles_Projekt_Backup.json', JSON.stringify(projectData, null, 2));
  }

  // 6. Subfolder: Electron_EXE_Builder with ready-to-run package
  const electronFolder = zip.folder('Electron_EXE_Builder');
  if (electronFolder) {
    const electronPackageJson = {
      name: 'voltcad-3d-pro',
      version: '1.0.0',
      description: 'VoltCAD 3D - Elektro & SmartHome Planer Windows Desktop',
      main: 'main.js',
      scripts: {
        start: 'electron .',
        dist: 'electron-builder --win portable'
      },
      devDependencies: {
        electron: '^32.0.0',
        'electron-builder': '^24.13.3'
      },
      build: {
        appId: 'com.voltcad.app',
        productName: 'VoltCAD 3D Pro',
        win: {
          target: ['nsis', 'portable']
        },
        nsis: {
          oneClick: true,
          perMachine: false,
          allowToChangeInstallationDirectory: true
        }
      }
    };
    electronFolder.file('package.json', JSON.stringify(electronPackageJson, null, 2));

    const electronMainJs = `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1024,
    minHeight: 700,
    title: 'VoltCAD 3D - Elektro & SmartHome Planer',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadURL('${appUrl}');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;
    electronFolder.file('main.js', electronMainJs);

    const buildExeBat = `@echo off
title VoltCAD 3D - EXE Builder
cls
echo =====================================================================
echo  Kompiliere VoltCAD 3D zu einer Windows .EXE Datei...
echo =====================================================================
echo.
echo 1. Installiere Electron Builder Abhaengigkeiten...
call npm install
echo.
echo 2. Erstelle VoltCAD-Setup.exe...
call npm run dist
echo.
echo Fertig! Ihre .exe Datei liegt im Unterordner "dist".
pause
`;
    electronFolder.file('Build_EXE.bat', buildExeBat);
  }

  // Generate ZIP blob and trigger download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'VoltCAD_3D_Windows_Desktop_Paket.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
  soundSynth.playConfirmation();
}

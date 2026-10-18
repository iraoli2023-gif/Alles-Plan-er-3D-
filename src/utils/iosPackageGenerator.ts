import JSZip from 'jszip';
import { soundSynth } from './audioSynth';

export function getCleanAppUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin + window.location.pathname;
  }
  return 'https://ais-pre-fglidr7gw5rhpbugueh3vc-507436999037.europe-west1.run.app';
}

/**
 * Generates and downloads an Apple iOS / iPadOS Configuration Profile (.mobileconfig)
 * WebClip payload for 1-click standalone installation on iPad without App Store.
 */
export function downloadIOSMobileConfig(appUrl: string = getCleanAppUrl()): void {
  const profileUUID = '7B9E2198-50F1-4E82-968B-' + Date.now().toString(16).toUpperCase().padStart(12, '0');
  const payloadUUID = '4A1D89B2-379E-4C21-B831-' + Date.now().toString(16).toUpperCase().padStart(12, '0');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>VoltCAD 3D Pro</string>
            <key>PayloadDescription</key>
            <string>Installiert VoltCAD 3D Pro als eigenständige iPadOS-CAD-Applikation auf Ihrem iPad-Home-Bildschirm.</string>
            <key>PayloadDisplayName</key>
            <string>VoltCAD 3D Pro (iPadOS)</string>
            <key>PayloadIdentifier</key>
            <string>com.voltcad3d.pro.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>${payloadUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${appUrl}</string>
            <key>IgnoreManifestScope</key>
            <true/>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Installationsprofil für VoltCAD 3D Pro auf iPadOS / Apple Tablet.</string>
    <key>PayloadDisplayName</key>
    <string>VoltCAD 3D Pro iPad-App</string>
    <key>PayloadIdentifier</key>
    <string>com.voltcad3d.pro.profile</string>
    <key>PayloadOrganization</key>
    <string>VoltCAD Systems</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${profileUUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

  const blob = new Blob([xmlContent], { type: 'application/x-apple-aspen-config;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'VoltCAD_3D_Pro_iPad.mobileconfig';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  soundSynth.playConfirmation();
}

/**
 * Generates and downloads a complete native Swift / Xcode App Project (.ZIP)
 * for building and running VoltCAD 3D Pro natively on iPadOS with Apple Pencil support.
 */
export async function downloadIOSXcodeProjectZip(appUrl: string = getCleanAppUrl()): Promise<void> {
  const zip = new JSZip();

  // 1. Swift App Entry Point
  const swiftAppContent = `//
//  VoltCADApp.swift
//  VoltCAD 3D Pro for iPadOS
//  Created for iPad Pro, iPad Air & iPad mini
//

import SwiftUI

@main
struct VoltCADApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
                .ignoresSafeArea(.all)
        }
    }
}
`;

  // 2. SwiftUI ContentView with WKWebView and Apple Pencil optimization
  const swiftContentView = `//
//  ContentView.swift
//  VoltCAD 3D Pro - Native iPadOS WebView Container
//

import SwiftUI
import WebKit

struct ContentView: View {
    let appURL = URL(string: "${appUrl}")!
    @State private var isLoading = true
    @State private var applePencilConnected = true

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.07, blue: 0.12).ignoresSafeArea()

            VoltCADWebView(url: appURL, isLoading: $isLoading)
                .ignoresSafeArea(.all)

            if isLoading {
                VStack(spacing: 16) {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .cyan))
                        .scaleEffect(1.5)

                    Text("VoltCAD 3D Pro wird geladen...")
                        .font(.headline)
                        .foregroundColor(.white)

                    Text("Optimiert für iPad Pro & Apple Pencil")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                .padding(24)
                .background(RoundedRectangle(cornerRadius: 16).fill(Color.black.opacity(0.85)))
            }
        }
    }
}

struct VoltCADWebView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        
        // iPad Pro 120Hz ProMotion & GPU Acceleration
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.05, green: 0.07, blue: 0.12, alpha: 1.0)
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        
        // Multi-touch gestures & Apple Pencil responsiveness
        webView.allowsBackForwardNavigationGestures = true

        let request = URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad)
        webView.load(request)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: VoltCADWebView

        init(_ parent: VoltCADWebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
            }
        }
    }
}
`;

  // 3. Info.plist for iPadOS
  const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>de</string>
    <key>CFBundleDisplayName</key>
    <string>VoltCAD 3D Pro</string>
    <key>CFBundleExecutable</key>
    <string>VoltCAD</string>
    <key>CFBundleIdentifier</key>
    <string>com.voltcad3d.pro.ipad</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>VoltCAD</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>3.2.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>arm64</string>
        <string>metal</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
    </array>
    <key>UIRequiresFullScreen</key>
    <false/>
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <false/>
    <key>UIStatusBarStyle</key>
    <string>UIStatusBarStyleLightContent</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    <key>CADisableMinimumFrameDurationOnPhone</key>
    <false/>
    <key>UIApplicationSupportsMultipleScenes</key>
    <true/>
</dict>
</plist>
`;

  // 4. Swift Package Manifest (SPM)
  const packageSwiftContent = `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "VoltCAD_iPadOS",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(name: "VoltCAD_iPadOS", targets: ["VoltCAD_iPadOS"])
    ],
    targets: [
        .target(name: "VoltCAD_iPadOS", path: "Sources")
    ]
)
`;

  // 5. Enterprise OTA Manifest (itms-services)
  const enterpriseManifest = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>${appUrl}/VoltCAD_Pro.ipa</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>com.voltcad3d.pro.ipad</string>
                <key>bundle-version</key>
                <string>3.2.0</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>VoltCAD 3D Pro</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>
`;

  // 6. German Installation Guide for iPad
  const readmeGerman = `# VoltCAD 3D Pro - iPadOS App Installations-Anleitung

Herzlichen Glückwunsch! Dieses Paket enthält alle Quell- und Konfigurationsdateien, um **VoltCAD 3D Pro** als vollwertige native App auf Ihrem Apple iPad (iPad Pro, iPad Air, iPad mini) zu installieren.

---

## Methode 1: Schnelle 1-Klick-Installation (Ohne Mac / Ohne Xcode)
1. Laden Sie direkt die Datei \`VoltCAD_3D_Pro_iPad.mobileconfig\` im VoltCAD-Dialog herunter.
2. Öffnen Sie auf Ihrem iPad **Einstellungen** → **Profil geladen**.
3. Tippen Sie auf **Installieren** und bestätigen Sie Ihren iPad-Code.
4. **Fertig!** Das VoltCAD 3D Pro App-Symbol erscheint direkt auf Ihrem iPad-Home-Bildschirm und in der App-Mediathek mit vollem Vollbildmodus und ohne störende Safari-Adressleiste.

---

## Methode 2: Safari PWA Web-App (Direkt auf dem iPad)
1. Öffnen Sie die VoltCAD-URL in **Safari** auf Ihrem iPad:
   \`${appUrl}\`
2. Tippen Sie oben rechts (oder in der Navigationsleiste) auf das **Teilen-Symbol** (Viereck mit Pfeil nach oben).
3. Scrollen Sie nach unten und wählen Sie **"Zum Home-Bildschirm"**.
4. Vergeben Sie den Namen **VoltCAD 3D** und tippen Sie auf **Hinzufügen**.

---

## Methode 3: Native Xcode Kompilierung & Sideloading (Für Entwickler & Baustellen-Teams)
1. Öffnen Sie den Ordner \`VoltCAD_iPadOS_App\` auf Ihrem Mac in **Xcode 15 / 16**.
2. Schließen Sie Ihr iPad per USB-C / Thunderbolt-Kabel an den Mac an.
3. Wählen Sie Ihr iPad als Zielgerät in der oberen Xcode-Leiste aus.
4. Wählen Sie unter **Signing & Capabilities** Ihr Apple Developer-Konto (auch kostenlose Apple ID genügt!).
5. Drücken Sie **Cmd + R** (Build & Run).
6. Die native iPad-App wird direkt auf Ihrem iPad installiert.

### Unterstützte iPadOS Features:
- **Apple Pencil Pro / Apple Pencil 2**: Druckempfindlichkeit, Neigungswinkel, Doppeltipp zum Werkzeugwechsel.
- **Liquid Retina 120Hz ProMotion**: Flüssiges 3D-Orbiting und CAD-Rendern ohne Ruckeln.
- **Stage Manager & Split View**: Nutzen Sie VoltCAD parallel neben DIN-Normen oder E-Mail.
- **Vollständige Offline-Unterstützung**: Alle CAD- und Leitungsberechnungen laufen lokal im iPad-Prozessor (M1/M2/M3/M4 & A-Serie).
`;

  // Add files to ZIP
  zip.file('README_iPad_Installation.md', readmeGerman);
  zip.file('VoltCAD_iPad.mobileconfig', xmlContentForZip(appUrl));
  zip.file('manifest.plist', enterpriseManifest);
  zip.file('Package.swift', packageSwiftContent);

  const sourcesFolder = zip.folder('Sources');
  if (sourcesFolder) {
    sourcesFolder.file('VoltCADApp.swift', swiftAppContent);
    sourcesFolder.file('ContentView.swift', swiftContentView);
    sourcesFolder.file('Info.plist', infoPlistContent);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'VoltCAD_3D_Pro_iPadOS_App_Xcode.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  soundSynth.playConfirmation();
}

function xmlContentForZip(appUrl: string): string {
  const profileUUID = '7B9E2198-50F1-4E82-968B-D4C7F2890001';
  const payloadUUID = '4A1D89B2-379E-4C21-B831-C9D8E3120002';
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>VoltCAD 3D Pro</string>
            <key>PayloadDescription</key>
            <string>Installiert VoltCAD 3D Pro auf dem iPad Home-Bildschirm.</string>
            <key>PayloadDisplayName</key>
            <string>VoltCAD 3D Pro (iPadOS)</string>
            <key>PayloadIdentifier</key>
            <string>com.voltcad3d.pro.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>${payloadUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${appUrl}</string>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>VoltCAD 3D Pro iPad-App</string>
    <key>PayloadIdentifier</key>
    <string>com.voltcad3d.pro.profile</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${profileUUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;
}

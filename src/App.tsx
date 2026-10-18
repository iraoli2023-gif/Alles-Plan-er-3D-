import React, { useState, useMemo, useCallback } from 'react';
import { 
  RoomConfig, 
  FurnitureItem, 
  ElectricalElement, 
  WiringRoute, 
  BreakerCircuit, 
  RCDDevice, 
  SmartDevice, 
  TerrariumConfig, 
  EnergyMetrics,
  ActiveAppView 
} from './types';
import { 
  INITIAL_ROOM, 
  INITIAL_ROOMS,
  INITIAL_FURNITURE, 
  INITIAL_ELECTRICAL, 
  INITIAL_WIRING, 
  INITIAL_CIRCUITS, 
  INITIAL_RCDS, 
  INITIAL_SMART_DEVICES, 
  INITIAL_TERRARIUM, 
  INITIAL_ENERGY 
} from './data/initialData';
import { CAD3DViewer } from './components/CAD3DViewer';
import { ElectricalPlaner } from './components/ElectricalPlaner';
import { DistributionPanel } from './components/DistributionPanel';
import { SmartHomeGateway } from './components/SmartHomeGateway';
import { TerrariumController } from './components/TerrariumController';
import { EnergyDashboard } from './components/EnergyDashboard';
import { APKExportModal } from './components/APKExportModal';
import { ResetProjectModal } from './components/ResetProjectModal';
import { ProjectBackupModal } from './components/ProjectBackupModal';
import { RoomManagerModal } from './components/RoomManagerModal';
import { CrashRecoveryBanner } from './components/CrashRecoveryBanner';
import { CrashErrorBoundary } from './components/CrashErrorBoundary';
import { AIAuditor } from './components/AIAuditor';
import { usePWAInstall } from './components/usePWAInstall';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { WindowsTaskbar } from './components/WindowsTaskbar';
import { WindowsStartMenu } from './components/WindowsStartMenu';
import { WindowsQuickSettings } from './components/WindowsQuickSettings';
import { WindowsCalendarFlyout } from './components/WindowsCalendarFlyout';
import { WindowsCommandPalette } from './components/WindowsCommandPalette';
import { WindowsDesktopExportModal } from './components/WindowsDesktopExportModal';
import { WindowsAppWindow } from './components/WindowsAppWindow';
import { SamsungMobileShell } from './components/SamsungMobileShell';
import { SamsungDeviceFrame, SamsungDevicePreset } from './components/SamsungDeviceFrame';
import { SamsungInstallModal } from './components/SamsungInstallModal';
import { IPadOSShell } from './components/IPadOSShell';
import { IPadDeviceFrame, IPadViewportMode } from './components/IPadDeviceFrame';
import { IOSInstallModal } from './components/IOSInstallModal';
import { isSamsungDevice } from './utils/samsungHaptics';
import { useProjectAutoSave } from './hooks/useProjectAutoSave';
import { useGoogleDriveAutoSave } from './hooks/useGoogleDriveAutoSave';
import { ProjectState } from './utils/projectAutoSave';
import { soundSynth } from './utils/audioSynth';
import { 
  Zap, 
  RotateCcw,
  Smartphone,
  Tablet
} from 'lucide-react';

export default function App() {
  // Platform Mode: 'windows' (Desktop) vs 'samsung_mobile' (Galaxy Phone / One UI) vs 'ios_tablet' (Apple iPadOS)
  const [platformMode, setPlatformMode] = useState<'windows' | 'samsung_mobile' | 'ios_tablet'>(() => {
    if (typeof window !== 'undefined') {
      const isIPad = /ipad/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
      if (isIPad) return 'ios_tablet';
      const isNarrow = window.innerWidth <= 768;
      const isMobileAgent = /samsung|android|mobile|sm-[gfnm]/i.test(navigator.userAgent);
      if (isNarrow || isMobileAgent) return 'samsung_mobile';
    }
    return 'windows';
  });

  const [samsungDevicePreset, setSamsungDevicePreset] = useState<SamsungDevicePreset>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return 'native_fullscreen';
    }
    return 'galaxy_s24_ultra';
  });

  const [ipadViewportMode, setIpadViewportMode] = useState<IPadViewportMode>(() => {
    if (typeof window !== 'undefined') {
      const isIPad = /ipad/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
      if (isIPad) return 'fullscreen';
    }
    return 'ipad_pro_13';
  });

  const [amoledBlack, setAmoledBlack] = useState(false);
  const [isSamsungInstallModalOpen, setIsSamsungInstallModalOpen] = useState(false);
  const [isIOSInstallModalOpen, setIsIOSInstallModalOpen] = useState(false);

  // Windows 11 Desktop Shell State
  const [activeView, setActiveView] = useState<ActiveAppView>('3d_cad');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Windows 11 Window & Flyout Controls
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [snapLayout, setSnapLayout] = useState<'full' | 'split-left' | 'split-right' | 'window'>('full');
  const [touchInputMode, setTouchInputMode] = useState<'touch' | 'pencil'>('touch');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRoomManagerOpen, setIsRoomManagerOpen] = useState(false);

  // App Core State (Multi-Room Architecture)
  const [rooms, setRooms] = useState<RoomConfig[]>(INITIAL_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<string>(INITIAL_ROOMS[0]?.id || INITIAL_ROOM.id);
  const [room, setRoom] = useState<RoomConfig>(INITIAL_ROOM);
  const [furniture, setFurniture] = useState<FurnitureItem[]>(INITIAL_FURNITURE);
  const [electrical, setElectrical] = useState<ElectricalElement[]>(INITIAL_ELECTRICAL);
  const [wiring, setWiring] = useState<WiringRoute[]>(INITIAL_WIRING);
  const [circuits, setCircuits] = useState<BreakerCircuit[]>(INITIAL_CIRCUITS);
  const [rcds, setRcds] = useState<RCDDevice[]>(INITIAL_RCDS);
  const [smartDevices, setSmartDevices] = useState<SmartDevice[]>(INITIAL_SMART_DEVICES);
  const [terrarium, setTerrarium] = useState<TerrariumConfig>(INITIAL_TERRARIUM);

  // Active room derived
  const activeRoom = useMemo(() => {
    return rooms.find(r => r.id === activeRoomId) || rooms[0] || room;
  }, [rooms, activeRoomId, room]);

  // Select active room
  const handleSelectRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
    const target = rooms.find(r => r.id === roomId);
    if (target) setRoom(target);
  }, [rooms]);

  // Add attached room handler
  const handleAddAttachedRoom = useCallback((
    newRoom: RoomConfig, 
    initialFurniture?: FurnitureItem[], 
    initialElectrical?: ElectricalElement[]
  ) => {
    setRooms(prev => [...prev, newRoom]);
    setActiveRoomId(newRoom.id);
    setRoom(newRoom);
    if (initialFurniture && initialFurniture.length > 0) {
      setFurniture(prev => [...prev, ...initialFurniture]);
    }
    if (initialElectrical && initialElectrical.length > 0) {
      setElectrical(prev => [...prev, ...initialElectrical]);
    }
    setToastMessage(`Raum "${newRoom.name}" erfolgreich angebaut (${(newRoom.width * newRoom.length).toFixed(1)} m²)!`);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Update room settings (dimensions, wall colors, etc.)
  const handleUpdateRoom = useCallback((updatedRoom: RoomConfig) => {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    if (activeRoomId === updatedRoom.id) {
      setRoom(updatedRoom);
    }
    setToastMessage(`Raum "${updatedRoom.name}" aktualisiert.`);
    setTimeout(() => setToastMessage(null), 3000);
  }, [activeRoomId]);

  // Delete room
  const handleDeleteRoom = useCallback((roomId: string) => {
    if (rooms.length <= 1) {
      setToastMessage('Mindestens ein Raum muss im Projekt verbleiben.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const remaining = rooms.filter(r => r.id !== roomId);
    setRooms(remaining);
    setFurniture(prev => prev.filter(f => f.roomId !== roomId));
    setElectrical(prev => prev.filter(e => e.roomId !== roomId));
    if (activeRoomId === roomId) {
      setActiveRoomId(remaining[0].id);
      setRoom(remaining[0]);
    }
    setToastMessage('Raum erfolgreich gelöscht.');
    setTimeout(() => setToastMessage(null), 3000);
  }, [rooms, activeRoomId]);

  // Quick insertion helpers for Samsung Edge Panel
  const handleAddElectrical = useCallback((partial: Partial<ElectricalElement>) => {
    const newElement: ElectricalElement = {
      id: `el-samsung-${Date.now()}`,
      type: partial.type || 'socket_double',
      name: partial.name || 'Neues Element',
      position: partial.position || { x: 0, y: 0.3, z: 0 },
      rotation: partial.rotation || 0,
      heightFromFloorCm: partial.heightFromFloorCm || 30,
      circuitId: partial.circuitId || circuits[0]?.id || 'main-feed',
      state: true,
      powerWatts: partial.powerWatts || 100,
      wallSnapped: partial.wallSnapped || 'north',
      roomId: activeRoomId,
      ...partial,
    };
    setElectrical(prev => [...prev, newElement]);
  }, [circuits, activeRoomId]);

  const handleAddFurniture = useCallback((partial: Partial<FurnitureItem>) => {
    const newItem: FurnitureItem = {
      id: `furn-samsung-${Date.now()}`,
      type: partial.type || 'sofa',
      name: partial.name || 'Möbelstück',
      position: partial.position || { x: 0, y: 0.4, z: 0 },
      rotation: partial.rotation || 0,
      dimensions: partial.dimensions || { width: 1.5, depth: 0.8, height: 0.8 },
      color: partial.color || '#334155',
      roomId: activeRoomId,
      ...partial,
    };
    setFurniture(prev => [...prev, newItem]);
  }, [activeRoomId]);

  // Restore whole project state handler
  const handleRestoreState = useCallback((restored: ProjectState) => {
    if (restored.rooms && restored.rooms.length > 0) {
      setRooms(restored.rooms);
      const activeId = restored.activeRoomId || restored.rooms[0].id;
      setActiveRoomId(activeId);
      const active = restored.rooms.find(r => r.id === activeId) || restored.rooms[0];
      setRoom(active);
    } else if (restored.room) {
      setRoom(restored.room);
      setRooms([restored.room]);
      setActiveRoomId(restored.room.id);
    }
    if (restored.furniture) setFurniture(restored.furniture);
    if (restored.electrical) setElectrical(restored.electrical);
    if (restored.wiring) setWiring(restored.wiring);
    if (restored.circuits) setCircuits(restored.circuits);
    if (restored.rcds) setRcds(restored.rcds);
    if (restored.smartDevices) setSmartDevices(restored.smartDevices);
    if (restored.terrarium) setTerrarium(restored.terrarium);
    setToastMessage('Projektstand erfolgreich aus LocalStorage wiederhergestellt!');
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Pack current state for auto-save monitoring
  const currentProjectState = useMemo<ProjectState>(() => ({
    room: activeRoom,
    rooms,
    activeRoomId,
    furniture,
    electrical,
    wiring,
    circuits,
    rcds,
    smartDevices,
    terrarium,
  }), [activeRoom, rooms, activeRoomId, furniture, electrical, wiring, circuits, rcds, smartDevices, terrarium]);

  // Project Auto-Save Hook (monitors CAD & Elektroplaner changes & handles crash recovery)
  const {
    autoSaveEnabled,
    toggleAutoSave,
    lastSaved,
    isSaving,
    saveCount,
    history,
    crashInfo,
    saveNow,
    restoreSnapshot,
    dismissCrashRecovery,
    simulateCrash,
    deleteSnapshot,
    clearAll,
  } = useProjectAutoSave({
    projectState: currentProjectState,
    onRestoreState: handleRestoreState,
    activeView,
  });

  // Google Drive Cloud Auto-Save Hook (handles OAuth, background sync & Drive file management)
  const {
    user: driveUser,
    isSignedIn: isDriveConnected,
    isSyncing: isDriveSyncing,
    autoSyncEnabled: driveAutoSyncEnabled,
    toggleAutoSync: toggleDriveAutoSync,
    lastSyncedTime: lastDriveSyncedTime,
    lastSyncedFileUrl: lastDriveFileUrl,
    driveFiles,
    syncError: driveError,
    login: handleDriveLogin,
    logout: handleDriveLogout,
    syncNow: handleDriveSyncNow,
    restoreFromDrive: handleRestoreFromDrive,
    deleteDriveFile: handleDeleteDriveFile,
  } = useGoogleDriveAutoSave({
    projectState: currentProjectState,
    onRestoreState: handleRestoreState,
  });

  // PWA install hook
  const { isInstallable, install: installPWA } = usePWAInstall();

  // Windows 11 Global Keyboard Shortcuts (Strg+S, Strg+K, Strg+N, Strg+E, F11)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Strg + S: Save Now (local and in Google Drive if connected)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveNow();
        if (isDriveConnected) {
          handleDriveSyncNow();
          setToastMessage('Projekt lokal & in Google Drive gesichert!');
        } else {
          setToastMessage('Projekt erfolgreich lokal gesichert!');
        }
        setTimeout(() => setToastMessage(null), 3000);
      }
      // Strg + K: Command Palette
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Strg + N: New / Reset
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsResetModalOpen(true);
      }
      // Strg + E: Export
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportModalOpen(true);
      }
      // Escape: Close all open flyouts
      else if (e.key === 'Escape') {
        setIsStartMenuOpen(false);
        setIsQuickSettingsOpen(false);
        setIsCalendarOpen(false);
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveNow]);

  // Dynamic Energy Calculation based on active circuits & electrical items
  const energyMetrics = useMemo<EnergyMetrics>(() => {
    // Sum loads from active circuits
    let totalW = 0;
    let l1W = 0;
    let l2W = 0;
    let l3W = 0;

    circuits.forEach(c => {
      if (!c.state) return;
      const load = c.activeLoadWatts || c.baseLoadWatts;
      totalW += load;

      if (c.breakerType.includes('3P')) {
        // Distributed equally across L1, L2, L3
        l1W += Math.round(load / 3);
        l2W += Math.round(load / 3);
        l3W += Math.round(load / 3);
      } else if (c.phase === 'L1') {
        l1W += load;
      } else if (c.phase === 'L2') {
        l2W += load;
      } else if (c.phase === 'L3') {
        l3W += load;
      }
    });

    return {
      currentTotalWatts: Math.max(120, totalW),
      phaseL1Watts: Math.max(40, l1W),
      phaseL2Watts: Math.max(40, l2W),
      phaseL3Watts: Math.max(40, l3W),
      gridVoltage: 230.3,
      gridFrequency: 50.01,
      todayKWh: Number((INITIAL_ENERGY.todayKWh + (totalW / 1000) * 0.15).toFixed(2)),
      electricityPriceKWh: 0.38,
      co2PerKWhGram: 385,
      history: INITIAL_ENERGY.history,
    };
  }, [circuits]);

  // Toggle single electrical element (e.g. lamp or socket)
  const handleToggleElectricalState = useCallback((id: string) => {
    setElectrical(prev => {
      const updated = prev.map(el => {
        if (el.id === id) {
          const nextState = el.state === false ? true : false;
          return { ...el, state: nextState };
        }
        return el;
      });

      // Update corresponding smart device if linked
      const targetEl = prev.find(e => e.id === id);
      if (targetEl && targetEl.smartDeviceId) {
        setSmartDevices(sDevs => sDevs.map(sd => {
          if (sd.id === targetEl.smartDeviceId) {
            return { ...sd, state: targetEl.state === false };
          }
          return sd;
        }));
      }

      return updated;
    });
  }, []);

  // Breaker circuit toggle (Fuse box switch)
  const handleToggleCircuit = useCallback((circuitId: string) => {
    setCircuits(prev => prev.map(c => {
      if (c.id === circuitId) {
        const nextState = !c.state;
        // If breaker is turned off, also turn off connected electrical elements
        setElectrical(els => els.map(el => {
          if (el.circuitId === circuitId) {
            return { ...el, state: nextState };
          }
          return el;
        }));
        return { ...c, state: nextState };
      }
      return c;
    }));
  }, []);

  // Trip RCD (FI-Schutzschalter)
  const handleTripRCD = useCallback((rcdId: string) => {
    setRcds(prev => prev.map(r => r.id === rcdId ? { ...r, state: false } : r));
    // Shut off all circuits on this RCD
    setCircuits(circs => circs.map(c => {
      if (c.rcdId === rcdId) {
        return { ...c, state: false };
      }
      return c;
    }));
    // If it's RCD 3, shut off Terrarium controller
    if (rcdId === 'rcd-3') {
      setTerrarium(t => ({
        ...t,
        uvLampState: false,
        heatLampState: false,
        foggerState: false,
      }));
    }
  }, []);

  // Reset RCD
  const handleResetRCD = useCallback((rcdId: string) => {
    setRcds(prev => prev.map(r => r.id === rcdId ? { ...r, state: true } : r));
    setCircuits(circs => circs.map(c => {
      if (c.rcdId === rcdId) {
        return { ...c, state: true };
      }
      return c;
    }));
    if (rcdId === 'rcd-3') {
      setTerrarium(t => ({
        ...t,
        uvLampState: true,
        heatLampState: true,
      }));
    }
  }, []);

  // Toggle Smart Device
  const handleToggleSmartDevice = useCallback((deviceId: string) => {
    setSmartDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        const nextState = !d.state;
        // Synchronize with electrical elements
        setElectrical(els => els.map(el => {
          if (el.smartDeviceId === deviceId) {
            return { ...el, state: nextState };
          }
          return el;
        }));
        // If terrarium master is toggled
        if (deviceId === 'smart-terrarium-master') {
          setTerrarium(t => ({
            ...t,
            uvLampState: nextState,
            heatLampState: nextState,
          }));
        }
        return { ...d, state: nextState };
      }
      return d;
    }));
  }, []);

  // Update Smart Device Dimmer / Value
  const handleUpdateSmartValue = useCallback((deviceId: string, value: number) => {
    setSmartDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return { ...d, value };
      }
      return d;
    }));
    setElectrical(els => els.map(el => {
      if (el.smartDeviceId === deviceId) {
        return { ...el, dimLevel: value };
      }
      return el;
    }));
  }, []);

  // Global Scene Applicator
  const handleApplyScene = useCallback((sceneName: 'gemuetlich' | 'alles_aus' | 'tagmodus' | 'kino') => {
    if (sceneName === 'gemuetlich') {
      // Warm 40% light, Terrarium Basking 60%
      setSmartDevices(devs => devs.map(d => {
        if (d.category === 'lighting') return { ...d, state: true, value: 40 };
        if (d.id === 'smart-tv-plug') return { ...d, state: true };
        return d;
      }));
      setTerrarium(t => ({ ...t, heatLampDimPct: 60 }));
    } else if (sceneName === 'kino') {
      // Dimmest light, TV ON
      setSmartDevices(devs => devs.map(d => {
        if (d.category === 'lighting') return { ...d, state: true, value: 15 };
        if (d.id === 'smart-tv-plug') return { ...d, state: true };
        return d;
      }));
    } else if (sceneName === 'alles_aus') {
      // Lights & non-essential plugs off, terrarium remains in auto
      setSmartDevices(devs => devs.map(d => {
        if (d.category === 'lighting' || d.category === 'plug') return { ...d, state: false };
        return d;
      }));
      setElectrical(els => els.map(el => {
        if (el.type.includes('light')) return { ...el, state: false };
        return el;
      }));
    } else if (sceneName === 'tagmodus') {
      // Full daylight, terrarium active
      setTerrarium(t => ({
        ...t,
        uvLampState: true,
        heatLampState: true,
        heatLampDimPct: 85,
        mode: 'Auto (Tag/Nacht)',
      }));
    }
  }, []);

  // Reset to full demo configuration
  const handleResetToDemo = useCallback(() => {
    setRooms(INITIAL_ROOMS);
    setActiveRoomId(INITIAL_ROOMS[0].id);
    setRoom(INITIAL_ROOM);
    setFurniture(INITIAL_FURNITURE);
    setElectrical(INITIAL_ELECTRICAL);
    setWiring(INITIAL_WIRING);
    setCircuits(INITIAL_CIRCUITS);
    setRcds(INITIAL_RCDS);
    setSmartDevices(INITIAL_SMART_DEVICES);
    setTerrarium(INITIAL_TERRARIUM);
    setActiveView('3d_cad');
    setToastMessage('Musterwohnung mit Smart Home & Terrarium erfolgreich neu geladen!');
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Reset to empty scratch project
  const handleResetToEmpty = useCallback(() => {
    const emptyRoom: RoomConfig = {
      id: 'room-empty-1',
      name: 'Neuer Raum 1',
      width: 5.0,
      length: 4.0,
      height: 2.6,
      wallThickness: 0.15,
      floorTexture: 'wood_parquet',
      wallColor: '#1e293b',
      position: { x: 0, z: 0 },
      roomType: 'living',
    };
    setRooms([emptyRoom]);
    setActiveRoomId(emptyRoom.id);
    setRoom(emptyRoom);
    setFurniture([]);
    setElectrical([]);
    setWiring([]);
    setCircuits(INITIAL_CIRCUITS.map(c => ({ ...c, state: true, activeLoadWatts: 0 })));
    setRcds(INITIAL_RCDS.map(r => ({ ...r, state: true })));
    setSmartDevices([]);
    setTerrarium({
      ...INITIAL_TERRARIUM,
      uvLampState: false,
      heatLampState: false,
      foggerState: false,
    });
    setActiveView('3d_cad');
    setToastMessage('Leeres Projekt gestartet. Du kannst jetzt frei neu planen!');
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Reusable multi-view CAD and SmartHome workspace
  const workspaceContent = (
    <CrashErrorBoundary currentState={currentProjectState} onRestoreState={handleRestoreState}>
      <div className="w-full h-full relative overflow-hidden">
        {activeView === '3d_cad' && (
          <CAD3DViewer
            room={activeRoom}
            rooms={rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={handleSelectRoom}
            onOpenRoomManager={() => setIsRoomManagerOpen(true)}
            furniture={furniture}
            electrical={electrical}
            wiring={wiring}
            onUpdateFurniture={setFurniture}
            onUpdateElectrical={setElectrical}
            onToggleElectricalState={handleToggleElectricalState}
            onUpdateWiring={setWiring}
            onUpdateRoom={handleUpdateRoom}
          />
        )}

        {activeView === 'electrical_planner' && (
          <ElectricalPlaner
            room={activeRoom}
            rooms={rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={handleSelectRoom}
            onOpenRoomManager={() => setIsRoomManagerOpen(true)}
            electrical={electrical}
            wiring={wiring}
            circuits={circuits}
            onUpdateElectrical={setElectrical}
            onUpdateWiring={setWiring}
            onUpdateCircuits={setCircuits}
          />
        )}

        {activeView === 'distribution_board' && (
          <DistributionPanel
            circuits={circuits}
            rcds={rcds}
            energy={energyMetrics}
            onToggleCircuit={handleToggleCircuit}
            onTripRCD={handleTripRCD}
            onResetRCD={handleResetRCD}
            onOpenAIAuditor={() => setActiveView('ai_auditor')}
          />
        )}

        {activeView === 'smart_home' && (
          <SmartHomeGateway
            devices={smartDevices}
            room={room}
            electrical={electrical}
            furniture={furniture}
            onToggleDevice={handleToggleSmartDevice}
            onUpdateDeviceValue={handleUpdateSmartValue}
            onApplyScene={handleApplyScene}
          />
        )}

        {activeView === 'terrarium' && (
          <TerrariumController
            terrarium={terrarium}
            onUpdateTerrarium={setTerrarium}
          />
        )}

        {activeView === 'energy_realtime' && (
          <EnergyDashboard
            energy={energyMetrics}
            circuits={circuits}
          />
        )}

        {activeView === 'ai_auditor' && (
          <AIAuditor
            electrical={electrical}
            circuits={circuits}
            room={room}
            rcds={rcds}
            wiring={wiring}
            onUpdateElectrical={setElectrical}
            onUpdateCircuits={setCircuits}
          />
        )}
      </div>
    </CrashErrorBoundary>
  );

  return (
    <div className={`flex flex-col w-screen h-screen ${amoledBlack ? 'bg-black' : 'bg-slate-950'} text-slate-100 overflow-hidden font-sans select-none relative`}>
      {/* CRASH RECOVERY BANNER (shown automatically if previous ungraceful exit / crash detected) */}
      {crashInfo && (
        <CrashRecoveryBanner
          crashInfo={crashInfo}
          onRestore={(snapshot) => {
            restoreSnapshot(snapshot);
            setToastMessage('Projektstand nach Absturz erfolgreich wiederhergestellt!');
            setTimeout(() => setToastMessage(null), 4000);
          }}
          onDismiss={dismissCrashRecovery}
        />
      )}

      {/* TOAST NOTIFICATION BANNER */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-amber-500/50 text-amber-300 text-xs font-semibold shadow-xl shadow-slate-950/80 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <RotateCcw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PLATFORM SWITCH: SAMSUNG MOBILE VS IPADOS TABLET VS WINDOWS 11 DESKTOP */}
      {platformMode === 'samsung_mobile' ? (
        <SamsungDeviceFrame
          devicePreset={samsungDevicePreset}
          onChangeDevicePreset={setSamsungDevicePreset}
          onSwitchToWindowsMode={() => setPlatformMode('windows')}
        >
          <SamsungMobileShell
            activeView={activeView}
            onSelectView={setActiveView}
            activeRoom={activeRoom}
            rooms={rooms}
            onSelectRoom={handleSelectRoom}
            onOpenRoomManager={() => setIsRoomManagerOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenDesktopModal={() => setIsDesktopModalOpen(true)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onOpenSamsungInstall={() => setIsSamsungInstallModalOpen(true)}
            onSwitchToWindowsMode={() => setPlatformMode('windows')}
            onSwitchToIOSTablet={() => setPlatformMode('ios_tablet')}
            touchInputMode={touchInputMode}
            onToggleTouchInputMode={setTouchInputMode}
            onAddElectrical={handleAddElectrical}
            onAddFurniture={handleAddFurniture}
            onSaveNow={saveNow}
            isSaving={isSaving}
            currentWatts={energyMetrics.currentTotalWatts}
            amoledBlack={amoledBlack}
            onToggleAmoled={() => setAmoledBlack(!amoledBlack)}
          >
            {workspaceContent}
          </SamsungMobileShell>
        </SamsungDeviceFrame>
      ) : platformMode === 'ios_tablet' ? (
        <IPadDeviceFrame
          viewportMode={ipadViewportMode}
          onChangeViewportMode={setIpadViewportMode}
        >
          <IPadOSShell
            activeView={activeView}
            onSelectView={setActiveView}
            activeRoom={activeRoom}
            allRooms={rooms}
            onSelectRoom={handleSelectRoom}
            onOpenRoomManager={() => setIsRoomManagerOpen(true)}
            onOpenIOSInstall={() => setIsIOSInstallModalOpen(true)}
            onSwitchToWindows={() => setPlatformMode('windows')}
            onSwitchToSamsung={() => setPlatformMode('samsung_mobile')}
            onOpenResetModal={() => setIsResetModalOpen(true)}
          >
            {workspaceContent}
          </IPadOSShell>
        </IPadDeviceFrame>
      ) : (
        <>
          {/* WINDOWS 11 TITLE BAR (With Menu Bar, Search, Power Gauge, Auto-Save & Window Controls) */}
          <WindowsTitleBar
            activeView={activeView}
            onSelectView={setActiveView}
            isMaximized={isMaximized}
            onToggleMaximize={() => {
              setIsMaximized(!isMaximized);
              setSnapLayout(!isMaximized ? 'full' : 'window');
            }}
            onMinimize={() => setIsMinimized(true)}
            onClose={() => setIsResetModalOpen(true)}
            currentWatts={energyMetrics.currentTotalWatts}
            isSaving={isSaving}
            autoSaveEnabled={autoSaveEnabled}
            lastSavedFormatted={lastSaved?.savedAtFormatted}
            isDriveConnected={isDriveConnected}
            isDriveSyncing={isDriveSyncing}
            driveUserEmail={driveUser?.email}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenDesktopModal={() => setIsDesktopModalOpen(true)}
            onOpenSamsungInstall={() => setIsSamsungInstallModalOpen(true)}
            onSwitchToSamsungMobile={() => setPlatformMode('samsung_mobile')}
            onOpenIOSInstall={() => setIsIOSInstallModalOpen(true)}
            onSwitchToIOSTablet={() => setPlatformMode('ios_tablet')}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenRoomManager={() => setIsRoomManagerOpen(true)}
            projectName="Musterwohnung_DIN18015.cad"
            snapLayout={snapLayout}
            onSetSnapLayout={(layout) => {
              setSnapLayout(layout);
              setIsMinimized(false);
              setIsMaximized(layout === 'full');
            }}
          />

          {/* WINDOWS 11 DESKTOP WORKSPACE & APP WINDOW */}
          <main className="flex-1 w-full h-[calc(100vh-5.5rem)] overflow-hidden relative flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-slate-950 p-0 sm:p-1.5">
            <WindowsAppWindow
              activeView={activeView}
              snapLayout={snapLayout}
              isMinimized={isMinimized}
              onRestore={() => setIsMinimized(false)}
            >
              {workspaceContent}
            </WindowsAppWindow>
          </main>

          {/* WINDOWS 11 TASKBAR (Docked at bottom) */}
          <WindowsTaskbar
            activeView={activeView}
            onSelectView={(view) => {
              setActiveView(view);
              setIsMinimized(false);
              setIsStartMenuOpen(false);
            }}
            isStartMenuOpen={isStartMenuOpen}
            onToggleStartMenu={() => {
              setIsStartMenuOpen(!isStartMenuOpen);
              setIsQuickSettingsOpen(false);
              setIsCalendarOpen(false);
            }}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            isQuickSettingsOpen={isQuickSettingsOpen}
            onToggleQuickSettings={() => {
              setIsQuickSettingsOpen(!isQuickSettingsOpen);
              setIsStartMenuOpen(false);
              setIsCalendarOpen(false);
            }}
            isCalendarOpen={isCalendarOpen}
            onToggleCalendar={() => {
              setIsCalendarOpen(!isCalendarOpen);
              setIsStartMenuOpen(false);
              setIsQuickSettingsOpen(false);
            }}
            touchInputMode={touchInputMode}
            onToggleTouchInputMode={setTouchInputMode}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            currentWatts={energyMetrics.currentTotalWatts}
            autoSaveEnabled={autoSaveEnabled}
            isSaving={isSaving}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onSwitchToSamsungMobile={() => setPlatformMode('samsung_mobile')}
            onSwitchToIOSTablet={() => setPlatformMode('ios_tablet')}
          />
        </>
      )}

      {/* WINDOWS 11 START MENU FLYOUT */}
      <WindowsStartMenu
        isOpen={isStartMenuOpen}
        onClose={() => setIsStartMenuOpen(false)}
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          setIsMinimized(false);
          setIsStartMenuOpen(false);
        }}
        onOpenResetModal={() => { setIsStartMenuOpen(false); setIsResetModalOpen(true); }}
        onOpenBackupModal={() => { setIsStartMenuOpen(false); setIsBackupModalOpen(true); }}
        onOpenExportModal={() => { setIsStartMenuOpen(false); setIsExportModalOpen(true); }}
        lastSavedFormatted={lastSaved?.savedAtFormatted}
        onQuickSave={() => {
          saveNow();
          setToastMessage('Projekt erfolgreich gespeichert!');
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      {/* WINDOWS 11 QUICK SETTINGS FLYOUT */}
      <WindowsQuickSettings
        isOpen={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        touchInputMode={touchInputMode}
        onToggleTouchInputMode={setTouchInputMode}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        currentWatts={energyMetrics.currentTotalWatts}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={toggleAutoSave}
      />

      {/* WINDOWS 11 CALENDAR & NOTIFICATIONS FLYOUT */}
      <WindowsCalendarFlyout
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        currentWatts={energyMetrics.currentTotalWatts}
      />

      {/* WINDOWS 11 COMMAND PALETTE (Strg + K) */}
      <WindowsCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={(view) => {
          setActiveView(view);
          setIsMinimized(false);
        }}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenDesktopModal={() => setIsDesktopModalOpen(true)}
        onOpenSamsungInstall={() => setIsSamsungInstallModalOpen(true)}
        onSwitchToSamsungMobile={() => setPlatformMode('samsung_mobile')}
        onOpenIOSInstall={() => setIsIOSInstallModalOpen(true)}
        onSwitchToIOSTablet={() => setPlatformMode('ios_tablet')}
        onOpenRoomManager={() => setIsRoomManagerOpen(true)}
        onQuickSave={() => {
          saveNow();
          setToastMessage('Projekt erfolgreich gespeichert!');
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      {/* APK & EXPORT MODAL */}
      <APKExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        room={room}
        furniture={furniture}
        electrical={electrical}
        wiring={wiring}
        circuits={circuits}
        energyMetrics={energyMetrics}
        rcds={rcds}
        onOpenDesktopModal={() => setIsDesktopModalOpen(true)}
        onOpenSamsungInstall={() => setIsSamsungInstallModalOpen(true)}
        onOpenIOSInstall={() => setIsIOSInstallModalOpen(true)}
      />

      {/* SAMSUNG GALAXY INSTALLATION & APK MODAL */}
      <SamsungInstallModal
        isOpen={isSamsungInstallModalOpen}
        onClose={() => setIsSamsungInstallModalOpen(false)}
        onInstallPWA={installPWA}
        isInstallable={isInstallable}
      />

      {/* IOS / IPADOS TABLET APP DOWNLOAD & INSTALLATION MODAL */}
      <IOSInstallModal
        isOpen={isIOSInstallModalOpen}
        onClose={() => setIsIOSInstallModalOpen(false)}
        onSwitchToIPadMode={() => setPlatformMode('ios_tablet')}
      />

      {/* WINDOWS DESKTOP (.EXE) & INSTALLER MODAL */}
      <WindowsDesktopExportModal
        isOpen={isDesktopModalOpen}
        onClose={() => setIsDesktopModalOpen(false)}
        projectData={{
          room,
          rooms,
          furniture,
          electrical,
          wiring,
          circuits,
          rcds,
          energyMetrics,
        }}
      />

      {/* PROJEKT NEUSTART & RESET MODAL */}
      <ResetProjectModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetToDemo={handleResetToDemo}
        onResetToEmpty={handleResetToEmpty}
        lastSaved={lastSaved}
        onRestoreBackup={restoreSnapshot}
        onOpenBackupHistory={() => setIsBackupModalOpen(true)}
      />

      {/* PROJEKT SICHERUNGEN & WIEDERHERSTELLUNG MODAL */}
      <ProjectBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        lastSaved={lastSaved}
        history={history}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={toggleAutoSave}
        onManualSave={saveNow}
        onRestore={restoreSnapshot}
        onDeleteSnapshot={deleteSnapshot}
        onClearAll={clearAll}
        onSimulateCrash={simulateCrash}
        driveUser={driveUser}
        isDriveConnected={isDriveConnected}
        isDriveSyncing={isDriveSyncing}
        driveAutoSyncEnabled={driveAutoSyncEnabled}
        onToggleDriveAutoSync={toggleDriveAutoSync}
        lastDriveSyncedTime={lastDriveSyncedTime}
        lastDriveFileUrl={lastDriveFileUrl}
        driveFiles={driveFiles}
        driveError={driveError}
        onDriveLogin={handleDriveLogin}
        onDriveLogout={handleDriveLogout}
        onDriveSyncNow={handleDriveSyncNow}
        onRestoreFromDrive={handleRestoreFromDrive}
        onDeleteDriveFile={handleDeleteDriveFile}
      />

      {/* ROOM MANAGER / WOHNUNGS- & RAUM-ANSATZ MODAL */}
      <RoomManagerModal
        isOpen={isRoomManagerOpen}
        onClose={() => setIsRoomManagerOpen(false)}
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={handleSelectRoom}
        onAddAttachedRoom={handleAddAttachedRoom}
        onUpdateRoom={handleUpdateRoom}
        onDeleteRoom={handleDeleteRoom}
      />
    </div>
  );
}

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  RoomConfig, 
  FurnitureItem, 
  ElectricalElement, 
  WiringRoute, 
  Vector3D,
  FurnitureCategory,
  ElectricalType,
  PipeClearanceConflict,
  DoorwayType,
  LintelType
} from '../types';
import { 
  Maximize2, 
  Layers, 
  RotateCw, 
  Trash2, 
  Plus, 
  Sliders, 
  Eye, 
  Compass, 
  Box, 
  Zap, 
  Cable, 
  Ruler, 
  Lightbulb, 
  Check, 
  Info,
  ChevronRight,
  Move,
  Droplets,
  Flame,
  AlertTriangle,
  ShieldAlert,
  Target,
  CheckCircle2,
  Volume2,
  VolumeX,
  FileText,
  Home,
  DoorOpen
} from 'lucide-react';
import { 
  deriveSanitaryPipes, 
  checkPipeClearanceConflicts, 
  autoFixClearance 
} from '../utils/cadSafetyClearance';
import { soundSynth } from '../utils/audioSynth';
import { detectSharedWall, calculateApartmentMetrics } from '../utils/roomAttachment';
import { CADLayerManager } from './CADLayerManager';

interface CAD3DViewerProps {
  room: RoomConfig;
  rooms?: RoomConfig[];
  activeRoomId?: string;
  onSelectRoom?: (roomId: string) => void;
  onOpenRoomManager?: () => void;
  furniture: FurnitureItem[];
  electrical: ElectricalElement[];
  wiring: WiringRoute[];
  onUpdateFurniture: (items: FurnitureItem[]) => void;
  onUpdateElectrical: (items: ElectricalElement[]) => void;
  onToggleElectricalState: (id: string) => void;
  onUpdateWiring?: (items: WiringRoute[]) => void;
  onUpdateRoom?: (updatedRoom: RoomConfig) => void;
}

export interface SelectedOpeningData {
  wallKey: string;
  roomA: RoomConfig;
  roomB: RoomConfig;
  side: 'north' | 'south' | 'east' | 'west';
  sharedInfo: any;
  configRoom: RoomConfig;
  doorwayType: DoorwayType;
  doorWidth: number;
  doorHeight: number;
  offset: number;
  lintelType: LintelType;
  doorwaySwingSide?: 'left' | 'right';
}

// Architectural 3D text billboard sprite for wall opening badge
function createOpeningTextSprite(title: string, subtitle: string, isSelected: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 136;
  const ctx = canvas.getContext('2d')!;

  // Background rounded card
  ctx.fillStyle = isSelected ? 'rgba(2, 132, 199, 0.95)' : 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.55)';
  ctx.lineWidth = isSelected ? 4 : 2;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 120, 20);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 52);

  // Subtitle
  ctx.fillStyle = isSelected ? '#bae6fd' : '#94a3b8';
  ctx.font = '500 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(subtitle, 256, 94);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.4, 0.38, 1);
  return sprite;
}

// Architectural 3D dimension billboard sprite for distance and measurement labels
function createDimensionSprite(text: string, color = '#818cf8'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 76;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, 68, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 38);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.75, 0.22, 1);
  return sprite;
}

export const CAD3DViewer: React.FC<CAD3DViewerProps> = ({
  room,
  rooms,
  activeRoomId = room.id,
  onSelectRoom,
  onOpenRoomManager,
  furniture,
  electrical,
  wiring,
  onUpdateFurniture,
  onUpdateElectrical,
  onToggleElectricalState,
  onUpdateWiring,
  onUpdateRoom,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const interactiveObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());

  // Multi-room resolution
  const allRooms = useMemo(() => {
    if (rooms && rooms.length > 0) return rooms;
    return [room];
  }, [rooms, room]);

  const activeRoom = useMemo(() => {
    return allRooms.find(r => r.id === activeRoomId) || allRooms[0] || room;
  }, [allRooms, activeRoomId, room]);

  const apartmentMetrics = useMemo(() => {
    return calculateApartmentMetrics(allRooms);
  }, [allRooms]);

  // View settings
  const [viewMode, setViewMode] = useState<'3d' | '2d_top'>('3d');
  const [showFurniture, setShowFurniture] = useState(true);
  const [showElectrical, setShowElectrical] = useState(true);
  const [showWiring, setShowWiring] = useState(true);
  const [showPipes, setShowPipes] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showLighting, setShowLighting] = useState(true);
  const [showLayerManager, setShowLayerManager] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isConflictWarningDismissed, setIsConflictWarningDismissed] = useState(false);
  const hazardBeaconGroupRef = useRef<THREE.Group | null>(null);

  // Layer Preset Handlers
  const handleShowAllLayers = () => {
    setShowFurniture(true);
    setShowElectrical(true);
    setShowWiring(true);
    setShowPipes(true);
    setShowDimensions(true);
    setShowLighting(true);
  };

  const handleHideAllLayers = () => {
    setShowFurniture(false);
    setShowElectrical(false);
    setShowWiring(false);
    setShowPipes(false);
    setShowDimensions(false);
    setShowLighting(false);
  };

  const handleFocusElectrical = () => {
    setShowFurniture(false);
    setShowElectrical(true);
    setShowWiring(true);
    setShowPipes(true);
    setShowDimensions(true);
    setShowLighting(true);
  };

  const handleFocusArchitecture = () => {
    setShowFurniture(true);
    setShowElectrical(false);
    setShowWiring(false);
    setShowPipes(false);
    setShowDimensions(true);
    setShowLighting(true);
  };

  // Selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'furniture' | 'electrical' | 'wall_opening' | null>(null);
  const [selectedOpening, setSelectedOpening] = useState<SelectedOpeningData | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Sanitary piping derived in real-time from furniture placement
  const sanitaryPipes = useMemo(() => {
    return deriveSanitaryPipes(furniture, room, allRooms);
  }, [furniture, room, allRooms]);

  // Real-time clearance conflicts (DIN VDE 0100-520 / DVGW-TRGI)
  const pipeConflicts = useMemo(() => {
    return checkPipeClearanceConflicts(sanitaryPipes, wiring, electrical);
  }, [sanitaryPipes, wiring, electrical]);

  // Clearance violation tracking (alarm muted as per user request)
  const prevConflictCountRef = useRef(0);
  useEffect(() => {
    prevConflictCountRef.current = pipeConflicts.length;
  }, [pipeConflicts.length, soundAlerts]);

  // Active item reference
  const selectedFurniture = useMemo(() => {
    return furniture.find(f => f.id === selectedId) || null;
  }, [furniture, selectedId]);

  const selectedElectrical = useMemo(() => {
    return electrical.find(e => e.id === selectedId) || null;
  }, [electrical, selectedId]);

  // --- THREE.JS SCENE SETUP & RENDER LOOP ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 9, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't look under floor in 3D
    controls.minDistance = 2;
    controls.maxDistance = 25;
    controlsRef.current = controls;

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.85);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    const d = 6;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Subtle blue fill light
    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.35);
    fillLight.position.set(-6, 8, -6);
    scene.add(fillLight);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Real-time pulsing effect for safety hazard beacons and warning rings
      if (hazardBeaconGroupRef.current) {
        const time = Date.now() * 0.006;
        const pulseScale = 1 + 0.3 * Math.sin(time);
        hazardBeaconGroupRef.current.children.forEach(child => {
          if (child.name === 'hazard-ring') {
            child.scale.set(pulseScale, pulseScale, pulseScale);
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Raycaster for object clicking & iPad Touch/Stylus tapping
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const processHit = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const interactives = Array.from(interactiveObjectsRef.current.values());
      const intersects = raycaster.intersectObjects(interactives, true);

      if (intersects.length > 0) {
        // Find top interactive parent
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.id && obj.parent) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.id) {
          if (obj.userData.type === 'room_floor') {
            onSelectRoom?.(obj.userData.id);
            soundSynth.playSnap();
            return;
          }
          if (obj.userData.type === 'wall_opening') {
            setSelectedId(obj.userData.id);
            setSelectedType('wall_opening');
            setSelectedOpening(obj.userData.openingData);
            soundSynth.playConfirmation();
            return;
          }
          setSelectedOpening(null);
          setSelectedId(obj.userData.id);
          setSelectedType(obj.userData.type);
          soundSynth.playConfirmation();
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      processHit(e.clientX, e.clientY);
    };

    // iPad Touch Tap Detection (avoids triggering selection during Orbit pan/pinch)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
        const deltaTime = Date.now() - touchStartTime;

        // If tap moved less than 10px and took under 400ms, it's a deliberate touch tap
        if (deltaX < 10 && deltaY < 10 && deltaTime < 400) {
          processHit(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Switch between 3D Perspective and 2D Top View
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (viewMode === '2d_top') {
      camera.position.set(0, 11, 0.001);
      camera.lookAt(0, 0, 0);
      controls.maxPolarAngle = 0; // Lock to top view
      controls.minPolarAngle = 0;
      controls.enableRotate = false;
    } else {
      camera.position.set(0, 7.5, 9);
      camera.lookAt(0, 0.5, 0);
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.minPolarAngle = 0.1;
      controls.enableRotate = true;
    }
    controls.update();
  }, [viewMode]);

  // Rebuild Scene geometry whenever room, furniture, electrical or wiring changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous dynamic meshes
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if (child.userData?.dynamic) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((child) => scene.remove(child));
    interactiveObjectsRef.current.clear();

    const dynamicGroup = new THREE.Group();
    dynamicGroup.userData = { dynamic: true };
    scene.add(dynamicGroup);

    // 1. FLOORS & ROOM WALLS FOR ALL ATTACHED ROOMS
    const processedSharedWalls = new Set<string>();

    allRooms.forEach((r) => {
      const posX = r.position?.x || 0;
      const posZ = r.position?.z || 0;
      const halfW = r.width / 2;
      const halfL = r.length / 2;
      const wallThickness = r.wallThickness || 0.15;
      const wallHeight = viewMode === '2d_top' ? 0.3 : r.height * 0.75;
      const isActive = r.id === activeRoom.id;

      // Floor geometry with texture-appropriate styling
      let floorColor = 0x1e293b;
      if (r.floorTexture === 'wood_parquet') floorColor = 0x3d2716;
      else if (r.floorTexture === 'tiles_grey') floorColor = 0x1e293b;
      else if (r.floorTexture === 'concrete_modern') floorColor = 0x27272a;
      else if (r.floorTexture === 'carpet_warm') floorColor = 0x2e2532;

      const floorGeo = new THREE.PlaneGeometry(r.width, r.length);
      const floorMat = new THREE.MeshStandardMaterial({
        color: floorColor,
        roughness: 0.75,
        metalness: 0.1,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set(posX, 0, posZ);
      floorMesh.receiveShadow = true;
      floorMesh.userData = { id: r.id, type: 'room_floor', name: r.name };
      dynamicGroup.add(floorMesh);
      interactiveObjectsRef.current.set(`floor_${r.id}`, floorMesh);

      // Room CAD Grid
      const gridCount = Math.max(4, Math.round(Math.max(r.width, r.length)));
      const grid = new THREE.GridHelper(
        Math.max(r.width, r.length) + 0.5,
        gridCount,
        isActive ? 0x38bdf8 : 0x64748b,
        0x334155
      );
      grid.position.set(posX, 0.002, posZ);
      dynamicGroup.add(grid);

      // Room Border Perimeter
      const borderPoints = [
        new THREE.Vector3(posX - halfW, 0.01, posZ - halfL),
        new THREE.Vector3(posX + halfW, 0.01, posZ - halfL),
        new THREE.Vector3(posX + halfW, 0.01, posZ + halfL),
        new THREE.Vector3(posX - halfW, 0.01, posZ + halfL),
        new THREE.Vector3(posX - halfW, 0.01, posZ - halfL),
      ];
      const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
      const borderMat = new THREE.LineBasicMaterial({ 
        color: isActive ? 0x38bdf8 : 0x475569, 
        linewidth: isActive ? 2 : 1 
      });
      const borderLine = new THREE.Line(borderGeo, borderMat);
      dynamicGroup.add(borderLine);

      // 3D Room Name Text / Plaque on Floor
      const plaqueWidth = Math.min(2.2, r.width * 0.5);
      const plaqueHeight = 0.5;
      const plaqueCanvas = document.createElement('canvas');
      plaqueCanvas.width = 512;
      plaqueCanvas.height = 128;
      const ctx = plaqueCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isActive ? 'rgba(2, 132, 199, 0.85)' : 'rgba(30, 41, 59, 0.75)';
        ctx.roundRect(0, 0, 512, 128, 24);
        ctx.fill();
        ctx.strokeStyle = isActive ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 6;
        ctx.roundRect(0, 0, 512, 128, 24);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.name, 256, 48);

        ctx.fillStyle = isActive ? '#bae6fd' : '#94a3b8';
        ctx.font = '28px monospace';
        ctx.fillText(`${r.width}m × ${r.length}m (${(r.width * r.length).toFixed(1)} m²)`, 256, 92);
      }
      const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas);
      const plaqueGeo = new THREE.PlaneGeometry(plaqueWidth, plaqueHeight);
      const plaqueMat = new THREE.MeshBasicMaterial({ 
        map: plaqueTexture, 
        transparent: true, 
        opacity: 0.95 
      });
      const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
      plaqueMesh.rotation.x = -Math.PI / 2;
      plaqueMesh.position.set(posX, 0.015, posZ);
      dynamicGroup.add(plaqueMesh);

      // WALLS FOR ROOM `r`
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.85,
      });

      const sides: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];

      sides.forEach((side) => {
        // Check if this side touches another room
        let adjacentRoom: RoomConfig | null = null;
        let sharedInfo: any = null;

        for (const other of allRooms) {
          if (other.id === r.id) continue;
          const info = detectSharedWall(r, other);
          if (info && info.sharedSide === side) {
            adjacentRoom = other;
            sharedInfo = info;
            break;
          }
        }

        if (adjacentRoom && sharedInfo) {
          const wallKey = [r.id, adjacentRoom.id].sort().join('--') + '--' + (side === 'east' || side === 'west' ? 'EW' : 'NS');
          if (processedSharedWalls.has(wallKey)) return; // already drawn from other side
          processedSharedWalls.add(wallKey);

          // Shared Wall: Doorway / Wanddurchbruch or Solid Partition Wall
          const configRoom = (r.attachedTo === adjacentRoom.id || r.doorwayType !== undefined || r.hasDoorway !== undefined) ? r : adjacentRoom;
          const rawDoorwayType: DoorwayType = configRoom.doorwayType || (configRoom.openTransition ? 'open_arch' : (configRoom.hasDoorway !== false ? 'standard_door' : 'closed_wall'));
          const isClosedWall = rawDoorwayType === 'closed_wall' || (!configRoom.hasDoorway && !configRoom.openTransition && !configRoom.doorwayType);
          const lintelType: LintelType = configRoom.lintelType || 'concrete';
          const isEW = side === 'east' || side === 'west';
          const midCoord = (sharedInfo.startCoord + sharedInfo.endCoord) / 2;

          if (isClosedWall) {
            // Solid partition wall between adjacent rooms
            if (isEW) {
              const wallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, sharedInfo.overlapLength);
              const wall = new THREE.Mesh(wallGeo, wallMat);
              wall.position.set(sharedInfo.wallCoordinate, wallHeight / 2, midCoord);
              dynamicGroup.add(wall);
            } else {
              const wallGeo = new THREE.BoxGeometry(sharedInfo.overlapLength, wallHeight, wallThickness);
              const wall = new THREE.Mesh(wallGeo, wallMat);
              wall.position.set(midCoord, wallHeight / 2, sharedInfo.wallCoordinate);
              dynamicGroup.add(wall);
            }

            // Interactive 3D planning badge on the solid wall (+ Wanddurchbruch planen)
            const isSelected = selectedId === wallKey;
            const badge = createOpeningTextSprite('🧱 Trennwand', '+ Wanddurchbruch anlegen', isSelected);
            const badgeY = viewMode === '2d_top' ? 0.45 : Math.min(1.4, wallHeight * 0.6);
            if (isEW) {
              badge.position.set(sharedInfo.wallCoordinate, badgeY, midCoord);
            } else {
              badge.position.set(midCoord, badgeY, sharedInfo.wallCoordinate);
            }

            const openingData: SelectedOpeningData = {
              wallKey,
              roomA: r,
              roomB: adjacentRoom,
              side,
              sharedInfo,
              configRoom,
              doorwayType: 'closed_wall',
              doorWidth: 0.885,
              doorHeight: 2.05,
              offset: 0,
              lintelType,
              doorwaySwingSide: 'left',
            };
            badge.userData = { id: wallKey, type: 'wall_opening', openingData };
            dynamicGroup.add(badge);
            interactiveObjectsRef.current.set(wallKey, badge);
            return;
          }

          // ARCHITECTURAL WANDDURCHBRUCH / OPENING VISUALIZATION
          const nominalWidth = configRoom.doorwayWidth || (rawDoorwayType === 'wide_opening' ? 1.6 : (rawDoorwayType === 'open_arch' ? 1.2 : 0.885));
          const maxDoorWidth = Math.max(0.6, sharedInfo.overlapLength - 0.3);
          const doorWidth = Math.min(nominalWidth, maxDoorWidth);
          const nominalHeight = configRoom.doorwayHeight || 2.05;
          const doorHeight = Math.min(nominalHeight, wallHeight - 0.05);

          const maxOffset = Math.max(0, (sharedInfo.overlapLength - doorWidth) / 2 - 0.15);
          const offset = Math.max(-maxOffset, Math.min(maxOffset, configRoom.doorwayOffset || 0));
          const centerCoord = midCoord + offset;
          const swingSide = configRoom.doorwaySwingSide || 'left';

          // Wall segments (Pier 1 & Pier 2)
          const p1Len = Math.max(0.04, (centerCoord - doorWidth / 2) - sharedInfo.startCoord);
          const p1Center = sharedInfo.startCoord + p1Len / 2;
          const p2Len = Math.max(0.04, sharedInfo.endCoord - (centerCoord + doorWidth / 2));
          const p2Center = (centerCoord + doorWidth / 2) + p2Len / 2;

          // Sturzwand above door opening
          const lintelWallHeight = Math.max(0.01, wallHeight - doorHeight);
          const lintelWallY = doorHeight + lintelWallHeight / 2;

          // Materials for Wanddurchbruch components
          const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.1 });
          const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.85 });
          const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7, metalness: 0.05 });
          const lintelMat = lintelType === 'steel_heb' ? steelMat : lintelType === 'wood' ? woodMat : concreteMat;
          const casingMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45, metalness: 0.1 });
          const thresholdMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.25, metalness: 0.8 });
          const doorLeafMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.05 });
          const handleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.95 });

          const openingData: SelectedOpeningData = {
            wallKey,
            roomA: r,
            roomB: adjacentRoom,
            side,
            sharedInfo,
            configRoom,
            doorwayType: rawDoorwayType,
            doorWidth,
            doorHeight,
            offset,
            lintelType,
            doorwaySwingSide: swingSide,
          };

          if (isEW) {
            const wx = sharedInfo.wallCoordinate;

            // Pier 1 (North segment)
            const seg1Geo = new THREE.BoxGeometry(wallThickness, wallHeight, p1Len);
            const seg1 = new THREE.Mesh(seg1Geo, wallMat);
            seg1.position.set(wx, wallHeight / 2, p1Center);
            dynamicGroup.add(seg1);

            // Pier 2 (South segment)
            const seg2Geo = new THREE.BoxGeometry(wallThickness, wallHeight, p2Len);
            const seg2 = new THREE.Mesh(seg2Geo, wallMat);
            seg2.position.set(wx, wallHeight / 2, p2Center);
            dynamicGroup.add(seg2);

            // Wall above door (Sturzwand) in 3D
            if (viewMode === '3d' && wallHeight > doorHeight) {
              const topWallGeo = new THREE.BoxGeometry(wallThickness, lintelWallHeight, doorWidth);
              const topWall = new THREE.Mesh(topWallGeo, wallMat);
              topWall.position.set(wx, lintelWallY, centerCoord);
              dynamicGroup.add(topWall);
            }

            // 1. Structural Lintel Beam (Tragender Sturz / Unterzug)
            if (viewMode === '3d' && wallHeight > doorHeight) {
              const lintelSpan = doorWidth + 0.3; // 15cm bearing each side (DIN 1053)
              const lintelGeo = new THREE.BoxGeometry(wallThickness + 0.02, 0.18, lintelSpan);
              const lintelMesh = new THREE.Mesh(lintelGeo, lintelMat);
              lintelMesh.position.set(wx, doorHeight + 0.09, centerCoord);
              lintelMesh.userData = { id: wallKey, type: 'wall_opening', openingData };
              dynamicGroup.add(lintelMesh);
              interactiveObjectsRef.current.set(wallKey, lintelMesh);
            }

            // 2. Opening Casing & Jambs (Laibungszarge)
            if (viewMode === '3d') {
              const jambDepth = 0.045;
              const jambThick = wallThickness + 0.015;
              // Left jamb
              const ljGeo = new THREE.BoxGeometry(jambThick, doorHeight, jambDepth);
              const lj = new THREE.Mesh(ljGeo, casingMat);
              lj.position.set(wx, doorHeight / 2, centerCoord - doorWidth / 2 + jambDepth / 2);
              dynamicGroup.add(lj);
              // Right jamb
              const rjGeo = new THREE.BoxGeometry(jambThick, doorHeight, jambDepth);
              const rj = new THREE.Mesh(rjGeo, casingMat);
              rj.position.set(wx, doorHeight / 2, centerCoord + doorWidth / 2 - jambDepth / 2);
              dynamicGroup.add(rj);
              // Head casing
              const hcGeo = new THREE.BoxGeometry(jambThick, jambDepth, doorWidth);
              const hc = new THREE.Mesh(hcGeo, casingMat);
              hc.position.set(wx, doorHeight - jambDepth / 2, centerCoord);
              dynamicGroup.add(hc);
            }

            // 3. Aluminum Floor Threshold (Boden-Übergangsprofil)
            const threshGeo = new THREE.BoxGeometry(wallThickness + 0.03, 0.012, doorWidth);
            const thresh = new THREE.Mesh(threshGeo, thresholdMat);
            thresh.position.set(wx, 0.008, centerCoord);
            dynamicGroup.add(thresh);

            // 4. Door Leaf & Handle & Floor Swing Arc (if standard_door)
            if (rawDoorwayType === 'standard_door') {
              const hingeZ = swingSide === 'left' ? centerCoord - doorWidth / 2 + 0.03 : centerCoord + doorWidth / 2 - 0.03;
              const leafWidth = doorWidth - 0.04;
              const leafHeight = doorHeight - 0.03;

              if (viewMode === '3d') {
                const doorGroup = new THREE.Group();
                doorGroup.position.set(wx, 0, hingeZ);
                const openAngle = (swingSide === 'left' ? 1 : -1) * (side === 'east' ? 0.75 : -0.75);
                doorGroup.rotation.y = openAngle;

                // Door leaf slab
                const slabGeo = new THREE.BoxGeometry(0.04, leafHeight, leafWidth);
                const slab = new THREE.Mesh(slabGeo, doorLeafMat);
                slab.position.set(0, leafHeight / 2, (swingSide === 'left' ? 1 : -1) * (leafWidth / 2));
                doorGroup.add(slab);

                // Door handle (Türklinke)
                const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12);
                const handle = new THREE.Mesh(handleGeo, handleMat);
                handle.rotation.z = Math.PI / 2;
                handle.position.set(0.035, 1.05, (swingSide === 'left' ? 1 : -1) * (leafWidth - 0.08));
                doorGroup.add(handle);

                dynamicGroup.add(doorGroup);
              }

              // Floor Swing Arc (Dashed 90° arc for clearance)
              const arcPoints: THREE.Vector3[] = [];
              const segments = 16;
              const sign = swingSide === 'left' ? 1 : -1;
              for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * (Math.PI / 2);
                arcPoints.push(new THREE.Vector3(
                  wx + Math.sin(theta) * leafWidth * (side === 'east' ? 1 : -1),
                  0.012,
                  hingeZ + Math.cos(theta) * leafWidth * sign
                ));
              }
              const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
              const arcMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 0.08, gapSize: 0.05 });
              const arcLine = new THREE.Line(arcGeo, arcMat);
              arcLine.computeLineDistances();
              dynamicGroup.add(arcLine);
            }

            // 5. Interactive 3D Planning Sprite Badge
            const isSelected = selectedId === wallKey;
            const badgeTitle = rawDoorwayType === 'standard_door'
              ? `🚪 Innentür ${(doorWidth * 100).toFixed(0)} × ${(doorHeight * 100).toFixed(0)} cm`
              : rawDoorwayType === 'open_arch'
              ? `🏛️ Durchgang ${(doorWidth * 100).toFixed(0)} cm`
              : `🏗️ Wanddurchbruch ${(doorWidth * 100).toFixed(0)} cm`;
            const badgeSub = `${lintelType === 'steel_heb' ? 'HEB-Stahlträger' : lintelType === 'wood' ? 'Holzunterzug' : 'Betonsturz DIN 1053'} • ${r.name.split(' ')[0]} ↔ ${adjacentRoom.name.split(' ')[0]}`;
            const badge = createOpeningTextSprite(badgeTitle, badgeSub, isSelected);
            const badgeY = viewMode === '2d_top' ? 0.45 : Math.min(doorHeight + 0.35, wallHeight + 0.25);
            badge.position.set(wx, badgeY, centerCoord);
            badge.userData = { id: wallKey, type: 'wall_opening', openingData };
            dynamicGroup.add(badge);
            interactiveObjectsRef.current.set(wallKey + '--badge', badge);

          } else {
            // North or South shared wall
            const wz = sharedInfo.wallCoordinate;

            // Pier 1 (West segment)
            const seg1Geo = new THREE.BoxGeometry(p1Len, wallHeight, wallThickness);
            const seg1 = new THREE.Mesh(seg1Geo, wallMat);
            seg1.position.set(p1Center, wallHeight / 2, wz);
            dynamicGroup.add(seg1);

            // Pier 2 (East segment)
            const seg2Geo = new THREE.BoxGeometry(p2Len, wallHeight, wallThickness);
            const seg2 = new THREE.Mesh(seg2Geo, wallMat);
            seg2.position.set(p2Center, wallHeight / 2, wz);
            dynamicGroup.add(seg2);

            // Wall above door (Sturzwand) in 3D
            if (viewMode === '3d' && wallHeight > doorHeight) {
              const topWallGeo = new THREE.BoxGeometry(doorWidth, lintelWallHeight, wallThickness);
              const topWall = new THREE.Mesh(topWallGeo, wallMat);
              topWall.position.set(centerCoord, lintelWallY, wz);
              dynamicGroup.add(topWall);
            }

            // 1. Structural Lintel Beam (Tragender Sturz / Unterzug)
            if (viewMode === '3d' && wallHeight > doorHeight) {
              const lintelSpan = doorWidth + 0.3; // 15cm bearing each side (DIN 1053)
              const lintelGeo = new THREE.BoxGeometry(lintelSpan, 0.18, wallThickness + 0.02);
              const lintelMesh = new THREE.Mesh(lintelGeo, lintelMat);
              lintelMesh.position.set(centerCoord, doorHeight + 0.09, wz);
              lintelMesh.userData = { id: wallKey, type: 'wall_opening', openingData };
              dynamicGroup.add(lintelMesh);
              interactiveObjectsRef.current.set(wallKey, lintelMesh);
            }

            // 2. Opening Casing & Jambs (Laibungszarge)
            if (viewMode === '3d') {
              const jambDepth = 0.045;
              const jambThick = wallThickness + 0.015;
              // Left jamb
              const ljGeo = new THREE.BoxGeometry(jambDepth, doorHeight, jambThick);
              const lj = new THREE.Mesh(ljGeo, casingMat);
              lj.position.set(centerCoord - doorWidth / 2 + jambDepth / 2, doorHeight / 2, wz);
              dynamicGroup.add(lj);
              // Right jamb
              const rjGeo = new THREE.BoxGeometry(jambDepth, doorHeight, jambThick);
              const rj = new THREE.Mesh(rjGeo, casingMat);
              rj.position.set(centerCoord + doorWidth / 2 - jambDepth / 2, doorHeight / 2, wz);
              dynamicGroup.add(rj);
              // Head casing
              const hcGeo = new THREE.BoxGeometry(doorWidth, jambDepth, jambThick);
              const hc = new THREE.Mesh(hcGeo, casingMat);
              hc.position.set(centerCoord, doorHeight - jambDepth / 2, wz);
              dynamicGroup.add(hc);
            }

            // 3. Aluminum Floor Threshold (Boden-Übergangsprofil)
            const threshGeo = new THREE.BoxGeometry(doorWidth, 0.012, wallThickness + 0.03);
            const thresh = new THREE.Mesh(threshGeo, thresholdMat);
            thresh.position.set(centerCoord, 0.008, wz);
            dynamicGroup.add(thresh);

            // 4. Door Leaf & Handle & Floor Swing Arc (if standard_door)
            if (rawDoorwayType === 'standard_door') {
              const hingeX = swingSide === 'left' ? centerCoord - doorWidth / 2 + 0.03 : centerCoord + doorWidth / 2 - 0.03;
              const leafWidth = doorWidth - 0.04;
              const leafHeight = doorHeight - 0.03;

              if (viewMode === '3d') {
                const doorGroup = new THREE.Group();
                doorGroup.position.set(hingeX, 0, wz);
                const openAngle = (swingSide === 'left' ? 1 : -1) * (side === 'south' ? 0.75 : -0.75);
                doorGroup.rotation.y = openAngle;

                // Door leaf slab
                const slabGeo = new THREE.BoxGeometry(leafWidth, leafHeight, 0.04);
                const slab = new THREE.Mesh(slabGeo, doorLeafMat);
                slab.position.set((swingSide === 'left' ? 1 : -1) * (leafWidth / 2), leafHeight / 2, 0);
                doorGroup.add(slab);

                // Door handle (Türklinke)
                const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.12);
                const handle = new THREE.Mesh(handleGeo, handleMat);
                handle.rotation.x = Math.PI / 2;
                handle.position.set((swingSide === 'left' ? 1 : -1) * (leafWidth - 0.08), 1.05, 0.035);
                doorGroup.add(handle);

                dynamicGroup.add(doorGroup);
              }

              // Floor Swing Arc (Dashed 90° arc for clearance)
              const arcPoints: THREE.Vector3[] = [];
              const segments = 16;
              const sign = swingSide === 'left' ? 1 : -1;
              for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * (Math.PI / 2);
                arcPoints.push(new THREE.Vector3(
                  hingeX + Math.cos(theta) * leafWidth * sign,
                  0.012,
                  wz + Math.sin(theta) * leafWidth * (side === 'south' ? 1 : -1)
                ));
              }
              const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
              const arcMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 0.08, gapSize: 0.05 });
              const arcLine = new THREE.Line(arcGeo, arcMat);
              arcLine.computeLineDistances();
              dynamicGroup.add(arcLine);
            }

            // 5. Interactive 3D Planning Sprite Badge
            const isSelected = selectedId === wallKey;
            const badgeTitle = rawDoorwayType === 'standard_door'
              ? `🚪 Innentür ${(doorWidth * 100).toFixed(0)} × ${(doorHeight * 100).toFixed(0)} cm`
              : rawDoorwayType === 'open_arch'
              ? `🏛️ Durchgang ${(doorWidth * 100).toFixed(0)} cm`
              : `🏗️ Wanddurchbruch ${(doorWidth * 100).toFixed(0)} cm`;
            const badgeSub = `${lintelType === 'steel_heb' ? 'HEB-Stahlträger' : lintelType === 'wood' ? 'Holzunterzug' : 'Betonsturz DIN 1053'} • ${r.name.split(' ')[0]} ↔ ${adjacentRoom.name.split(' ')[0]}`;
            const badge = createOpeningTextSprite(badgeTitle, badgeSub, isSelected);
            const badgeY = viewMode === '2d_top' ? 0.45 : Math.min(doorHeight + 0.35, wallHeight + 0.25);
            badge.position.set(centerCoord, badgeY, wz);
            badge.userData = { id: wallKey, type: 'wall_opening', openingData };
            dynamicGroup.add(badge);
            interactiveObjectsRef.current.set(wallKey + '--badge', badge);
          }

          return;
        }

        // Exterior Walls (no adjacent room)
        if (side === 'north') {
          const northWallGeo = new THREE.BoxGeometry(r.width + wallThickness * 2, wallHeight, wallThickness);
          const northWall = new THREE.Mesh(northWallGeo, wallMat);
          northWall.position.set(posX, wallHeight / 2, posZ - halfL - wallThickness / 2);
          northWall.castShadow = true;
          northWall.receiveShadow = true;
          dynamicGroup.add(northWall);
        } else if (side === 'west') {
          const westWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, r.length);
          const westWall = new THREE.Mesh(westWallGeo, wallMat);
          westWall.position.set(posX - halfW - wallThickness / 2, wallHeight / 2, posZ);
          westWall.castShadow = true;
          westWall.receiveShadow = true;
          dynamicGroup.add(westWall);
        } else if (side === 'east') {
          const eastWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, r.length);
          const eastWall = new THREE.Mesh(eastWallGeo, wallMat);
          eastWall.position.set(posX + halfW + wallThickness / 2, wallHeight / 2, posZ);
          eastWall.castShadow = true;
          eastWall.receiveShadow = true;
          dynamicGroup.add(eastWall);
        } else if (side === 'south') {
          const southHeight = viewMode === '2d_top' ? 0.3 : 0.35;
          const southWallGeo = new THREE.BoxGeometry(r.width + wallThickness * 2, southHeight, wallThickness);
          const southWall = new THREE.Mesh(southWallGeo, wallMat);
          southWall.position.set(posX, southHeight / 2, posZ + halfL + wallThickness / 2);
          dynamicGroup.add(southWall);
        }
      });
    });

    // 3. FURNITURE ITEMS
    if (showFurniture) {
      furniture.forEach((f) => {
        const itemGroup = new THREE.Group();
        itemGroup.position.set(f.position.x, f.position.y, f.position.z);
        itemGroup.rotation.y = THREE.MathUtils.degToRad(f.rotation);
        itemGroup.userData = { id: f.id, type: 'furniture', name: f.name };

        const isSelected = f.id === selectedId;

        if (f.isTerrarium || f.type === 'terrarium_tank') {
          // SPECIAL CRAFTED TERRARIUM 3D MODEL
          const tw = f.dimensions.width;
          const td = f.dimensions.depth;
          const th = f.dimensions.height;

          // Black aluminium frame
          const frameGeo = new THREE.BoxGeometry(tw, th, td);
          const frameMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.4,
            metalness: 0.8,
            wireframe: false,
          });
          const frameMesh = new THREE.Mesh(frameGeo, frameMat);
          frameMesh.castShadow = true;
          itemGroup.add(frameMesh);

          // Glass panels (Transparent)
          const glassGeo = new THREE.BoxGeometry(tw * 0.96, th * 0.92, td * 0.96);
          const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.35,
            roughness: 0.1,
            transmission: 0.8,
            thickness: 0.5,
          });
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          itemGroup.add(glassMesh);

          // Desert Sand substrate
          const sandGeo = new THREE.BoxGeometry(tw * 0.94, th * 0.12, td * 0.94);
          const sandMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
          const sandMesh = new THREE.Mesh(sandGeo, sandMat);
          sandMesh.position.y = -th * 0.42;
          itemGroup.add(sandMesh);

          // Climbing branch & Rocks
          const branchGeo = new THREE.CylinderGeometry(0.04, 0.05, tw * 0.7, 8);
          const branchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
          const branchMesh = new THREE.Mesh(branchGeo, branchMat);
          branchMesh.position.set(0, -th * 0.15, 0);
          branchMesh.rotation.z = Math.PI / 4;
          branchMesh.rotation.y = Math.PI / 6;
          itemGroup.add(branchMesh);

          // Lamps Canopy (Top)
          const canopyGeo = new THREE.BoxGeometry(tw * 0.85, 0.08, td * 0.7);
          const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
          const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
          canopyMesh.position.y = th * 0.48;
          itemGroup.add(canopyMesh);

          // Glowing UV Lamp (Purple / Blue accent)
          const uvGeo = new THREE.CylinderGeometry(0.02, 0.02, tw * 0.6, 8);
          const uvMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
          const uvMesh = new THREE.Mesh(uvGeo, uvMat);
          uvMesh.rotation.z = Math.PI / 2;
          uvMesh.position.set(0, th * 0.42, -td * 0.15);
          itemGroup.add(uvMesh);

          // Heat Lamp spot (Golden Warm accent)
          const heatGeo = new THREE.ConeGeometry(0.08, 0.1, 16);
          const heatMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xf59e0b,
            emissiveIntensity: 0.8,
          });
          const heatMesh = new THREE.Mesh(heatGeo, heatMat);
          heatMesh.rotation.x = Math.PI;
          heatMesh.position.set(tw * 0.25, th * 0.4, td * 0.1);
          itemGroup.add(heatMesh);

          // Real PointLight inside terrarium if lighting enabled
          if (showLighting) {
            const terraLight = new THREE.PointLight(0xfef08a, 1.2, 3);
            terraLight.position.set(f.position.x + 0.2, f.position.y + th * 0.3, f.position.z);
            terraLight.castShadow = true;
            dynamicGroup.add(terraLight);
          }
        } else {
          // Standard Furniture Mesh with category details
          const geo = new THREE.BoxGeometry(
            f.dimensions.width,
            f.dimensions.height,
            f.dimensions.depth
          );
          const mat = new THREE.MeshStandardMaterial({
            color: isSelected ? 0x0284c7 : new THREE.Color(f.color),
            roughness: 0.6,
            metalness: 0.1,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          itemGroup.add(mesh);

          // Add top border highlight
          const edges = new THREE.EdgesGeometry(geo);
          const lineMat = new THREE.LineBasicMaterial({
            color: isSelected ? 0x38bdf8 : 0x64748b,
            linewidth: isSelected ? 2 : 1,
          });
          const line = new THREE.LineSegments(edges, lineMat);
          itemGroup.add(line);
        }

        // Selection indicator bounding ring
        if (isSelected) {
          const ringGeo = new THREE.RingGeometry(0.5, 0.65, 32);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = -Math.PI / 2;
          ringMesh.position.y = -f.position.y + 0.02;
          itemGroup.add(ringMesh);
        }

        dynamicGroup.add(itemGroup);
        interactiveObjectsRef.current.set(f.id, itemGroup);
      });
    }

    // 4. ELECTRICAL INSTALLATIONS (Sockets, Switches, Lights, UV Box)
    if (showElectrical) {
      electrical.forEach((el) => {
        const elGroup = new THREE.Group();
        elGroup.position.set(el.position.x, el.position.y, el.position.z);
        elGroup.rotation.y = THREE.MathUtils.degToRad(el.rotation);
        elGroup.userData = { id: el.id, type: 'electrical', name: el.name };

        const isSelected = el.id === selectedId;
        const isActive = el.state !== false;

        // Distinct 3D representations based on electrical type
        if (el.type === 'sub_distribution_panel') {
          // Unterverteilung (UV) - Metal Distribution Enclosure
          const uvGeo = new THREE.BoxGeometry(0.55, 0.8, 0.18);
          const uvMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            roughness: 0.3,
            metalness: 0.7,
          });
          const uvMesh = new THREE.Mesh(uvGeo, uvMat);
          uvMesh.castShadow = true;
          elGroup.add(uvMesh);

          // Glass door / inspection window
          const doorGeo = new THREE.PlaneGeometry(0.48, 0.68);
          const doorMat = new THREE.MeshPhysicalMaterial({
            color: 0x0284c7,
            transparent: true,
            opacity: 0.4,
            roughness: 0.2,
          });
          const doorMesh = new THREE.Mesh(doorGeo, doorMat);
          doorMesh.position.z = 0.095;
          elGroup.add(doorMesh);

          // Green LED status indicator
          const ledGeo = new THREE.SphereGeometry(0.015, 8, 8);
          const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
          const ledMesh = new THREE.Mesh(ledGeo, ledMat);
          ledMesh.position.set(0.2, 0.32, 0.095);
          elGroup.add(ledMesh);
        } else if (el.type.includes('socket')) {
          // Schuko Steckdose (Wall Socket)
          const isDouble = el.type === 'socket_double';
          const isCEE = el.type === 'socket_cee16';
          const sw = isDouble ? 0.16 : isCEE ? 0.14 : 0.09;
          const sh = isCEE ? 0.14 : 0.09;

          const socketGeo = new THREE.BoxGeometry(sw, sh, 0.025);
          const socketMat = new THREE.MeshStandardMaterial({
            color: isCEE ? 0xd97706 : isActive ? 0xffffff : 0x94a3b8,
            roughness: 0.4,
          });
          const socketMesh = new THREE.Mesh(socketGeo, socketMat);
          elGroup.add(socketMesh);

          // Socket holes indicator
          const holeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 12);
          const holeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
          const h1 = new THREE.Mesh(holeGeo, holeMat);
          h1.rotation.x = Math.PI / 2;
          h1.position.set(isDouble ? -0.04 : 0, 0, 0.01);
          elGroup.add(h1);

          if (isDouble) {
            const h2 = new THREE.Mesh(holeGeo, holeMat);
            h2.rotation.x = Math.PI / 2;
            h2.position.set(0.04, 0, 0.01);
            elGroup.add(h2);
          }
        } else if (el.type.includes('switch') || el.type === 'room_thermostat') {
          // Light Switch / Thermostat (at 105cm / 130cm)
          const swGeo = new THREE.BoxGeometry(0.09, 0.09, 0.025);
          const swMat = new THREE.MeshStandardMaterial({
            color: isSelected ? 0x38bdf8 : 0xf8fafc,
            roughness: 0.3,
          });
          const swMesh = new THREE.Mesh(swGeo, swMat);
          elGroup.add(swMesh);

          // Rocker button
          const rockerGeo = new THREE.BoxGeometry(0.065, 0.065, 0.015);
          const rockerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
          const rockerMesh = new THREE.Mesh(rockerGeo, rockerMat);
          rockerMesh.position.z = 0.012;
          elGroup.add(rockerMesh);
        } else if (el.type.includes('light')) {
          // Ceiling Lamp or Wall Spotlight
          const lampGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.08, 24);
          const lampMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            roughness: 0.3,
          });
          const lampMesh = new THREE.Mesh(lampGeo, lampMat);
          elGroup.add(lampMesh);

          // Diffuser Glass (glowing if active)
          const diffGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 24);
          const diffMat = new THREE.MeshBasicMaterial({
            color: isActive ? 0xfffbeb : 0x475569,
          });
          const diffMesh = new THREE.Mesh(diffGeo, diffMat);
          diffMesh.position.y = -0.04;
          elGroup.add(diffMesh);

          // Real 3D PointLight illuminating the room!
          if (showLighting && isActive) {
            const intensity = (el.dimLevel ?? 100) / 100 * 1.5;
            const ceilingLight = new THREE.PointLight(0xfff7ed, intensity, 8);
            ceilingLight.position.set(el.position.x, el.position.y - 0.2, el.position.z);
            ceilingLight.castShadow = true;
            dynamicGroup.add(ceilingLight);
          }
        } else {
          // Generic sensor / smoke detector
          const sensGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
          const sensMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9 });
          const sensMesh = new THREE.Mesh(sensGeo, sensMat);
          elGroup.add(sensMesh);
        }

        // Selection beacon
        if (isSelected) {
          const sphereGeo = new THREE.SphereGeometry(0.06, 12, 12);
          const sphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
          const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
          sphereMesh.position.y = 0.15;
          elGroup.add(sphereMesh);
        }

        dynamicGroup.add(elGroup);
        interactiveObjectsRef.current.set(el.id, elGroup);
      });
    }

    // 5. WIRING & CONDUITS (Verlegepläne nach DIN 18015)
    if (showWiring) {
      wiring.forEach((route) => {
        if (!route.points || route.points.length < 2) return;

        const curvePoints = route.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
        const curve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.1);
        
        // Tube geometry for conduit
        const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.018, 8, false);
        
        // Color coding by cable type:
        // NYM-J 5x2.5 (Red/Stove), NYM-J 3x1.5 (Amber/Sockets), 5x1.5 (Cyan/Light), Terrarium (Emerald)
        let wireColor = 0xf59e0b;
        if (route.cableType.includes('5x2.5')) wireColor = 0xef4444;
        else if (route.cableType.includes('5x1.5')) wireColor = 0x38bdf8;
        else if (route.cableType.includes('Terrarium')) wireColor = 0x10b981;
        else if (route.cableType.includes('CAT')) wireColor = 0x8b5cf6;

        const tubeMat = new THREE.MeshStandardMaterial({
          color: wireColor,
          roughness: 0.4,
          metalness: 0.2,
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        dynamicGroup.add(tubeMesh);

        // Junction dots along points
        route.points.forEach((p) => {
          const dotGeo = new THREE.SphereGeometry(0.028, 8, 8);
          const dotMat = new THREE.MeshBasicMaterial({ color: wireColor });
          const dotMesh = new THREE.Mesh(dotGeo, dotMat);
          dotMesh.position.set(p.x, p.y, p.z);
          dynamicGroup.add(dotMesh);
        });
      });
    }

    // 6. CAD DIMENSIONS (Maßketten & Bemaßungen)
    if (showDimensions) {
      const dimMat = new THREE.LineBasicMaterial({ color: 0x818cf8 });
      const tickMat = new THREE.LineBasicMaterial({ color: 0xa5b4fc });

      allRooms.forEach(r => {
        const rx = r.position?.x || 0;
        const rz = r.position?.z || 0;
        const hw = r.width / 2;
        const hl = r.length / 2;

        // --- Room Width indicator (North wall offset) ---
        const wLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(rx - hw, 0.06, rz - hl - 0.35),
          new THREE.Vector3(rx + hw, 0.06, rz - hl - 0.35),
        ]);
        dynamicGroup.add(new THREE.Line(wLineGeo, dimMat));

        // End Ticks for Width
        const wTick1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(rx - hw, 0.06, rz - hl - 0.45),
          new THREE.Vector3(rx - hw, 0.06, rz - hl - 0.25),
        ]);
        const wTick2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(rx + hw, 0.06, rz - hl - 0.45),
          new THREE.Vector3(rx + hw, 0.06, rz - hl - 0.25),
        ]);
        dynamicGroup.add(new THREE.Line(wTick1, tickMat));
        dynamicGroup.add(new THREE.Line(wTick2, tickMat));

        // Width Measurement Label Sprite
        const wSprite = createDimensionSprite(`${r.width.toFixed(2)} m`, '#818cf8');
        wSprite.position.set(rx, 0.22, rz - hl - 0.55);
        dynamicGroup.add(wSprite);

        // --- Room Length indicator (East wall offset) ---
        const lLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(rx + hw + 0.35, 0.06, rz - hl),
          new THREE.Vector3(rx + hw + 0.35, 0.06, rz + hl),
        ]);
        dynamicGroup.add(new THREE.Line(lLineGeo, dimMat));

        // End Ticks for Length
        const lTick1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(rx + hw + 0.25, 0.06, rz - hl),
          new THREE.Vector3(rx + hw + 0.45, 0.06, rz - hl),
        ]);
        const lTick2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(rx + hw + 0.25, 0.06, rz + hl),
          new THREE.Vector3(rx + hw + 0.45, 0.06, rz + hl),
        ]);
        dynamicGroup.add(new THREE.Line(lTick1, tickMat));
        dynamicGroup.add(new THREE.Line(lTick2, tickMat));

        // Length Measurement Label Sprite
        const lSprite = createDimensionSprite(`${r.length.toFixed(2)} m`, '#818cf8');
        lSprite.position.set(rx + hw + 0.60, 0.22, rz);
        dynamicGroup.add(lSprite);
      });

      // --- Selected Element Clearance Bemaßung to Room Walls ---
      if (selectedId) {
        const selFurn = furniture.find(f => f.id === selectedId);
        const selElec = electrical.find(e => e.id === selectedId);
        const targetRoom = allRooms.find(r => r.id === (selFurn?.roomId || selElec?.roomId || activeRoomId)) || room;
        const itemPos = selFurn ? selFurn.position : (selElec ? selElec.position : null);

        if (itemPos && targetRoom) {
          const rx = targetRoom.position?.x || 0;
          const rz = targetRoom.position?.z || 0;
          const hw = targetRoom.width / 2;
          const hl = targetRoom.length / 2;
          const py = Math.max(0.12, itemPos.y || 0.12);

          const distWest = itemPos.x - (rx - hw);
          const distNorth = itemPos.z - (rz - hl);

          const selDimMat = new THREE.LineDashedMaterial({
            color: 0x6366f1,
            dashSize: 0.1,
            gapSize: 0.05,
          });

          // Dashed dimension to West Wall
          if (distWest > 0.15) {
            const westGeo = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(rx - hw, py, itemPos.z),
              new THREE.Vector3(itemPos.x, py, itemPos.z),
            ]);
            const westLine = new THREE.Line(westGeo, selDimMat);
            westLine.computeLineDistances();
            dynamicGroup.add(westLine);

            const westTag = createDimensionSprite(`X: ${distWest.toFixed(2)} m`, '#6366f1');
            westTag.position.set(rx - hw + distWest / 2, py + 0.2, itemPos.z);
            dynamicGroup.add(westTag);
          }

          // Dashed dimension to North Wall
          if (distNorth > 0.15) {
            const northGeo = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(itemPos.x, py, rz - hl),
              new THREE.Vector3(itemPos.x, py, itemPos.z),
            ]);
            const northLine = new THREE.Line(northGeo, selDimMat);
            northLine.computeLineDistances();
            dynamicGroup.add(northLine);

            const northTag = createDimensionSprite(`Y: ${distNorth.toFixed(2)} m`, '#6366f1');
            northTag.position.set(itemPos.x, py + 0.2, rz - hl + distNorth / 2);
            dynamicGroup.add(northTag);
          }
        }
      }
    }

    // 7. SANITARY PIPES & SAFETY CLEARANCE BEACONS (DIN VDE 0100-520 / DVGW-TRGI)
    if (showPipes) {
      sanitaryPipes.forEach((sys) => {
        sys.segments.forEach((pipe) => {
          const startVec = pipe.start;
          const endVec = pipe.end;
          const dir = new THREE.Vector3().subVectors(endVec, startVec);
          const len = dir.length();
          if (len < 0.01) return;

          // Pipe cylinder geometry
          const pipeGeo = new THREE.CylinderGeometry(pipe.radius, pipe.radius, len, 16);
          const pipeMat = new THREE.MeshStandardMaterial({
            color: pipe.color,
            roughness: 0.35,
            metalness: 0.5,
          });
          const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
          const mid = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
          pipeMesh.position.copy(mid);
          pipeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
          dynamicGroup.add(pipeMesh);

          // Metal pipe clamps onto wall
          const bracketCount = Math.max(2, Math.floor(len / 0.35));
          for (let b = 0; b <= bracketCount; b++) {
            const bt = b / bracketCount;
            const bPos = new THREE.Vector3().lerpVectors(startVec, endVec, bt);
            const clampGeo = new THREE.CylinderGeometry(pipe.radius * 1.35, pipe.radius * 1.35, 0.02, 12);
            const clampMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
            const clampMesh = new THREE.Mesh(clampGeo, clampMat);
            clampMesh.position.copy(bPos);
            clampMesh.quaternion.copy(pipeMesh.quaternion);
            dynamicGroup.add(clampMesh);
          }
        });
      });

      // 3D Hazard Beacons and measurement lines for DIN clearance violations
      const hazardGroup = new THREE.Group();
      hazardBeaconGroupRef.current = hazardGroup;

      pipeConflicts.forEach((conf) => {
        const confPos = new THREE.Vector3(conf.location.x, conf.location.y, conf.location.z);

        // Warning core beacon
        const beaconGeo = new THREE.SphereGeometry(0.065, 16, 16);
        const beaconMat = new THREE.MeshStandardMaterial({
          color: conf.severity === 'critical' ? 0xef4444 : 0xf59e0b,
          emissive: conf.severity === 'critical' ? 0xdc2626 : 0xd97706,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.copy(confPos);
        hazardGroup.add(beaconMesh);

        // Pulsing warning ring
        const ringGeo = new THREE.TorusGeometry(0.12, 0.012, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: conf.severity === 'critical' ? 0xff2222 : 0xffaa00,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.name = 'hazard-ring';
        ringMesh.position.copy(confPos);
        ringMesh.rotation.x = Math.PI / 2;
        hazardGroup.add(ringMesh);

        // Local hazard illumination
        const hazardLight = new THREE.PointLight(conf.severity === 'critical' ? 0xef4444 : 0xf59e0b, 1.2, 1.5);
        hazardLight.position.copy(confPos);
        hazardGroup.add(hazardLight);
      });

      dynamicGroup.add(hazardGroup);
    }

  }, [room, furniture, electrical, wiring, selectedId, showFurniture, showElectrical, showWiring, showPipes, showDimensions, showLighting, viewMode, sanitaryPipes, pipeConflicts]);

  // Object Movement Handler
  const handleMoveObject = (axis: 'x' | 'z' | 'y', delta: number) => {
    if (selectedType === 'furniture' && selectedFurniture) {
      const updated = furniture.map(f => {
        if (f.id === selectedFurniture.id) {
          const pos = { ...f.position };
          pos[axis] = Number((pos[axis] + delta).toFixed(2));
          return { ...f, position: pos };
        }
        return f;
      });
      onUpdateFurniture(updated);
    } else if (selectedType === 'electrical' && selectedElectrical) {
      const updated = electrical.map(el => {
        if (el.id === selectedElectrical.id) {
          const pos = { ...el.position };
          pos[axis] = Number((pos[axis] + delta).toFixed(2));
          return { ...el, position: pos };
        }
        return el;
      });
      onUpdateElectrical(updated);
    }
  };

  // Object Rotation Handler
  const handleRotateObject = (deltaDeg: number) => {
    if (selectedType === 'furniture' && selectedFurniture) {
      const updated = furniture.map(f => {
        if (f.id === selectedFurniture.id) {
          return { ...f, rotation: (f.rotation + deltaDeg) % 360 };
        }
        return f;
      });
      onUpdateFurniture(updated);
    } else if (selectedType === 'electrical' && selectedElectrical) {
      const updated = electrical.map(el => {
        if (el.id === selectedElectrical.id) {
          return { ...el, rotation: (el.rotation + deltaDeg) % 360 };
        }
        return el;
      });
      onUpdateElectrical(updated);
    }
  };

  // Dimension scaling handler
  const handleScaleDimension = (dim: 'width' | 'depth' | 'height', delta: number) => {
    if (selectedType === 'furniture' && selectedFurniture) {
      const updated = furniture.map(f => {
        if (f.id === selectedFurniture.id) {
          const dims = { ...f.dimensions };
          dims[dim] = Math.max(0.2, Number((dims[dim] + delta).toFixed(2)));
          return { ...f, dimensions: dims };
        }
        return f;
      });
      onUpdateFurniture(updated);
    }
  };

  // Delete handler
  const handleDeleteSelected = () => {
    if (selectedType === 'furniture' && selectedFurniture) {
      onUpdateFurniture(furniture.filter(f => f.id !== selectedFurniture.id));
      setSelectedId(null);
    } else if (selectedType === 'electrical' && selectedElectrical) {
      onUpdateElectrical(electrical.filter(el => el.id !== selectedElectrical.id));
      setSelectedId(null);
    }
  };

  // Add Item Handler
  const handleAddFurniture = (category: FurnitureCategory, name: string, w: number, d: number, h: number, color: string) => {
    const rx = activeRoom.position?.x || 0;
    const rz = activeRoom.position?.z || 0;
    const newItem: FurnitureItem = {
      id: `furn-${Date.now()}`,
      type: category,
      name,
      roomId: activeRoom.id,
      position: { x: rx, y: h / 2, z: rz },
      rotation: 0,
      dimensions: { width: w, depth: d, height: h },
      color,
      isTerrarium: category === 'terrarium_tank',
    };
    onUpdateFurniture([...furniture, newItem]);
    setSelectedId(newItem.id);
    setSelectedType('furniture');
    setShowAddMenu(false);
  };

  const handleAddElectrical = (type: ElectricalType, name: string, defaultHeightCm: number, circuitId: string, watts: number) => {
    const isCeiling = type.includes('light');
    const rx = activeRoom.position?.x || 0;
    const rz = activeRoom.position?.z || 0;
    const newItem: ElectricalElement = {
      id: `el-${Date.now()}`,
      type,
      name,
      roomId: activeRoom.id,
      position: { x: rx, y: isCeiling ? activeRoom.height - 0.05 : defaultHeightCm / 100, z: rz },
      rotation: 0,
      heightFromFloorCm: defaultHeightCm,
      circuitId,
      wallSnapped: isCeiling ? 'ceiling' : 'floor',
      state: true,
      powerWatts: watts,
    };
    onUpdateElectrical([...electrical, newItem]);
    setSelectedId(newItem.id);
    setSelectedType('electrical');
    setShowAddMenu(false);
  };

  // Camera focus on conflict location
  const handleFocusConflict = (conf: PipeClearanceConflict) => {
    if (!controlsRef.current || !cameraRef.current) return;
    const targetVec = new THREE.Vector3(conf.location.x, conf.location.y, conf.location.z);
    controlsRef.current.target.copy(targetVec);
    cameraRef.current.position.set(conf.location.x + 1.1, conf.location.y + 0.8, conf.location.z + 1.4);
    controlsRef.current.update();
    soundSynth.playConfirmation();
  };

  // 1-Click DIN resolution: auto-route cable away from pipe
  const handleAutoFixConflict = (conf: PipeClearanceConflict) => {
    if (onUpdateWiring) {
      const updated = autoFixClearance(conf, wiring);
      onUpdateWiring(updated);
      soundSynth.playConfirmation();
    }
  };

  // iPad & Tablet Touch Navigation Handlers
  const handleRotateTouch = (direction: 'left' | 'right') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const angle = direction === 'left' ? Math.PI / 4 : -Math.PI / 4;
    const cam = cameraRef.current;
    const x = cam.position.x;
    const z = cam.position.z;
    cam.position.x = x * Math.cos(angle) - z * Math.sin(angle);
    cam.position.z = x * Math.sin(angle) + z * Math.cos(angle);
    cam.lookAt(0, 0, 0);
    controlsRef.current.update();
    soundSynth.playConfirmation();
  };

  const handleZoomTouch = (delta: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const factor = delta > 0 ? 0.85 : 1.18;
    cam.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  const handleResetCameraTouch = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    if (viewMode === '3d') {
      cameraRef.current.position.set(0, 9, 10);
      cameraRef.current.lookAt(0, 0, 0);
    } else {
      cameraRef.current.position.set(0, 14, 0.001);
      cameraRef.current.lookAt(0, 0, 0);
    }
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    soundSynth.playConfirmation();
  };

  const handleFocusOpening = (opening: SelectedOpeningData) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const isEW = opening.side === 'east' || opening.side === 'west';
    const midX = (opening.sharedInfo.startCoord + opening.sharedInfo.endCoord) / 2;
    const midZ = (opening.sharedInfo.startCoord + opening.sharedInfo.endCoord) / 2;
    const wx = isEW ? opening.sharedInfo.wallCoordinate : midX + opening.offset;
    const wz = !isEW ? opening.sharedInfo.wallCoordinate : midZ + opening.offset;

    controlsRef.current.target.set(wx, 1.1, wz);
    cameraRef.current.position.set(
      wx + (isEW ? (opening.side === 'east' ? 3.0 : -3.0) : 0),
      2.0,
      wz + (!isEW ? (opening.side === 'south' ? 3.0 : -3.0) : 0)
    );
    controlsRef.current.update();
    soundSynth.playSnap();
  };

  const handleUpdateOpening = (updates: Partial<RoomConfig>) => {
    if (!selectedOpening) return;
    const targetRoom = selectedOpening.configRoom;
    const updatedRoom: RoomConfig = {
      ...targetRoom,
      ...updates,
      openTransition: (updates.doorwayType ?? selectedOpening.doorwayType) === 'open_arch' || (updates.doorwayType ?? selectedOpening.doorwayType) === 'wide_opening',
    };
    onUpdateRoom?.(updatedRoom);
    setSelectedOpening(prev => prev ? {
      ...prev,
      configRoom: updatedRoom,
      doorwayType: updates.doorwayType ?? prev.doorwayType,
      doorWidth: updates.doorwayWidth ?? prev.doorWidth,
      doorHeight: updates.doorwayHeight ?? prev.doorHeight,
      offset: updates.doorwayOffset !== undefined ? updates.doorwayOffset : prev.offset,
      lintelType: updates.lintelType ?? prev.lintelType,
      doorwaySwingSide: updates.doorwaySwingSide ?? prev.doorwaySwingSide,
    } : null);
    soundSynth.playClick();
  };

  const handleToggleOpeningsPlanner = () => {
    for (let i = 0; i < allRooms.length; i++) {
      for (let j = 0; j < allRooms.length; j++) {
        if (i === j) continue;
        const info = detectSharedWall(allRooms[i], allRooms[j]);
        if (info) {
          const wallKey = [allRooms[i].id, allRooms[j].id].sort().join('--') + '--' + (info.sharedSide === 'east' || info.sharedSide === 'west' ? 'EW' : 'NS');
          const configRoom = (allRooms[i].attachedTo === allRooms[j].id || allRooms[i].hasDoorway !== undefined || allRooms[i].doorwayType !== undefined) ? allRooms[i] : allRooms[j];
          const doorwayType = configRoom.doorwayType || (configRoom.openTransition ? 'open_arch' : (configRoom.hasDoorway !== false ? 'standard_door' : 'closed_wall'));
          const nominalWidth = configRoom.doorwayWidth || (doorwayType === 'wide_opening' ? 1.6 : (doorwayType === 'open_arch' ? 1.2 : 0.885));
          const doorWidth = Math.min(nominalWidth, Math.max(0.6, info.overlapLength - 0.3));
          const doorHeight = Math.min(configRoom.doorwayHeight || 2.05, 2.6 - 0.1);
          const offset = configRoom.doorwayOffset || 0;

          const openingData: SelectedOpeningData = {
            wallKey,
            roomA: allRooms[i],
            roomB: allRooms[j],
            side: info.sharedSide,
            sharedInfo: info,
            configRoom,
            doorwayType,
            doorWidth,
            doorHeight,
            offset,
            lintelType: configRoom.lintelType || 'concrete',
            doorwaySwingSide: configRoom.doorwaySwingSide || 'left',
          };

          setSelectedId(wallKey);
          setSelectedType('wall_opening');
          setSelectedOpening(openingData);
          handleFocusOpening(openingData);
          return;
        }
      }
    }
    onOpenRoomManager?.();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* iPad & Tablet Touch Quick Navigation Pad */}
      <div className="absolute top-20 right-3 z-20 pointer-events-auto flex flex-col items-center gap-1.5 p-1.5 bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="text-[9px] font-extrabold text-sky-400 uppercase tracking-widest px-1 py-0.5">
          Touch CAD
        </div>
        <button
          onClick={() => handleRotateTouch('left')}
          className="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition active:scale-90"
          title="45° nach links drehen"
        >
          <RotateCw className="w-4 h-4 -scale-x-100" />
        </button>
        <button
          onClick={() => handleRotateTouch('right')}
          className="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition active:scale-90"
          title="45° nach rechts drehen"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <div className="w-6 h-[1px] bg-slate-800 my-0.5" />
        <button
          onClick={() => handleZoomTouch(1)}
          className="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-base flex items-center justify-center transition active:scale-90"
          title="Heranzoomen"
        >
          +
        </button>
        <button
          onClick={() => handleZoomTouch(-1)}
          className="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-base flex items-center justify-center transition active:scale-90"
          title="Herauszoomen"
        >
          −
        </button>
        <div className="w-6 h-[1px] bg-slate-800 my-0.5" />
        <button
          onClick={handleResetCameraTouch}
          className="w-10 h-10 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 flex items-center justify-center transition active:scale-90 border border-sky-500/30"
          title="Kamera zentrieren (Home-Position)"
        >
          <Target className="w-4 h-4" />
        </button>
      </div>
      {/* CAD Canvas Top Action Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* View Mode & Layers Toolbar */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              viewMode === '3d'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            3D Perspektive
          </button>
          <button
            onClick={() => setViewMode('2d_top')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              viewMode === '2d_top'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            2D CAD Grundriss
          </button>

          <div className="w-[1px] h-4 bg-slate-750 mx-1" />

          {/* Dedicated Layer-Manager Panel Toggle */}
          <button
            onClick={() => {
              soundSynth.playClick();
              setShowLayerManager(!showLayerManager);
            }}
            title="CAD Layer-Manager öffnen (Möbel, Elektro, Bemaßungen einzeln steuern)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showLayerManager
                ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${showLayerManager ? 'text-slate-950' : 'text-sky-400'}`} />
            <span className="hidden sm:inline">Layer-Manager</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-750 mx-0.5" />

          {/* Quick Layer toggles */}
          <button
            onClick={() => setShowFurniture(!showFurniture)}
            title="Möbel ein/ausblenden"
            className={`p-1.5 rounded-lg text-xs transition ${
              showFurniture ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:bg-slate-800'
            }`}
          >
            <Box className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowElectrical(!showElectrical)}
            title="Elektroinstallationen ein/ausblenden"
            className={`p-1.5 rounded-lg text-xs transition ${
              showElectrical ? 'bg-slate-800 text-amber-400' : 'text-slate-500 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowWiring(!showWiring)}
            title="Kabeltrassen & Verrohrung ein/ausblenden"
            className={`p-1.5 rounded-lg text-xs transition ${
              showWiring ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:bg-slate-800'
            }`}
          >
            <Cable className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPipes(!showPipes)}
            title="Sanitär- & Gasleitungen (DIN 1988 / DVGW) ein/ausblenden"
            className={`p-1.5 rounded-lg text-xs transition relative ${
              showPipes ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:bg-slate-800'
            }`}
          >
            <Droplets className="w-4 h-4" />
            {pipeConflicts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setShowLighting(!showLighting)}
            title="Live-Lichtsimulation"
            className={`p-1.5 rounded-lg text-xs transition ${
              showLighting ? 'bg-slate-800 text-yellow-300' : 'text-slate-500 hover:bg-slate-800'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            title="Bemaßungsketten"
            className={`p-1.5 rounded-lg text-xs transition ${
              showDimensions ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSoundAlerts(!soundAlerts)}
            title={soundAlerts ? 'Akustischer Sicherheitsalarm aktiv' : 'Alarm stummgeschaltet'}
            className={`p-1.5 rounded-lg text-xs transition ${
              soundAlerts ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-800'
            }`}
          >
            {soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Action: Add Object to Room & Multi-Room Manager */}
        <div className="pointer-events-auto flex items-center gap-2">
          {onOpenRoomManager && (
            <button
              onClick={onOpenRoomManager}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-sky-500/30 transition active:scale-95 shadow"
              title="Räume ansetzen und verwalten"
            >
              <Home className="w-3.5 h-3.5 text-sky-400" />
              <span>Räume ({allRooms.length})</span>
            </button>
          )}

          {allRooms.length > 1 && (
            <button
              onClick={handleToggleOpeningsPlanner}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 shadow ${
                selectedType === 'wall_opening'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sky-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/30'
              }`}
              title="Wanddurchbrüche & Raumübergänge planen"
            >
              <DoorOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Wanddurchbrüche</span>
            </button>
          )}

          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            Objekt platzieren
          </button>
        </div>
      </div>

      {/* THREE.JS RENDER CANVAS */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Floating Room Info Bar at Bottom-Left */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex flex-col gap-1.5">
        <div className="pointer-events-auto px-3.5 py-2.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 text-xs shadow-2xl flex flex-col gap-2 max-w-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeRoom.name}</span>
            </div>
            {onOpenRoomManager && (
              <button
                onClick={onOpenRoomManager}
                className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-[10px] font-bold border border-sky-400/40 transition"
              >
                + Raum ansetzen
              </button>
            )}
          </div>

          {/* Quick Room Switcher Tabs */}
          {allRooms.length > 1 && (
            <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-800">
              {allRooms.map((r, idx) => {
                const isRActive = r.id === activeRoom.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => onSelectRoom?.(r.id)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
                      isRActive
                        ? 'bg-sky-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                    }`}
                  >
                    R{idx + 1}: {r.name.split(' ')[0]} ({(r.width * r.length).toFixed(0)}m²)
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-[11px] text-slate-400 flex items-center justify-between gap-2 pt-0.5">
            <span>Maße: <strong className="text-slate-200">{activeRoom.width}m × {activeRoom.length}m</strong> ({(activeRoom.width * activeRoom.length).toFixed(1)} m²)</span>
            <span className="text-slate-500">•</span>
            <span>Gesamt: <strong className="text-emerald-400">{apartmentMetrics.totalAreaSqM.toFixed(1)} m²</strong> ({allRooms.length} {allRooms.length === 1 ? 'Raum' : 'Räume'})</span>
          </div>
        </div>
      </div>

      {/* KLEINE INFO-WARNUNG UNTEN IN DER ECKE (DIN VDE 0100-520) */}
      {pipeConflicts.length > 0 && (
        <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
          {isConflictWarningDismissed ? (
            <button
              onClick={() => setIsConflictWarningDismissed(false)}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-400 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs transition active:scale-95"
              title={`${pipeConflicts.length} Abstandswarnung(en) – Klicken zum Einblenden`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full">
                {pipeConflicts.length}
              </span>
            </button>
          ) : (
            <div className="p-2.5 bg-slate-900/95 hover:bg-slate-900 border border-amber-500/40 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2.5 text-xs text-amber-200 transition select-none animate-in fade-in slide-in-from-bottom-2 max-w-sm">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>

              <div 
                onClick={() => setShowConflictModal(true)}
                className="flex flex-col cursor-pointer hover:opacity-90 transition pr-1"
                title="Klicken für vollständige DIN VDE 0100-520 Prüfdetails"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-amber-300">
                    Abstand &lt; 20 cm ({pipeConflicts[0].actualDistanceCm} cm)
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                    {pipeConflicts[0].type === 'water' ? 'Wasser' : 'Gas'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-[170px]">
                  {pipeConflicts[0].routeName} ({pipeConflicts[0].furnitureName})
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0 border-l border-slate-800 pl-2">
                {onUpdateWiring && (
                  <button
                    onClick={() => handleAutoFixConflict(pipeConflicts[0])}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white text-[10px] font-bold border border-amber-400/40 transition active:scale-95"
                    title="Kabeltrasse automatisch normgerecht anpassen"
                  >
                    Fix
                  </button>
                )}
                <button
                  onClick={() => setIsConflictWarningDismissed(true)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Warnung minimieren"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OBJECT INSPECTOR / CAD PROPERTY PANEL (Right Side Overlay) */}
      {(selectedFurniture || selectedElectrical) && (
        <div className="absolute top-16 right-4 z-30 w-80 p-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-150">
          <div className="flex items-start justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                {selectedType === 'furniture' ? 'Möbelstück / CAD Objekt' : 'Elektroinstallation DIN 18015'}
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {selectedFurniture?.name || selectedElectrical?.name}
              </h4>
            </div>
            <button
              onClick={() => { setSelectedId(null); setSelectedType(null); }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Interactive Direct Toggle for Electrical Elements */}
          {selectedElectrical && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">Schaltzustand</span>
                <p className="text-[10px] text-slate-400">
                  {selectedElectrical.state !== false ? 'Aktiv (Spannung anliegend)' : 'Ausgeschaltet'}
                </p>
              </div>
              <button
                onClick={() => onToggleElectricalState(selectedElectrical.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  selectedElectrical.state !== false
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {selectedElectrical.state !== false ? 'AN' : 'AUS'}
              </button>
            </div>
          )}

          {/* Position Adjustments (X, Z, Y) */}
          <div className="mt-3 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Move className="w-3.5 h-3.5 text-sky-400" />
              Position im Raum (Raster 0.1m)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">X (Breite)</span>
                <span className="text-xs font-bold text-slate-100 my-0.5">
                  {(selectedFurniture?.position.x ?? selectedElectrical?.position.x)?.toFixed(2)}m
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleMoveObject('x', -0.1)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded">-</button>
                  <button onClick={() => handleMoveObject('x', 0.1)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded">+</button>
                </div>
              </div>

              <div className="flex flex-col items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Z (Tiefe)</span>
                <span className="text-xs font-bold text-slate-100 my-0.5">
                  {(selectedFurniture?.position.z ?? selectedElectrical?.position.z)?.toFixed(2)}m
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleMoveObject('z', -0.1)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded">-</button>
                  <button onClick={() => handleMoveObject('z', 0.1)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded">+</button>
                </div>
              </div>

              <div className="flex flex-col items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Y (Höhe)</span>
                <span className="text-xs font-bold text-slate-100 my-0.5">
                  {(selectedFurniture?.position.y ?? selectedElectrical?.position.y)?.toFixed(2)}m
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleMoveObject('y', -0.05)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded">-</button>
                  <button onClick={() => handleMoveObject('y', 0.05)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Furniture Dimensions Adjustment (Maße) */}
          {selectedFurniture && (
            <div className="mt-3 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-indigo-400" />
                Abmessungen anpassen (B × T × H)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400">Breite (X)</span>
                  <span className="text-xs font-bold text-slate-100">{selectedFurniture.dimensions.width.toFixed(2)}m</span>
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => handleScaleDimension('width', -0.1)} className="px-1 bg-slate-800 text-xs rounded">-</button>
                    <button onClick={() => handleScaleDimension('width', 0.1)} className="px-1 bg-slate-800 text-xs rounded">+</button>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400">Tiefe (Z)</span>
                  <span className="text-xs font-bold text-slate-100">{selectedFurniture.dimensions.depth.toFixed(2)}m</span>
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => handleScaleDimension('depth', -0.1)} className="px-1 bg-slate-800 text-xs rounded">-</button>
                    <button onClick={() => handleScaleDimension('depth', 0.1)} className="px-1 bg-slate-800 text-xs rounded">+</button>
                  </div>
                </div>

                <div className="flex flex-col items-center bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400">Höhe (Y)</span>
                  <span className="text-xs font-bold text-slate-100">{selectedFurniture.dimensions.height.toFixed(2)}m</span>
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => handleScaleDimension('height', -0.1)} className="px-1 bg-slate-800 text-xs rounded">-</button>
                    <button onClick={() => handleScaleDimension('height', 0.1)} className="px-1 bg-slate-800 text-xs rounded">+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rotation & Actions */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              onClick={() => handleRotateObject(45)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5 text-sky-400" />
              Drehen (+45°)
            </button>

            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Löschen
            </button>
          </div>
        </div>
      )}

      {/* WANDDURCHBRUCH & RAUMÜBERGANG INSPECTOR / CAD PROPERTY PANEL */}
      {selectedType === 'wall_opening' && selectedOpening && (
        <div className="absolute top-16 right-4 z-30 w-84 p-4 bg-slate-900/95 backdrop-blur-md border border-sky-500/40 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-150">
          <div className="flex items-start justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <DoorOpen className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Wanddurchbruch & Übergang
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {selectedOpening.roomA.name.split(' ')[0]} ↔ {selectedOpening.roomB.name.split(' ')[0]}
                </h4>
              </div>
            </div>
            <button
              onClick={() => { setSelectedId(null); setSelectedType(null); setSelectedOpening(null); }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-3.5 text-xs">
            {/* Opening Type Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Ausführung des Übergangs
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'standard_door', label: 'Innentür', icon: '🚪' },
                  { id: 'open_arch', label: 'Offener Durchgang', icon: '🏛️' },
                  { id: 'wide_opening', label: 'Breiter Durchbruch', icon: '🏗️' },
                  { id: 'closed_wall', label: 'Wand schließen', icon: '🧱' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleUpdateOpening({ doorwayType: opt.id as DoorwayType, hasDoorway: opt.id !== 'closed_wall' })}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                      selectedOpening.doorwayType === opt.id
                        ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span className="text-[11px]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedOpening.doorwayType !== 'closed_wall' ? (
              <>
                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Breite (m)
                    </label>
                    <select
                      value={selectedOpening.doorWidth}
                      onChange={e => handleUpdateOpening({ doorwayWidth: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    >
                      <option value={0.75}>0.75 m (Schmal)</option>
                      <option value={0.885}>0.885 m (DIN 18101)</option>
                      <option value={1.00}>1.00 m</option>
                      <option value={1.20}>1.20 m (Groß)</option>
                      <option value={1.60}>1.60 m (Doppeltür)</option>
                      <option value={2.00}>2.00 m (Raumteiler)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Höhe (m)
                    </label>
                    <select
                      value={selectedOpening.doorHeight}
                      onChange={e => handleUpdateOpening({ doorwayHeight: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    >
                      <option value={2.00}>2.00 m</option>
                      <option value={2.05}>2.05 m (DIN)</option>
                      <option value={2.10}>2.10 m</option>
                      <option value={2.30}>2.30 m</option>
                    </select>
                  </div>
                </div>

                {/* Lintel Type Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Tragender Sturz (Statik & Unterzug)
                  </label>
                  <select
                    value={selectedOpening.lintelType}
                    onChange={e => handleUpdateOpening({ lintelType: e.target.value as LintelType })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="concrete">Betonsturz DIN 1053 (Standard)</option>
                    <option value="steel_heb">HEB-Stahlträger (Große Lasten)</option>
                    <option value="wood">Holzbalken / Unterzug (Sichtbalken)</option>
                  </select>
                </div>

                {/* Horizontal Position Offset slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                    <span>Position / Versatz</span>
                    <span className="font-mono text-sky-400">
                      {selectedOpening.offset >= 0 ? `+${selectedOpening.offset.toFixed(2)}` : selectedOpening.offset.toFixed(2)} m
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateOpening({ doorwayOffset: Number((selectedOpening.offset - 0.1).toFixed(2)) })}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                    >
                      ◀
                    </button>
                    <input
                      type="range"
                      min="-1.5"
                      max="1.5"
                      step="0.05"
                      value={selectedOpening.offset}
                      onChange={e => handleUpdateOpening({ doorwayOffset: Number(e.target.value) })}
                      className="flex-1 accent-sky-500 cursor-pointer"
                    />
                    <button
                      onClick={() => handleUpdateOpening({ doorwayOffset: Number((selectedOpening.offset + 0.1).toFixed(2)) })}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                {/* Door Swing Side (for standard_door) */}
                {selectedOpening.doorwayType === 'standard_door' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Türanschlag (DIN links / DIN rechts)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUpdateOpening({ doorwaySwingSide: 'left' })}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-semibold transition ${
                          selectedOpening.doorwaySwingSide !== 'right'
                            ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400'
                        }`}
                      >
                        DIN Links
                      </button>
                      <button
                        onClick={() => handleUpdateOpening({ doorwaySwingSide: 'right' })}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-semibold transition ${
                          selectedOpening.doorwaySwingSide === 'right'
                            ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400'
                        }`}
                      >
                        DIN Rechts
                      </button>
                    </div>
                  </div>
                )}

                {/* Focus in 3D camera button */}
                <button
                  onClick={() => handleFocusOpening(selectedOpening)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 border border-sky-500/30"
                >
                  <Target className="w-3.5 h-3.5" />
                  Kamera auf Durchbruch ausrichten
                </button>
              </>
            ) : (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                Die Wand zwischen den Räumen ist aktuell als geschlossene Massivwand ausgeführt.
                Klicke oben auf eine Durchgangsart, um den Durchbruch visuell einzufügen.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD ITEM POPUP MODAL */}
      {showAddMenu && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Box className="w-5 h-5 text-sky-400" />
                Neues CAD Objekt hinzufügen
              </h3>
              <button 
                onClick={() => setShowAddMenu(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Furniture Presets */}
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Möbel & Ausstattung
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAddFurniture('terrarium_tank', 'Großterrarium (160x70x100cm)', 1.6, 0.7, 1.0, '#064e3b')}
                  className="p-3 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/60 rounded-xl text-left transition group"
                >
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    🦎 Wüsten/Regenwald Terrarium
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">160 × 70 × 100 cm Glaskorpus mit Beleuchtungskasten</p>
                </button>

                <button
                  onClick={() => handleAddFurniture('sofa', 'Sofa 3-Sitzer', 2.2, 0.95, 0.85, '#334155')}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200">Couch / Sofa 3-Sitzer</span>
                  <p className="text-[11px] text-slate-400 mt-1">2.2 × 0.95 × 0.85 m</p>
                </button>

                <button
                  onClick={() => handleAddFurniture('table', 'Esstisch Designer', 1.6, 0.9, 0.76, '#854d0e')}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200">Esstisch Eiche</span>
                  <p className="text-[11px] text-slate-400 mt-1">1.6 × 0.9 × 0.76 m</p>
                </button>

                <button
                  onClick={() => handleAddFurniture('tv_stand', 'Multimedia Lowboard', 2.0, 0.45, 0.6, '#0f172a')}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200">TV & Audio Board</span>
                  <p className="text-[11px] text-slate-400 mt-1">2.0 × 0.45 × 0.6 m</p>
                </button>

                <button
                  onClick={() => handleAddFurniture('desk', 'Arbeitstisch / Schreibtisch', 1.4, 0.75, 0.75, '#475569')}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200">Schreibtisch Office</span>
                  <p className="text-[11px] text-slate-400 mt-1">1.4 × 0.75 × 0.75 m</p>
                </button>

                <button
                  onClick={() => handleAddFurniture('wardrobe', 'Kleiderschrank 3-türig', 1.8, 0.6, 2.1, '#1e293b')}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200">Kleiderschrank</span>
                  <p className="text-[11px] text-slate-400 mt-1">1.8 × 0.6 × 2.1 m</p>
                </button>
              </div>
            </div>

            {/* Electrical Presets */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Elektroinstallationen nach DIN 18015
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAddElectrical('socket_double', 'Doppel-Schukosteckdose (30cm)', 30, 'circuit-f1-sockets', 50)}
                  className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200">🔌 Doppelsteckdose 230V</span>
                  <p className="text-[10px] text-slate-400">Vorzugszone DIN: 30cm über FFB</p>
                </button>

                <button
                  onClick={() => handleAddElectrical('switch_single', 'Lichtschalter Wechselschaltung (105cm)', 105, 'circuit-f2-light', 0)}
                  className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200">💡 Lichtschalter 105cm</span>
                  <p className="text-[10px] text-slate-400">DIN Griffhöhe Türbereich</p>
                </button>

                <button
                  onClick={() => handleAddElectrical('light_ceiling', 'Deckenleuchte / Spot 230V', 260, 'circuit-f2-light', 40)}
                  className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200">✨ Deckenbeleuchtung</span>
                  <p className="text-[10px] text-slate-400">Deckenanschlussdose mittig</p>
                </button>

                <button
                  onClick={() => handleAddElectrical('socket_cee16', 'CEE 16A / Herdanschlussdose', 35, 'circuit-f5-stove', 2200)}
                  className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition"
                >
                  <span className="text-xs font-bold text-amber-300">⚡ Herdanschluss 400V 3P</span>
                  <p className="text-[10px] text-slate-400">Starkstromkreis Induktion/Backofen</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIN CLEARANCE SAFETY AUDIT MODAL */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    DIN VDE 0100-520 & DVGW-TRGI Sicherheits-Audit
                  </h3>
                  <p className="text-xs text-slate-400">
                    Echtzeit-Kollisionsanalyse zwischen elektrischen Leitungen und Rohrleitungssystemen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConflictModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Current Conflicts List */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Erkannte Abstandsverletzungen ({pipeConflicts.length})
              </h4>
              {pipeConflicts.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Hervorragend! Alle Leitungen halten die vorgeschriebenen 20 cm Schutzabstand vollständig ein.</span>
                </div>
              ) : (
                pipeConflicts.map((conf) => (
                  <div 
                    key={conf.id}
                    className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-rose-900/80 text-[11px] font-bold text-rose-200 border border-rose-700">
                            {conf.standard}
                          </span>
                          <span className="text-xs font-semibold text-rose-300">
                            {conf.type === 'water' ? 'Wasserleitungskonflikt' : 'Gasrohrkonflikt'}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-white mt-1">
                          {conf.routeName} ↔ {conf.furnitureName}
                        </h5>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black font-mono text-rose-400">
                          {conf.actualDistanceCm} cm
                        </span>
                        <p className="text-[10px] text-slate-400">Soll: ≥ 20.0 cm</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">
                      {conf.description}
                    </p>

                    <div className="flex items-center gap-2 pt-2 border-t border-rose-900/50">
                      <button
                        onClick={() => {
                          handleFocusConflict(conf);
                          setShowConflictModal(false);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Target className="w-3.5 h-3.5" />
                        Im 3D-CAD ansehen
                      </button>
                      {onUpdateWiring && (
                        <button
                          onClick={() => {
                            handleAutoFixConflict(conf);
                            setShowConflictModal(false);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                        >
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                          Automatisch auf 25 cm korrigieren
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Norm Regulations Reference Info */}
            <div className="mt-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                Vorschriften & Installationsnormen
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>
                  <strong className="text-slate-100">DIN VDE 0100-520 § 528.2:</strong> Elektrische Kabel dürfen nicht so verlegt werden, dass sie durch Kondenswasser, Wärmestrahlung oder Rohrbrüche gefährdet werden. Mindestabstand 20 cm.
                </li>
                <li>
                  <strong className="text-slate-100">DVGW-TRGI 2018 (Gasinstallation):</strong> Zu brennbaren Gasrohrleitungen ist ein Mindestabstand von 20 cm zwingend vorgeschrieben, um bei Kurzschlüssen oder Lichtbögen Explosionsrisiken auszuschließen.
                </li>
                <li>
                  <strong className="text-slate-100">DIN 18015-3:</strong> Elektrische Leitungsführungen müssen innerhalb genormter Verlegezonen (15cm / 30cm von Decke/Boden) verlaufen.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CAD LAYER MANAGER PANEL */}
      <CADLayerManager
        isOpen={showLayerManager}
        onClose={() => setShowLayerManager(false)}
        showFurniture={showFurniture}
        onToggleFurniture={(val) => setShowFurniture(typeof val === 'boolean' ? val : !showFurniture)}
        showElectrical={showElectrical}
        onToggleElectrical={(val) => setShowElectrical(typeof val === 'boolean' ? val : !showElectrical)}
        showDimensions={showDimensions}
        onToggleDimensions={(val) => setShowDimensions(typeof val === 'boolean' ? val : !showDimensions)}
        showWiring={showWiring}
        onToggleWiring={(val) => setShowWiring(typeof val === 'boolean' ? val : !showWiring)}
        showPipes={showPipes}
        onTogglePipes={(val) => setShowPipes(typeof val === 'boolean' ? val : !showPipes)}
        showLighting={showLighting}
        onToggleLighting={(val) => setShowLighting(typeof val === 'boolean' ? val : !showLighting)}
        furnitureCount={furniture.length}
        electricalCount={electrical.length}
        wiringCount={wiring.length}
        pipesCount={sanitaryPipes.reduce((acc, sys) => acc + sys.segments.length, 0)}
        roomCount={allRooms.length}
        onShowAll={handleShowAllLayers}
        onHideAll={handleHideAllLayers}
        onFocusElectrical={handleFocusElectrical}
        onFocusArchitecture={handleFocusArchitecture}
      />
    </div>
  );
};

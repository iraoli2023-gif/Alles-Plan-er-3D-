import React, { useState, useMemo } from 'react';
import { 
  RoomConfig, 
  AttachmentSide, 
  FurnitureItem, 
  ElectricalElement,
  DoorwayType,
  LintelType
} from '../types';
import { 
  ROOM_PRESETS, 
  RoomPreset, 
  calculateAttachedRoomPosition, 
  calculateApartmentMetrics 
} from '../utils/roomAttachment';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Maximize2, 
  Layers, 
  ArrowRight, 
  ArrowDown, 
  ArrowLeft, 
  ArrowUp, 
  Home, 
  DoorOpen, 
  Compass, 
  Sparkles,
  Info,
  Edit3
} from 'lucide-react';
import { soundSynth } from '../utils/audioSynth';

interface RoomManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: RoomConfig[];
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onAddAttachedRoom: (
    newRoom: RoomConfig, 
    initialFurniture?: FurnitureItem[], 
    initialElectrical?: ElectricalElement[]
  ) => void;
  onUpdateRoom: (updatedRoom: RoomConfig) => void;
  onDeleteRoom: (roomId: string) => void;
}

export const RoomManagerModal: React.FC<RoomManagerModalProps> = ({
  isOpen,
  onClose,
  rooms,
  activeRoomId,
  onSelectRoom,
  onAddAttachedRoom,
  onUpdateRoom,
  onDeleteRoom,
}) => {
  const [tab, setTab] = useState<'overview' | 'attach' | 'edit'>('overview');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-bedroom');
  const [editingRoomId, setEditingRoomId] = useState<string>(activeRoomId);

  // Attachment configuration state
  const [targetRoomId, setTargetRoomId] = useState<string>(rooms[0]?.id || '');
  const [attachSide, setAttachSide] = useState<AttachmentSide>('east');
  const [newRoomName, setNewRoomName] = useState<string>('Schlafzimmer');
  const [newRoomWidth, setNewRoomWidth] = useState<number>(4.6);
  const [newRoomLength, setNewRoomLength] = useState<number>(3.8);
  const [newRoomHeight, setNewRoomHeight] = useState<number>(2.6);
  const [newWallThickness, setNewWallThickness] = useState<number>(0.15);
  const [newFloorTexture, setNewFloorTexture] = useState<'wood_parquet' | 'tiles_grey' | 'concrete_modern' | 'carpet_warm'>('wood_parquet');
  const [newWallColor, setNewWallColor] = useState<string>('#1e293b');
  const [hasDoorway, setHasDoorway] = useState<boolean>(true);
  const [doorwayWidth, setDoorwayWidth] = useState<number>(0.9);
  const [openTransition, setOpenTransition] = useState<boolean>(false);
  const [includePresetItems, setIncludePresetItems] = useState<boolean>(true);
  const [alignOffset, setAlignOffset] = useState<number>(0);

  // Edit existing room state
  const editingRoom = useMemo(() => {
    return rooms.find(r => r.id === editingRoomId) || rooms[0];
  }, [rooms, editingRoomId]);

  const [editName, setEditName] = useState('');
  const [editWidth, setEditWidth] = useState(4);
  const [editLength, setEditLength] = useState(4);
  const [editHeight, setEditHeight] = useState(2.6);
  const [editFloor, setEditFloor] = useState<'wood_parquet' | 'tiles_grey' | 'concrete_modern' | 'carpet_warm'>('wood_parquet');
  const [editWallColor, setEditWallColor] = useState('#1e293b');
  const [editHasDoorway, setEditHasDoorway] = useState(true);
  const [editDoorwayWidth, setEditDoorwayWidth] = useState(0.9);
  const [editDoorwayHeight, setEditDoorwayHeight] = useState(2.05);
  const [editDoorwayOffset, setEditDoorwayOffset] = useState(0);
  const [editDoorwayType, setEditDoorwayType] = useState<DoorwayType>('standard_door');
  const [editLintelType, setEditLintelType] = useState<LintelType>('concrete');

  // Sync edit form when entering edit tab
  const startEditing = (room: RoomConfig) => {
    setEditingRoomId(room.id);
    setEditName(room.name);
    setEditWidth(room.width);
    setEditLength(room.length);
    setEditHeight(room.height);
    setEditFloor(room.floorTexture);
    setEditWallColor(room.wallColor);
    setEditHasDoorway(room.hasDoorway !== false);
    setEditDoorwayWidth(room.doorwayWidth ?? 0.9);
    setEditDoorwayHeight(room.doorwayHeight ?? 2.05);
    setEditDoorwayOffset(room.doorwayOffset ?? 0);
    setEditDoorwayType(room.doorwayType ?? (room.openTransition ? 'open_arch' : 'standard_door'));
    setEditLintelType(room.lintelType ?? 'concrete');
    setTab('edit');
  };

  const handleApplyPreset = (preset: RoomPreset) => {
    setSelectedPresetId(preset.id);
    setNewRoomName(preset.name);
    setNewRoomWidth(preset.defaultWidth);
    setNewRoomLength(preset.defaultLength);
    setNewRoomHeight(preset.defaultHeight);
    setNewWallThickness(preset.wallThickness);
    setNewFloorTexture(preset.floorTexture);
    setNewWallColor(preset.wallColor);
  };

  const targetRoom = useMemo(() => {
    return rooms.find(r => r.id === targetRoomId) || rooms[0];
  }, [rooms, targetRoomId]);

  // Real-time calculated preview position
  const previewPosition = useMemo(() => {
    if (!targetRoom) return { x: 0, z: 0 };
    return calculateAttachedRoomPosition(targetRoom, attachSide, newRoomWidth, newRoomLength, alignOffset);
  }, [targetRoom, attachSide, newRoomWidth, newRoomLength, alignOffset]);

  const apartmentMetrics = useMemo(() => {
    return calculateApartmentMetrics(rooms);
  }, [rooms]);

  if (!isOpen) return null;

  const handleCreateAndAttach = () => {
    if (!targetRoom) return;

    const newId = `room-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const createdRoom: RoomConfig = {
      id: newId,
      name: newRoomName || 'Neuer Raum',
      width: Number(newRoomWidth) || 4.0,
      length: Number(newRoomLength) || 3.5,
      height: Number(newRoomHeight) || 2.6,
      wallThickness: Number(newWallThickness) || 0.15,
      floorTexture: newFloorTexture,
      wallColor: newWallColor,
      position: previewPosition,
      attachedTo: targetRoom.id,
      attachedSide: attachSide,
      hasDoorway,
      doorwayWidth: hasDoorway ? doorwayWidth : undefined,
      openTransition,
      roomType: (ROOM_PRESETS.find(p => p.id === selectedPresetId)?.roomType) || 'custom',
    };

    // Prepare initial preset furniture & electrical elements if chosen
    let initialFurniture: FurnitureItem[] | undefined;
    let initialElectrical: ElectricalElement[] | undefined;

    const preset = ROOM_PRESETS.find(p => p.id === selectedPresetId);
    if (includePresetItems && preset) {
      if (preset.defaultFurnishings && preset.defaultFurnishings.length > 0) {
        initialFurniture = preset.defaultFurnishings.map((f, idx) => ({
          id: `furn-${newId}-${idx}-${Date.now()}`,
          roomId: newId,
          type: f.type || 'table',
          name: f.name || 'Möbelstück',
          position: {
            x: Number((previewPosition.x + (idx === 0 ? 0 : 0.8)).toFixed(2)),
            y: (f.dimensions?.height || 0.8) / 2,
            z: Number((previewPosition.z + (idx === 0 ? 0 : -0.6)).toFixed(2)),
          },
          rotation: 0,
          dimensions: f.dimensions || { width: 1.0, depth: 0.8, height: 0.8 },
          color: f.color || '#334155',
          isTerrarium: f.isTerrarium,
          hasWaterPipe: f.hasWaterPipe,
          hasGasPipe: f.hasGasPipe,
          sanitaryType: f.sanitaryType,
        }));
      }

      if (preset.defaultElectrical && preset.defaultElectrical.length > 0) {
        initialElectrical = preset.defaultElectrical.map((e, idx) => ({
          id: `el-${newId}-${idx}-${Date.now()}`,
          roomId: newId,
          type: e.type || 'socket_double',
          name: e.name || 'Elektroanschluss',
          position: {
            x: Number((previewPosition.x + (idx * 0.4 - 0.6)).toFixed(2)),
            y: (e.heightFromFloorCm || 30) / 100,
            z: Number((previewPosition.z + (e.type?.includes('light') ? 0 : createdRoom.length / 2 - 0.1)).toFixed(2)),
          },
          rotation: 0,
          heightFromFloorCm: e.heightFromFloorCm || 30,
          circuitId: 'circuit-f2-light',
          state: true,
          powerWatts: e.powerWatts || 50,
          wallSnapped: e.type?.includes('light') ? 'ceiling' : 'south',
        }));
      }
    }

    soundSynth.playSnap();
    onAddAttachedRoom(createdRoom, initialFurniture, initialElectrical);
    setTab('overview');
  };

  const handleSaveEdit = () => {
    if (!editingRoom) return;
    const updated: RoomConfig = {
      ...editingRoom,
      name: editName,
      width: Number(editWidth),
      length: Number(editLength),
      height: Number(editHeight),
      floorTexture: editFloor,
      wallColor: editWallColor,
      hasDoorway: editHasDoorway,
      doorwayWidth: Number(editDoorwayWidth),
      doorwayHeight: Number(editDoorwayHeight),
      doorwayOffset: Number(editDoorwayOffset),
      doorwayType: editDoorwayType,
      lintelType: editLintelType,
      openTransition: editDoorwayType === 'open_arch' || editDoorwayType === 'wide_opening',
    };
    onUpdateRoom(updated);
    soundSynth.playClick();
    setTab('overview');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div 
        className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Räume verwalten & ansetzen</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {apartmentMetrics.roomCount} {apartmentMetrics.roomCount === 1 ? 'Raum' : 'Räume'} • {apartmentMetrics.totalAreaSqM} m² Gesamt
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mehrere Räume im CAD aneinanderfügen, Durchgänge definieren und Grundriss erweitern
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch buttons */}
            <div className="bg-slate-950 p-1 rounded-xl border border-white/10 flex items-center gap-1 text-xs">
              <button
                onClick={() => setTab('overview')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  tab === 'overview' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Übersicht ({rooms.length})
              </button>
              <button
                onClick={() => {
                  setTab('attach');
                  if (!targetRoomId && rooms[0]) setTargetRoomId(rooms[0].id);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  tab === 'attach' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Raum ansetzen
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Mini CAD Apartment Layout Preview */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-white uppercase tracking-wider">Grundriss-Gesamtübersicht (2D Draufsicht)</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono">
                    Spannweite: {apartmentMetrics.boundingBox.width}m × {apartmentMetrics.boundingBox.length}m
                  </span>
                </div>

                {/* SVG Visualizer of All Connected Rooms */}
                <div className="w-full h-56 bg-slate-900/90 rounded-xl border border-white/5 flex items-center justify-center p-3 relative overflow-hidden">
                  <svg 
                    className="w-full h-full"
                    viewBox={`${apartmentMetrics.boundingBox.minX - 1.5} ${apartmentMetrics.boundingBox.minZ - 1.5} ${apartmentMetrics.boundingBox.width + 3} ${apartmentMetrics.boundingBox.length + 3}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Grid lines */}
                    <defs>
                      <pattern id="cadGrid" width="1" height="1" patternUnits="userSpaceOnUse">
                        <path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.04" />
                      </pattern>
                    </defs>
                    <rect 
                      x={apartmentMetrics.boundingBox.minX - 2} 
                      y={apartmentMetrics.boundingBox.minZ - 2} 
                      width={apartmentMetrics.boundingBox.width + 4} 
                      height={apartmentMetrics.boundingBox.length + 4} 
                      fill="url(#cadGrid)" 
                    />

                    {/* Room Rectangles */}
                    {rooms.map((r) => {
                      const posX = r.position?.x || 0;
                      const posZ = r.position?.z || 0;
                      const x = posX - r.width / 2;
                      const z = posZ - r.length / 2;
                      const isActive = r.id === activeRoomId;
                      const area = (r.width * r.length).toFixed(1);

                      return (
                        <g 
                          key={r.id}
                          className="cursor-pointer transition-all"
                          onClick={() => onSelectRoom(r.id)}
                        >
                          {/* Floor */}
                          <rect
                            x={x}
                            y={z}
                            width={r.width}
                            height={r.length}
                            fill={isActive ? '#0284c7' : '#1e293b'}
                            fillOpacity={isActive ? 0.35 : 0.5}
                            stroke={isActive ? '#38bdf8' : '#64748b'}
                            strokeWidth={isActive ? 0.12 : 0.06}
                            rx={0.08}
                          />

                          {/* Doorway Indicator if attached */}
                          {r.hasDoorway && (
                            <circle
                              cx={posX}
                              cy={posZ}
                              r={0.2}
                              fill="#38bdf8"
                              opacity={0.7}
                            />
                          )}

                          {/* Room Name & Area Labels */}
                          <text
                            x={posX}
                            y={posZ - 0.2}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize="0.5"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            {r.name}
                          </text>
                          <text
                            x={posX}
                            y={posZ + 0.45}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#94a3b8"
                            fontSize="0.38"
                            fontFamily="monospace"
                          >
                            {r.width}m × {r.length}m ({area} m²)
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* List of Rooms */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Vorhandene Räume im Projekt ({rooms.length})
                  </h3>
                  <button
                    onClick={() => {
                      setTab('attach');
                      if (!targetRoomId && rooms[0]) setTargetRoomId(rooms[0].id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Weiteren Raum ansetzen
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rooms.map((r, index) => {
                    const isActive = r.id === activeRoomId;
                    const area = (r.width * r.length).toFixed(1);

                    return (
                      <div
                        key={r.id}
                        className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                          isActive 
                            ? 'bg-sky-950/30 border-sky-500/60 shadow-lg shadow-sky-950/50' 
                            : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                              isActive
                                ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                                : 'bg-slate-800 text-slate-300 border-white/10'
                            }`}>
                              <span className="text-xs font-mono font-bold">R{index + 1}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">{r.name}</h4>
                                {isActive && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-400 border border-sky-400/40">
                                    Aktiv
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                <span className="font-mono text-slate-300">{r.width}m × {r.length}m</span>
                                <span>•</span>
                                <span className="text-emerald-400 font-semibold">{area} m²</span>
                                <span>•</span>
                                <span>Höhe {r.height}m</span>
                              </div>
                              {r.attachedTo && (
                                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-300/90 font-mono">
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Angesetzt an {rooms.find(x => x.id === r.attachedTo)?.name || 'Hauptraum'} ({r.attachedSide?.toUpperCase()})</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditing(r)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                              title="Maße & Eigenschaften bearbeiten"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {rooms.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`Raum "${r.name}" wirklich entfernen?`)) {
                                    onDeleteRoom(r.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                                title="Raum löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                          <button
                            onClick={() => onSelectRoom(r.id)}
                            className={`px-3 py-1.5 rounded-xl font-semibold transition text-xs ${
                              isActive
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {isActive ? 'Aktiver Raum in Bearbeitung' : 'Als aktiven Raum auswählen'}
                          </button>

                          <span className="text-[11px] text-slate-500 font-mono">
                            Pos: ({r.position?.x || 0}, {r.position?.z || 0})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'attach' && (
            <div className="space-y-6">
              {/* Presets Gallery */}
              <div>
                <label className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 block">
                  1. Raum-Vorlage wählen (oder frei anpassen)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ROOM_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10'
                            : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white">{preset.name}</h4>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                            {preset.description}
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-amber-300/80">
                          {preset.defaultWidth}m × {preset.defaultLength}m
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Attachment Placement Config */}
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Compass className="w-4 h-4 text-sky-400" />
                  2. Ansetz-Position & Ausrichtung
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 font-semibold mb-1 block">
                      Ansetzen an bestehenden Raum:
                    </label>
                    <select
                      value={targetRoomId}
                      onChange={e => setTargetRoomId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                    >
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.width}m × {r.length}m)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-semibold mb-1 block">
                      Wandseite zum Ansetzen:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAttachSide('east')}
                        className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                          attachSide === 'east'
                            ? 'bg-sky-500 text-slate-950 border-sky-400'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Osten</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachSide('west')}
                        className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                          attachSide === 'west'
                            ? 'bg-sky-500 text-slate-950 border-sky-400'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Westen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachSide('north')}
                        className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                          attachSide === 'north'
                            ? 'bg-sky-500 text-slate-950 border-sky-400'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>Norden</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachSide('south')}
                        className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                          attachSide === 'south'
                            ? 'bg-sky-500 text-slate-950 border-sky-400'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        <span>Süden</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Doorway / Passage Settings */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasDoorway}
                        onChange={e => setHasDoorway(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-400 w-4 h-4"
                      />
                      <DoorOpen className="w-4 h-4 text-sky-400" />
                      Türöffnung / Durchgang in der gemeinsamen Trennwand einbauen
                    </label>

                    {hasDoorway && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        DIN-Türbreite: {doorwayWidth}m
                      </span>
                    )}
                  </div>

                  {hasDoorway && (
                    <div className="flex items-center gap-4 pt-2 text-xs pl-6">
                      <label className="flex items-center gap-2 text-slate-300">
                        <span>Breite:</span>
                        <select
                          value={doorwayWidth}
                          onChange={e => setDoorwayWidth(Number(e.target.value))}
                          className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                        >
                          <option value={0.8}>0.80 m (Standard)</option>
                          <option value={0.9}>0.90 m (DIN 18015 Vorzugsmaß)</option>
                          <option value={1.0}>1.00 m (Barrierefrei)</option>
                          <option value={1.4}>1.40 m (Doppeltür)</option>
                          <option value={2.0}>2.00 m (Breite Schiebetür)</option>
                        </select>
                      </label>

                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={openTransition}
                          onChange={e => setOpenTransition(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-800 text-sky-500 w-3.5 h-3.5"
                        />
                        <span>Vollständig offener Durchgang (Wandöffnung)</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Room Dimensions & Properties Form */}
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Maximize2 className="w-4 h-4 text-amber-400" />
                    3. Raummaße & Erscheinungsbild
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Fläche: {(newRoomWidth * newRoomLength).toFixed(1)} m²
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Raumname</label>
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={e => setNewRoomName(e.target.value)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Breite (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.5"
                      max="15"
                      value={newRoomWidth}
                      onChange={e => setNewRoomWidth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Länge / Tiefe (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.5"
                      max="15"
                      value={newRoomLength}
                      onChange={e => setNewRoomLength(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Deckenhöhe (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="2.0"
                      max="4.0"
                      value={newRoomHeight}
                      onChange={e => setNewRoomHeight(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Bodenbelag</label>
                    <select
                      value={newFloorTexture}
                      onChange={e => setNewFloorTexture(e.target.value as any)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                    >
                      <option value="wood_parquet">Echtholzparkett Eiche</option>
                      <option value="tiles_grey">Feinsteinzeug Fliesen Grau</option>
                      <option value="concrete_modern">Sichtbeton Modern</option>
                      <option value="carpet_warm">Teppichboden Warm</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Wandfarbe</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newWallColor}
                        onChange={e => setNewWallColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newWallColor}
                        onChange={e => setNewWallColor(e.target.value)}
                        className="flex-1 bg-slate-900 border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Option to insert standard items */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePresetItems}
                      onChange={e => setIncludePresetItems(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-sky-500 w-4 h-4"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Typische Grundmöblierung & DIN 18015 Steckdosen direkt mit anlegen</span>
                  </label>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Neue Position: X: {previewPosition.x}m, Z: {previewPosition.z}m
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTab('overview')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleCreateAndAttach}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Raum jetzt ansetzen & im 3D CAD öffnen
                </button>
              </div>
            </div>
          )}

          {tab === 'edit' && editingRoom && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-sky-400" />
                  Raum bearbeiten: {editingRoom.name}
                </h3>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {(editWidth * editLength).toFixed(1)} m²
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Raumname</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Bodenbelag</label>
                  <select
                    value={editFloor}
                    onChange={e => setEditFloor(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="wood_parquet">Echtholzparkett Eiche</option>
                    <option value="tiles_grey">Feinsteinzeug Fliesen Grau</option>
                    <option value="concrete_modern">Sichtbeton Modern</option>
                    <option value="carpet_warm">Teppichboden Warm</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Breite (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.5"
                    max="15"
                    value={editWidth}
                    onChange={e => setEditWidth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Länge (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.5"
                    max="15"
                    value={editLength}
                    onChange={e => setEditLength(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Höhe (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="2.0"
                    max="4.0"
                    value={editHeight}
                    onChange={e => setEditHeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Wandfarbe</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editWallColor}
                      onChange={e => setEditWallColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editWallColor}
                      onChange={e => setEditWallColor(e.target.value)}
                      className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Wanddurchbruch / Raumübergang Einstellungen */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-sky-500/25 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚪</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Wanddurchbruch & Raumübergang</h4>
                      <p className="text-[10px] text-slate-400">Übergang zur angrenzenden Wand konfigurieren</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <span className="text-slate-300 font-semibold text-[11px]">Wandöffnung aktiv</span>
                    <input
                      type="checkbox"
                      checked={editHasDoorway}
                      onChange={e => setEditHasDoorway(e.target.checked)}
                      className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>

                {editHasDoorway && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Ausführungstyp</label>
                      <select
                        value={editDoorwayType}
                        onChange={e => setEditDoorwayType(e.target.value as DoorwayType)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="standard_door">Innentür (DIN 18101)</option>
                        <option value="open_arch">Offener Durchgang</option>
                        <option value="wide_opening">Breiter Durchbruch</option>
                        <option value="closed_wall">Geschlossene Wand</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Durchgangsbreite (m)</label>
                      <select
                        value={editDoorwayWidth}
                        onChange={e => setEditDoorwayWidth(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
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
                      <label className="text-[11px] text-slate-400 mb-1 block">Durchgangshöhe (m)</label>
                      <select
                        value={editDoorwayHeight}
                        onChange={e => setEditDoorwayHeight(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      >
                        <option value={2.00}>2.00 m</option>
                        <option value={2.05}>2.05 m (DIN)</option>
                        <option value={2.10}>2.10 m</option>
                        <option value={2.30}>2.30 m</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Tragender Sturz</label>
                      <select
                        value={editLintelType}
                        onChange={e => setEditLintelType(e.target.value as LintelType)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="concrete">Betonsturz (DIN 1053)</option>
                        <option value="steel_heb">HEB-Stahlträger</option>
                        <option value="wood">Holzbalken / Unterzug</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setTab('overview')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shadow"
                >
                  Änderungen speichern
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

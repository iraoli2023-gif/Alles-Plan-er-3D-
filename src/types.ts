/**
 * VoltCAD 3D - Types & Interfaces
 * Comprehensive data models for CAD apartment layout, electrical planning,
 * DIN distribution board, smart home gateway, terrarium controller, and real-time energy.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type RoomType = 
  | 'living' 
  | 'kitchen' 
  | 'bedroom' 
  | 'bathroom' 
  | 'hallway' 
  | 'office' 
  | 'terrarium_lab' 
  | 'balcony' 
  | 'custom';

export type AttachmentSide = 'north' | 'south' | 'east' | 'west';

export type DoorwayType = 'standard_door' | 'open_arch' | 'wide_opening' | 'closed_wall';
export type LintelType = 'concrete' | 'steel_heb' | 'wood';

export interface RoomConfig {
  id: string;
  name: string;
  width: number; // in meters, e.g. 7.5
  length: number; // in meters, e.g. 5.5
  height: number; // in meters, e.g. 2.6
  wallThickness: number; // e.g. 0.15
  floorTexture: 'wood_parquet' | 'tiles_grey' | 'concrete_modern' | 'carpet_warm';
  wallColor: string;
  // Spatial offset relative to global apartment origin (center of room)
  position?: { x: number; z: number };
  // Multi-room attachment linkage
  attachedTo?: string; // ID of target room it is attached to
  attachedSide?: AttachmentSide; // which wall of target room it connects to
  hasDoorway?: boolean; // Door passage in the shared partition wall
  doorwayWidth?: number; // door width in meters (e.g. 0.9m DIN standard)
  doorwayHeight?: number; // Durchbruchshöhe in Metern, default 2.05m
  doorwayOffset?: number; // offset along the partition wall in meters
  doorwayType?: DoorwayType; // Art des Wanddurchbruchs
  doorwaySwingSide?: 'left' | 'right'; // Türanschlag DIN links / DIN rechts
  lintelType?: LintelType; // Sturzausführung (Betonsturz, Stahlträger HEB, Holzunterzug)
  openTransition?: boolean; // completely open architectural transition
  roomType?: RoomType;
}

export type FurnitureCategory = 
  | 'sofa' 
  | 'bed' 
  | 'table' 
  | 'chair' 
  | 'wardrobe' 
  | 'desk' 
  | 'tv_stand' 
  | 'kitchen_counter' 
  | 'terrarium_tank'
  | 'bookshelf'
  | 'custom_box';

export interface FurnitureItem {
  id: string;
  roomId?: string; // Room ID this furniture belongs to
  type: FurnitureCategory;
  name: string;
  position: Vector3D;
  rotation: number; // Y rotation in degrees
  dimensions: {
    width: number; // X
    depth: number; // Z
    height: number; // Y
  };
  color: string;
  isTerrarium?: boolean;
  hasWaterPipe?: boolean;
  hasGasPipe?: boolean;
  sanitaryType?: 'water_sink' | 'dishwasher' | 'gas_stove' | 'gas_heater' | 'washing_machine';
}

export type ElectricalType =
  | 'socket_single'
  | 'socket_double'
  | 'socket_cee16'
  | 'switch_single'
  | 'switch_series'
  | 'switch_dimmer'
  | 'light_ceiling'
  | 'light_wall'
  | 'motion_sensor'
  | 'smoke_detector'
  | 'room_thermostat'
  | 'sub_distribution_panel';

export interface ElectricalElement {
  id: string;
  roomId?: string; // Room ID this electrical element belongs to
  type: ElectricalType;
  name: string;
  position: Vector3D;
  rotation: number; // rotation in degrees
  heightFromFloorCm: number; // DIN 18015 height
  circuitId: string; // assigned breaker circuit
  smartDeviceId?: string; // linked smart device
  wallSnapped?: 'north' | 'south' | 'east' | 'west' | 'ceiling' | 'floor';
  state?: boolean; // ON/OFF
  dimLevel?: number; // 0-100%
  powerWatts: number; // wattage when active
}

export type CableType =
  | 'NYM-J 3x1.5 mm²'
  | 'NYM-J 3x2.5 mm²'
  | 'NYM-J 5x1.5 mm²'
  | 'NYM-J 5x2.5 mm²'
  | 'CAT.7 Duplex'
  | 'KNX / EIB Bus'
  | 'Terrarium Silikon 3x1.5';

export interface WiringRoute {
  id: string;
  circuitId: string;
  fromId: string;
  toId: string;
  cableType: CableType;
  conduitType: 'Unterputz (UP)' | 'Aufputz / Kanal' | 'Installationsrohr M20' | 'Estrichverlegung';
  installationZone: 'DIN 18015 Decke (15-30cm)' | 'DIN 18015 Boden (15-30cm)' | 'Senkrechte Vorzugszone' | 'Estrichverlegung';
  points: Vector3D[];
  lengthMeters: number;
  voltageDropPct: number; // Calculated voltage drop (e.g. 1.2% < 3% DIN VDE)
  breakdown?: {
    verticalFromMeters: number;
    horizontalWallMeters: number;
    verticalToMeters: number;
    reserveMeters: number;
    cornerBendsMeters: number;
    wallPathDescription: string;
    startWall?: string;
    endWall?: string;
  };
}

export interface BreakerCircuit {
  id: string;
  number: string; // e.g. "F1", "F2"
  name: string;
  phase: 'L1' | 'L2' | 'L3';
  breakerType: 'LS B16A' | 'LS B10A' | 'LS C16A' | 'LS 3P B16A' | 'RCBO B16/0.03A';
  rcdId: string;
  ratedCurrentA: number;
  cableCrossSection: string;
  description: string;
  state: boolean; // Tripped/Off vs Active/On
  baseLoadWatts: number;
  activeLoadWatts: number;
}

export interface RCDDevice {
  id: string;
  name: string;
  ratedCurrentA: number; // e.g. 40A
  faultCurrentMa: number; // 30mA
  type: 'Typ A' | 'Typ B (Allstromsensitiv)' | 'Typ F';
  state: boolean; // Tripped or normal
}

export interface SmartDevice {
  id: string;
  name: string;
  protocol: 'Zigbee 3.0' | 'Matter' | 'KNX IP' | 'WiFi / MQTT';
  category: 'lighting' | 'plug' | 'climate' | 'sensor' | 'gateway' | 'terrarium' | 'camera' | 'audio';
  room: string;
  state: boolean;
  value?: number; // brightness, temp, humidity, etc.
  unit?: string;
  powerWatts: number;
  signalStrength: number; // 0-100%
  battery?: number; // percentage
  brand?: 'Hager' | 'ABB' | 'Schneider' | 'Universal';
  modelCode?: string;
}

export type SmartBrand = 'Hager' | 'ABB' | 'Schneider' | 'Universal';

export type LogicNodeCategory = 'input' | 'gate' | 'output' | 'media';

export type LogicNodeType = 
  | 'camera_motion'
  | 'doorbell_trigger'
  | 'presence_sensor'
  | 'wall_pushbutton'
  | 'temp_sensor'
  | 'scene_controller'
  | 'gate_and'
  | 'gate_or'
  | 'gate_xor'
  | 'gate_not'
  | 'timer_staircase'
  | 'comparator'
  | 'dimmer_actor'
  | 'switch_actor'
  | 'sound_player'
  | 'camera_snapshot';

export interface LogicNode {
  id: string;
  type: LogicNodeType;
  category: LogicNodeCategory;
  title: string;
  brand: SmartBrand;
  modelCode?: string;
  x: number;
  y: number;
  inputs: { id: string; name: string; type: 'boolean' | 'number' | 'trigger' }[];
  outputs: { id: string; name: string; type: 'boolean' | 'number' | 'trigger' }[];
  state: boolean;
  currentValue?: number | string | boolean;
  config: {
    delaySeconds?: number;
    threshold?: number;
    operator?: '>' | '<' | '==' | '!=';
    targetDeviceId?: string;
    soundType?: 'doorbell' | 'siren' | 'welcome' | 'alert' | 'ding';
    dimLevelPct?: number;
    busAddress?: string; // e.g. "1.1.25"
    sceneName?: string;
    luxTarget?: number;
  };
}

export interface LogicConnection {
  id: string;
  fromNodeId: string;
  fromPin: string;
  toNodeId: string;
  toPin: string;
  isActive: boolean;
}

export interface CameraDevice {
  id: string;
  name: string;
  brand: SmartBrand;
  modelCode: string;
  location: string;
  status: 'online' | 'recording' | 'motion_alert';
  resolution: string;
  motionDetected: boolean;
  nightVision: boolean;
  ptz: { pan: number; tilt: number; zoom: number };
  detectedObjects: string[];
  lastMotionTime?: string;
}

export interface SoundDevice {
  id: string;
  name: string;
  brand: SmartBrand;
  modelCode: string;
  zone: string;
  volume: number; // 0-100
  isPlaying: boolean;
  lastPlayedSound?: string;
}

export interface AIAuditIssue {
  id: string;
  severity: 'critical' | 'warning' | 'suggestion';
  title: string;
  category: 'logic' | 'compatibility' | 'camera_sound' | 'energy';
  description: string;
  affectedNodeIds: string[];
  autoFixable: boolean;
  fixLabel?: string;
}

export interface TerrariumConfig {
  id: string;
  name: string;
  species: string;
  dimensionsCm: { w: number; d: number; h: number };
  currentTempWarm: number;
  currentTempCold: number;
  targetTempWarm: number;
  targetTempCold: number;
  currentHumidity: number;
  targetHumidity: number;
  uvIndex: number;
  uvLampState: boolean;
  uvLampWattage: number;
  heatLampState: boolean;
  heatLampWattage: number;
  heatLampDimPct: number;
  foggerState: boolean;
  foggerWattage: number;
  mode: 'Auto (Tag/Nacht)' | 'Manuell' | 'Wartung / Fütterung';
  dayStart: string; // "07:30"
  nightStart: string; // "20:30"
  foggerIntervalMinutes: number;
  foggerDurationSeconds: number;
  statusLog: { time: string; message: string; type: 'info' | 'warn' | 'action' }[];
}

export interface EnergyMetrics {
  currentTotalWatts: number;
  phaseL1Watts: number;
  phaseL2Watts: number;
  phaseL3Watts: number;
  gridVoltage: number; // ~230.2 V
  gridFrequency: number; // ~50.01 Hz
  todayKWh: number;
  electricityPriceKWh: number; // e.g. 0.38 €
  co2PerKWhGram: number; // e.g. 385 g
  history: { timestamp: string; watts: number }[];
}

export type ActiveAppView = 
  | '3d_cad' 
  | 'electrical_planner' 
  | 'distribution_board' 
  | 'smart_home' 
  | 'terrarium' 
  | 'energy_realtime'
  | 'ai_auditor';

export interface PipeClearanceConflict {
  id: string;
  type: 'water' | 'gas';
  standard: 'DIN VDE 0100-520' | 'DVGW-TRGI' | 'DIN 1988';
  minDistanceCm: number;
  actualDistanceCm: number;
  location: Vector3D;
  routeId: string;
  routeName?: string;
  furnitureId: string;
  furnitureName: string;
  severity: 'critical' | 'warning';
  description: string;
  suggestedOffsetMeters: number;
}

export interface LightSceneSuggestion {
  id: string;
  name: string;
  category: 'ambiente' | 'arbeiten' | 'kochen' | 'kino' | 'nacht' | 'terrarium_cycle';
  iconName: string;
  description: string;
  luxTarget: number;
  colorTempKelvin: number;
  estimatedWatts: number;
  energySavingPct: number;
  dimmerSettings: {
    deviceId: string;
    deviceName: string;
    dimLevelPct: number;
    colorTemp?: string;
  }[];
  rationale: string;
}

// ==========================================
// WENN-DANN (IF-THEN) Logic Editor Data Types
// ==========================================

export type TriggerCategory = 
  | 'motion' 
  | 'switch' 
  | 'doorbell' 
  | 'temperature' 
  | 'illuminance' 
  | 'door_window' 
  | 'time' 
  | 'smoke' 
  | 'terrarium';

export interface WhenTrigger {
  id: string;
  type: TriggerCategory;
  deviceId?: string;
  deviceName: string;
  conditionText: string;
  operator?: '>' | '<' | '==' | '!=';
  threshold?: number;
  time?: string;
  room?: string;
}

export interface AndCondition {
  id: string;
  type: 'time_range' | 'ambient_lux' | 'presence' | 'temperature' | 'none';
  label: string;
  enabled: boolean;
  operator?: '>' | '<';
  value?: number | string;
}

export type ActionCategory = 
  | 'turn_on' 
  | 'turn_off' 
  | 'dim' 
  | 'toggle' 
  | 'play_sound' 
  | 'camera_snapshot' 
  | 'activate_scene' 
  | 'notify';

export interface ThenAction {
  id: string;
  type: ActionCategory;
  targetDeviceId?: string;
  targetDeviceName: string;
  actionText: string;
  value?: number; // dim level 0-100%
  soundType?: 'doorbell' | 'welcome' | 'siren' | 'ding' | 'confirmation';
  sceneName?: 'gemuetlich' | 'alles_aus' | 'tagmodus' | 'kino';
  autoOffSeconds?: number; // e.g. 180s for 3 min timer
}

export interface LogicRule {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  trigger: WhenTrigger;
  condition?: AndCondition;
  actions: ThenAction[];
  lastTriggered?: string;
  executionCount: number;
  isSimulating?: boolean;
  color?: 'amber' | 'sky' | 'emerald' | 'rose' | 'purple';
}

export interface RuleExecutionLog {
  id: string;
  ruleId: string;
  ruleTitle: string;
  timestamp: string;
  triggerCause: string;
  executedActions: string[];
  status: 'success' | 'filtered' | 'error';
}

import { 
  SmartBrand, 
  LogicNode, 
  LogicConnection, 
  CameraDevice, 
  SoundDevice, 
  SmartDevice 
} from '../types';

export interface CatalogComponent {
  id: string;
  brand: SmartBrand;
  modelCode: string;
  name: string;
  category: 'actor' | 'sensor' | 'gateway' | 'camera' | 'audio' | 'ui';
  busType: 'KNX TP' | 'KNX IP' | 'Matter' | 'Zigbee' | 'DALI' | 'RTSP / PoE';
  channels: number;
  description: string;
  defaultPowerWatts: number;
  badgeColor: string;
  nodeType: LogicNode['type'];
}

export const SMART_HOME_CATALOG: CatalogComponent[] = [
  // HAGER COMPONENTS
  {
    id: 'hager-domovea',
    brand: 'Hager',
    modelCode: 'TJA670',
    name: 'Hager domovea Server & KNX IoT Gateway',
    category: 'gateway',
    busType: 'KNX IP',
    channels: 1,
    description: 'Zentrale Visualisierung, IoT-Anbindung (Matter, Sonos, Philips Hue) und Ablauf-Logik.',
    defaultPowerWatts: 6.5,
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    nodeType: 'switch_actor',
  },
  {
    id: 'hager-dimm-4f',
    brand: 'Hager',
    modelCode: 'TXA664D',
    name: 'Hager Universaldimmaktor 4-fach KNX',
    category: 'actor',
    busType: 'KNX TP',
    channels: 4,
    description: '4 unabhängige Dimmkanäle für Phasenan-/-abschnitt, LED-optimiert bis 300W je Kanal.',
    defaultPowerWatts: 2.2,
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    nodeType: 'dimmer_actor',
  },
  {
    id: 'hager-schalt-8f',
    brand: 'Hager',
    modelCode: 'TXA608D',
    name: 'Hager Schaltaktor 8-fach 16A C-Last',
    category: 'actor',
    busType: 'KNX TP',
    channels: 8,
    description: 'Robuster Relaisaktor für kapazitive Lasten, Steckdosen und Terrarien-Lasten.',
    defaultPowerWatts: 3.5,
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    nodeType: 'switch_actor',
  },
  {
    id: 'hager-praesenz-ee810',
    brand: 'Hager',
    modelCode: 'EE810',
    name: 'Hager Präsenzmelder Komfort 360° KNX',
    category: 'sensor',
    busType: 'KNX TP',
    channels: 2,
    description: 'Hochpräzise PIR-Zonenerfassung mit Helligkeitskonstantlicht-Regelung.',
    defaultPowerWatts: 0.3,
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    nodeType: 'presence_sensor',
  },
  {
    id: 'hager-audio-gong',
    brand: 'Hager',
    modelCode: 'EV002',
    name: 'Hager Elektronischer Mehrklang-Gong KNX',
    category: 'audio',
    busType: 'KNX TP',
    channels: 1,
    description: 'Akustischer Signalgeber mit 8 integrierten Melodien für Türklingel, Alarm und Warnungen.',
    defaultPowerWatts: 4.0,
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    nodeType: 'sound_player',
  },

  // ABB COMPONENTS
  {
    id: 'abb-dali-dgs',
    brand: 'ABB',
    modelCode: 'DG/S 1.64.5.1',
    name: 'ABB i-bus® KNX DALI Gateway Premium',
    category: 'gateway',
    busType: 'DALI',
    channels: 64,
    description: 'Ansteuerung von bis zu 64 DALI-Betriebsgeräten und 16 Lichtgruppen mit Tunable White.',
    defaultPowerWatts: 3.8,
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    nodeType: 'dimmer_actor',
  },
  {
    id: 'abb-schalt-816',
    brand: 'ABB',
    modelCode: 'SA/S 8.16.2.2',
    name: 'ABB i-bus® Schaltaktor 8-fach 16A',
    category: 'actor',
    busType: 'KNX TP',
    channels: 8,
    description: 'Standard-Industrierelais für Beleuchtung und geschaltete Schuko-Dosen.',
    defaultPowerWatts: 2.8,
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    nodeType: 'switch_actor',
  },
  {
    id: 'abb-tenton-taster',
    brand: 'ABB',
    modelCode: 'SBSA/U 8.0.1-84',
    name: 'ABB Tenton® 8-fach Tastsensor mit Display',
    category: 'ui',
    busType: 'KNX TP',
    channels: 8,
    description: 'Ergonomischer Raumtaster mit Raumtemperaturregler und Szenenaufruf.',
    defaultPowerWatts: 0.5,
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    nodeType: 'wall_pushbutton',
  },
  {
    id: 'abb-welcome-cam',
    brand: 'ABB',
    modelCode: 'CP-V100',
    name: 'ABB Busch-Welcome® Video-Türstation Kamera',
    category: 'camera',
    busType: 'RTSP / PoE',
    channels: 1,
    description: 'Weitwinkel-HD-Kamera (130° Diagonale) mit IR-Nachtsicht, Gegensprechanlage und Bewegungssensor.',
    defaultPowerWatts: 7.5,
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    nodeType: 'camera_motion',
  },
  {
    id: 'abb-audioworld-8215',
    brand: 'ABB',
    modelCode: '8215 U',
    name: 'ABB Busch-AudioWorld® Einbau-Verstärker',
    category: 'audio',
    busType: 'KNX IP',
    channels: 2,
    description: 'Unterputz-Audiomodul für Durchsagen, Gong, Radio und Spotify-Multiroom.',
    defaultPowerWatts: 12.0,
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    nodeType: 'sound_player',
  },

  // SCHNEIDER ELECTRIC COMPONENTS
  {
    id: 'schneider-spacelogic-router',
    brand: 'Schneider',
    modelCode: 'MTN6500-0103',
    name: 'Schneider SpaceLogic KNX IP Router',
    category: 'gateway',
    busType: 'KNX IP',
    channels: 1,
    description: 'Schnittstelle zwischen KNX TP Linie und Ethernet-Backbone mit KNXnet/IP Routing.',
    defaultPowerWatts: 3.2,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    nodeType: 'switch_actor',
  },
  {
    id: 'schneider-wiser-ptz',
    brand: 'Schneider',
    modelCode: 'CCT595011',
    name: 'Schneider Wiser IP Kamera 360° Pan/Tilt',
    category: 'camera',
    busType: 'RTSP / PoE',
    channels: 1,
    description: 'Full-HD Überwachungskamera mit 340° Schwenk-/Neigemotor, Personen- & Geräuscherkennung.',
    defaultPowerWatts: 5.0,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    nodeType: 'camera_motion',
  },
  {
    id: 'schneider-dimmer-spacelogic',
    brand: 'Schneider',
    modelCode: 'MTN6710-0004',
    name: 'Schneider SpaceLogic Universaldimmer 4-fach',
    category: 'actor',
    busType: 'KNX TP',
    channels: 4,
    description: 'Universal-Dimmaktor für ohmsche, induktive und kapazitive Lasten.',
    defaultPowerWatts: 2.5,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    nodeType: 'dimmer_actor',
  },
  {
    id: 'schneider-multitouch-pro',
    brand: 'Schneider',
    modelCode: 'MTN6215-0310',
    name: 'Schneider KNX Multitouch Pro Glasbedienfeld',
    category: 'ui',
    busType: 'KNX TP',
    channels: 16,
    description: 'Kapazitives Touch-Display mit Gestensteuerung und bis zu 32 Funktionsseiten.',
    defaultPowerWatts: 1.2,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    nodeType: 'wall_pushbutton',
  },
  {
    id: 'schneider-wiser-audio',
    brand: 'Schneider',
    modelCode: 'WSR-AUD-01',
    name: 'Schneider Wiser Smart Sound Multiroom-Bridge',
    category: 'audio',
    busType: 'Matter',
    channels: 2,
    description: 'Sound-Gateway für akustische Rückmeldungen, Zonen-Alarm und Sprachausgabe.',
    defaultPowerWatts: 8.0,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    nodeType: 'sound_player',
  },
];

export const INITIAL_CAMERAS: CameraDevice[] = [
  {
    id: 'cam-entry',
    name: 'Eingang & Haustür (ABB Busch-Welcome®)',
    brand: 'ABB',
    modelCode: 'CP-V100',
    location: 'Hauseingang / Flur',
    status: 'online',
    resolution: '1080p Full-HD (130° Weitwinkel)',
    motionDetected: false,
    nightVision: true,
    ptz: { pan: 0, tilt: -10, zoom: 1 },
    detectedObjects: ['Person erkannt', 'Paket vor der Tür'],
    lastMotionTime: 'vor 4 Min.',
  },
  {
    id: 'cam-living',
    name: 'Wohnbereich 360° PTZ (Schneider Wiser Eye)',
    brand: 'Schneider',
    modelCode: 'CCT595011',
    location: 'Wohnzimmer TV-Ecke',
    status: 'online',
    resolution: '2K Quad-HD Pan/Tilt',
    motionDetected: true,
    nightVision: false,
    ptz: { pan: 45, tilt: 5, zoom: 1.2 },
    detectedObjects: ['Bewegung im Raum', 'Haustier erkannt'],
    lastMotionTime: 'vor 12 Sek.',
  },
  {
    id: 'cam-terra',
    name: 'Terrarium Habitat Cam 4K Makro (Hager IoT)',
    brand: 'Hager',
    modelCode: 'TJA-CAM',
    location: 'Terrarium Basking Zone',
    status: 'recording',
    resolution: '4K Ultra-HD Makro',
    motionDetected: false,
    nightVision: false,
    ptz: { pan: 10, tilt: -25, zoom: 2.0 },
    detectedObjects: ['Bartagame sonnt sich', 'UV-Licht aktiv'],
    lastMotionTime: 'vor 28 Min.',
  },
];

export const INITIAL_SOUND_DEVICES: SoundDevice[] = [
  {
    id: 'snd-hallway',
    name: 'Flur-Gong & Durchsage (Hager EV002)',
    brand: 'Hager',
    modelCode: 'EV002',
    zone: 'Flur / Eingang',
    volume: 75,
    isPlaying: false,
    lastPlayedSound: 'Westminster Ding-Dong',
  },
  {
    id: 'snd-living',
    name: 'Wohnzimmer Multiroom HiFi (ABB Busch-AudioWorld)',
    brand: 'ABB',
    modelCode: '8215 U',
    zone: 'Wohnbereich',
    volume: 55,
    isPlaying: false,
    lastPlayedSound: 'Feierabend Lounge Sound',
  },
  {
    id: 'snd-alarm',
    name: 'Zentrale Sicherheits-Sirene (Schneider Wiser Audio)',
    brand: 'Schneider',
    modelCode: 'WSR-AUD-01',
    zone: 'Gesamthaus',
    volume: 95,
    isPlaying: false,
    lastPlayedSound: 'Alarmton Testlauf',
  },
];

export const INITIAL_LOGIC_NODES: LogicNode[] = [
  // 1. Trigger: Camera Motion (Schneider Wiser)
  {
    id: 'node-cam-motion',
    type: 'camera_motion',
    category: 'input',
    title: 'Kamera Bewegungserkennung',
    brand: 'Schneider',
    modelCode: 'CCT595011',
    x: 40,
    y: 80,
    inputs: [],
    outputs: [
      { id: 'motion_out', name: 'Bewegungssignal', type: 'boolean' },
      { id: 'person_out', name: 'Person erkannt', type: 'boolean' },
    ],
    state: true,
    currentValue: true,
    config: {
      busAddress: '1.1.50',
    },
  },

  // 2. Trigger: Hager Präsenzmelder (Wohnen)
  {
    id: 'node-hager-pir',
    type: 'presence_sensor',
    category: 'input',
    title: 'Hager Präsenzmelder EE810',
    brand: 'Hager',
    modelCode: 'EE810',
    x: 40,
    y: 260,
    inputs: [],
    outputs: [
      { id: 'presence_out', name: 'Präsenz', type: 'boolean' },
      { id: 'lux_out', name: 'Lux Helligkeit', type: 'number' },
    ],
    state: true,
    currentValue: true,
    config: {
      busAddress: '1.1.22',
      threshold: 150, // Lux threshold
    },
  },

  // 3. Trigger: ABB Busch-Welcome Türklingel
  {
    id: 'node-abb-doorbell',
    type: 'doorbell_trigger',
    category: 'input',
    title: 'ABB Busch-Welcome Klingeltaste',
    brand: 'ABB',
    modelCode: 'CP-V100',
    x: 40,
    y: 440,
    inputs: [],
    outputs: [
      { id: 'bell_out', name: 'Klingel-Impuls', type: 'trigger' },
    ],
    state: false,
    currentValue: false,
    config: {
      busAddress: '1.1.10',
    },
  },

  // 4. Logic Gate: ODER-Verknüpfung (ODER-Gatter)
  {
    id: 'node-gate-or',
    type: 'gate_or',
    category: 'gate',
    title: 'ODER-Gatter (Raumbewegung)',
    brand: 'Universal',
    x: 320,
    y: 150,
    inputs: [
      { id: 'in_a', name: 'Eingang A', type: 'boolean' },
      { id: 'in_b', name: 'Eingang B', type: 'boolean' },
    ],
    outputs: [
      { id: 'out_q', name: 'Ausgang Q', type: 'boolean' },
    ],
    state: true,
    currentValue: true,
    config: {},
  },

  // 5. Logic: Treppenlicht-Ausschaltverzögerung (Timer 30s)
  {
    id: 'node-timer',
    type: 'timer_staircase',
    category: 'gate',
    title: 'Treppenlicht-Timer (30s Nachlauf)',
    brand: 'Hager',
    modelCode: 'TJA670 Logic',
    x: 520,
    y: 150,
    inputs: [
      { id: 'trigger_in', name: 'Trigger In', type: 'boolean' },
      { id: 'reset_in', name: 'Reset In', type: 'boolean' },
    ],
    outputs: [
      { id: 'timer_out', name: 'Schaltausgang', type: 'boolean' },
    ],
    state: true,
    currentValue: true,
    config: {
      delaySeconds: 30,
    },
  },

  // 6. Actuator: Hager TXA664D Dimmaktor (Wohnzimmer Licht 80%)
  {
    id: 'node-hager-dimmer',
    type: 'dimmer_actor',
    category: 'output',
    title: 'Hager TXA664D Dimmaktor',
    brand: 'Hager',
    modelCode: 'TXA664D',
    x: 760,
    y: 100,
    inputs: [
      { id: 'switch_in', name: 'Ein/Aus', type: 'boolean' },
      { id: 'dim_val_in', name: 'Dimmwert %', type: 'number' },
    ],
    outputs: [
      { id: 'feedback_out', name: 'Status Rückmeldung', type: 'boolean' },
    ],
    state: true,
    currentValue: 80,
    config: {
      dimLevelPct: 80,
      targetDeviceId: 'smart-light-living',
      busAddress: '1.1.30',
    },
  },

  // 7. Sound Actuator: Hager Elektronischer Gong
  {
    id: 'node-sound-gong',
    type: 'sound_player',
    category: 'media',
    title: 'Hager EV002 Mehrklang-Gong',
    brand: 'Hager',
    modelCode: 'EV002',
    x: 520,
    y: 440,
    inputs: [
      { id: 'play_in', name: 'Ton abspielen', type: 'trigger' },
    ],
    outputs: [
      { id: 'busy_out', name: 'Gong aktiv', type: 'boolean' },
    ],
    state: false,
    currentValue: false,
    config: {
      soundType: 'doorbell',
      busAddress: '1.1.70',
    },
  },

  // 8. Camera Snapshot Actuator: ABB Busch-Welcome Snapshot
  {
    id: 'node-cam-snap',
    type: 'camera_snapshot',
    category: 'media',
    title: 'ABB Kamera Schnappschuss & Aufzeichnung',
    brand: 'ABB',
    modelCode: 'CP-V100',
    x: 760,
    y: 440,
    inputs: [
      { id: 'record_in', name: 'Foto aufnehmen', type: 'trigger' },
    ],
    outputs: [
      { id: 'snap_done', name: 'Gespeichert', type: 'boolean' },
    ],
    state: false,
    currentValue: false,
    config: {
      targetDeviceId: 'cam-entry',
    },
  },
];

export const INITIAL_LOGIC_CONNECTIONS: LogicConnection[] = [
  // 1. Camera Motion -> Gate OR input A
  {
    id: 'conn-1',
    fromNodeId: 'node-cam-motion',
    fromPin: 'motion_out',
    toNodeId: 'node-gate-or',
    toPin: 'in_a',
    isActive: true,
  },
  // 2. Hager Presence -> Gate OR input B
  {
    id: 'conn-2',
    fromNodeId: 'node-hager-pir',
    fromPin: 'presence_out',
    toNodeId: 'node-gate-or',
    toPin: 'in_b',
    isActive: true,
  },
  // 3. Gate OR output -> Timer Trigger In
  {
    id: 'conn-3',
    fromNodeId: 'node-gate-or',
    fromPin: 'out_q',
    toNodeId: 'node-timer',
    toPin: 'trigger_in',
    isActive: true,
  },
  // 4. Timer output -> Hager Dimmer Switch In
  {
    id: 'conn-4',
    fromNodeId: 'node-timer',
    fromPin: 'timer_out',
    toNodeId: 'node-hager-dimmer',
    toPin: 'switch_in',
    isActive: true,
  },
  // 5. ABB Doorbell -> Hager Gong Play In
  {
    id: 'conn-5',
    fromNodeId: 'node-abb-doorbell',
    fromPin: 'bell_out',
    toNodeId: 'node-sound-gong',
    toPin: 'play_in',
    isActive: false,
  },
  // 6. ABB Doorbell -> Camera Snapshot Record In
  {
    id: 'conn-6',
    fromNodeId: 'node-abb-doorbell',
    fromPin: 'bell_out',
    toNodeId: 'node-cam-snap',
    toPin: 'record_in',
    isActive: false,
  },
];

import { LogicRule, WhenTrigger, ThenAction, AndCondition } from '../types';

export const INITIAL_LOGIC_RULES: LogicRule[] = [
  {
    id: 'rule-motion-light',
    title: 'Bewegungslicht Flur & Wohnbereich',
    description: 'Schaltet automatisch das Deckenlicht bei Bewegung ein und nach 3 Minuten wieder aus.',
    enabled: true,
    color: 'amber',
    executionCount: 14,
    lastTriggered: 'Vor 4 Minuten',
    trigger: {
      id: 'trig-1',
      type: 'motion',
      deviceName: 'PIR Präsenzmelder Wohnbereich',
      conditionText: 'Bewegung im Raum erkannt',
      room: 'Wohnbereich',
    },
    condition: {
      id: 'cond-1',
      type: 'ambient_lux',
      label: 'Nur wenn Raum abgedunkelt (< 75 Lux)',
      enabled: true,
      operator: '<',
      value: 75,
    },
    actions: [
      {
        id: 'act-1',
        type: 'turn_on',
        targetDeviceId: 'smart-light-living',
        targetDeviceName: 'Deckenlicht Wohnzimmer',
        actionText: 'Deckenlicht auf 100% einschalten',
        value: 100,
        autoOffSeconds: 180,
      },
    ],
  },
  {
    id: 'rule-doorbell-chime',
    title: 'Türklingel-Signalisierung & Foto',
    description: 'Spielt den Westminster-Gong ab und aktiviert die Eingangsbeleuchtung.',
    enabled: true,
    color: 'sky',
    executionCount: 5,
    lastTriggered: 'Heute, 11:42 Uhr',
    trigger: {
      id: 'trig-2',
      type: 'doorbell',
      deviceName: 'ABB Klingeltaster Eingang',
      conditionText: 'Türklingel gedrückt',
      room: 'Flur / Eingang',
    },
    condition: {
      id: 'cond-2',
      type: 'none',
      label: 'Immer aktiv (Tag & Nacht)',
      enabled: false,
    },
    actions: [
      {
        id: 'act-2a',
        type: 'play_sound',
        targetDeviceName: 'Hager Audio-Gong',
        actionText: 'Westminster Ding-Dong abspielen',
        soundType: 'doorbell',
      },
      {
        id: 'act-2b',
        type: 'camera_snapshot',
        targetDeviceName: 'HD Eingangskamera',
        actionText: 'Schnappschuss speichern',
      },
    ],
  },
  {
    id: 'rule-sunset-ambient',
    title: 'Dämmerungs-Automatik (Abendstimmung)',
    description: 'Dimmt die Pendelleuchte sanft an, sobald es draußen dunkel wird.',
    enabled: true,
    color: 'purple',
    executionCount: 28,
    lastTriggered: 'Gestern, 19:15 Uhr',
    trigger: {
      id: 'trig-3',
      type: 'illuminance',
      deviceName: 'Dämmerungssensor Außen',
      conditionText: 'Helligkeit sinkt unter 60 Lux',
      operator: '<',
      threshold: 60,
    },
    condition: {
      id: 'cond-3',
      type: 'time_range',
      label: 'Nur zwischen 17:00 und 23:00 Uhr',
      enabled: true,
      value: '17:00 - 23:00',
    },
    actions: [
      {
        id: 'act-3',
        type: 'dim',
        targetDeviceId: 'smart-light-dining',
        targetDeviceName: 'Pendelleuchte Esstisch',
        actionText: 'Sanft auf 60% dimmen',
        value: 60,
      },
    ],
  },
  {
    id: 'rule-temp-overheat',
    title: 'Klimaschutz & Lüftung',
    description: 'Aktiviert das Lüftungsrelais, falls die Raumtemperatur im Sommer über 25.5°C steigt.',
    enabled: true,
    color: 'rose',
    executionCount: 3,
    lastTriggered: 'Vor 2 Tagen',
    trigger: {
      id: 'trig-4',
      type: 'temperature',
      deviceName: 'Raumklima Thermostat',
      conditionText: 'Temperatur > 25.5 °C',
      operator: '>',
      threshold: 25.5,
      room: 'Wohnbereich',
    },
    condition: {
      id: 'cond-4',
      type: 'none',
      label: 'Keine Zusatzbedingung',
      enabled: false,
    },
    actions: [
      {
        id: 'act-4',
        type: 'turn_on',
        targetDeviceId: 'smart-tv-plug',
        targetDeviceName: 'Media Steckdosenleiste (Lüfter)',
        actionText: 'Relais für Ventilator einschalten',
      },
    ],
  },
  {
    id: 'rule-all-off-switch',
    title: 'Gute-Nacht / Zentral-Aus Taster',
    description: 'Schaltet alle Leuchten und Standby-Geräte aus und bestätigt per Ton.',
    enabled: true,
    color: 'emerald',
    executionCount: 19,
    lastTriggered: 'Gestern, 23:30 Uhr',
    trigger: {
      id: 'trig-5',
      type: 'switch',
      deviceName: 'Hager Wandschalter Schlafbereich',
      conditionText: 'Taster lang gedrückt (> 2s)',
      room: 'Flur',
    },
    condition: {
      id: 'cond-5',
      type: 'none',
      label: 'Immer aktiv',
      enabled: false,
    },
    actions: [
      {
        id: 'act-5a',
        type: 'activate_scene',
        targetDeviceName: 'Szenen-Controller',
        actionText: 'Szene "Alles Aus" aktivieren',
        sceneName: 'alles_aus',
      },
      {
        id: 'act-5b',
        type: 'play_sound',
        targetDeviceName: 'Piezo Signalgeber',
        actionText: 'Bestätigungston abspielen',
        soundType: 'confirmation',
      },
    ],
  },
];

export interface RulePresetTemplate {
  title: string;
  category: 'Licht' | 'Sicherheit' | 'Klima' | 'Komfort';
  description: string;
  color: 'amber' | 'sky' | 'emerald' | 'rose' | 'purple';
  trigger: WhenTrigger;
  condition?: AndCondition;
  actions: ThenAction[];
}

export const RULE_PRESETS: RulePresetTemplate[] = [
  {
    title: 'Wenn Bewegung, dann Licht an (3 Min Timer)',
    category: 'Licht',
    description: 'Klassisches Flur- oder Treppenhauslicht mit automatischer Abschaltung.',
    color: 'amber',
    trigger: {
      id: 'p-trig-motion',
      type: 'motion',
      deviceName: 'Präsenzmelder Flur',
      conditionText: 'Bewegung erkannt',
    },
    condition: {
      id: 'p-cond-dark',
      type: 'ambient_lux',
      label: 'Nur bei Dämmerung / Nacht (< 60 Lux)',
      enabled: true,
    },
    actions: [
      {
        id: 'p-act-light',
        type: 'turn_on',
        targetDeviceId: 'smart-light-living',
        targetDeviceName: 'Deckenlicht Wohnzimmer',
        actionText: 'Licht AN (100%) mit 3 Min Auto-Aus',
        value: 100,
        autoOffSeconds: 180,
      },
    ],
  },
  {
    title: 'Wenn Klingel, dann Gong & Schnappschuss',
    category: 'Sicherheit',
    description: 'Akustischer Klingelton und sofortige Bildaufnahme der Türkamera.',
    color: 'sky',
    trigger: {
      id: 'p-trig-doorbell',
      type: 'doorbell',
      deviceName: 'Hauseingang Klingel',
      conditionText: 'Klingeltaster gedrückt',
    },
    actions: [
      {
        id: 'p-act-gong',
        type: 'play_sound',
        targetDeviceName: 'Multiroom Audio / Gong',
        actionText: 'Westminster Klingelton abspielen',
        soundType: 'doorbell',
      },
      {
        id: 'p-act-snap',
        type: 'camera_snapshot',
        targetDeviceName: 'Eingangskamera',
        actionText: 'Schnappschuss speichern',
      },
    ],
  },
  {
    title: 'Wenn Sonnenuntergang, dann Gemütlich-Szene',
    category: 'Komfort',
    description: 'Aktiviert zur Dämmerung automatisch warmes Wohlfühl-Licht.',
    color: 'purple',
    trigger: {
      id: 'p-trig-sunset',
      type: 'time',
      deviceName: 'Astro-Uhr / Sonnenstand',
      conditionText: 'Sonnenuntergang erreicht',
    },
    actions: [
      {
        id: 'p-act-scene',
        type: 'activate_scene',
        targetDeviceName: 'Zentral-Gateway',
        actionText: 'Szene "Feierabend / Gemütlich" aktivieren',
        sceneName: 'gemuetlich',
      },
    ],
  },
  {
    title: 'Wenn Rauchmelder Alarm, dann Alle Lichter AN & Sirene',
    category: 'Sicherheit',
    description: 'Notfall-Routine: Fluchtwege ausleuchten und lauten Alarm schlagen.',
    color: 'rose',
    trigger: {
      id: 'p-trig-smoke',
      type: 'smoke',
      deviceName: 'Vernetzter Rauchmelder DIN 14676',
      conditionText: 'Rauchentwicklung detektiert!',
    },
    actions: [
      {
        id: 'p-act-panic-light',
        type: 'turn_on',
        targetDeviceId: 'smart-light-living',
        targetDeviceName: 'Alle Leuchten',
        actionText: 'Fluchtbeleuchtung auf 100% Volllast einschalten',
        value: 100,
      },
      {
        id: 'p-act-siren',
        type: 'play_sound',
        targetDeviceName: 'Signal-Sirene',
        actionText: 'Notfall-Sirene laut pulsieren',
        soundType: 'siren',
      },
    ],
  },
  {
    title: 'Wenn Terrarium Überhitzung (> 42°C), dann Basking Spot AUS',
    category: 'Klima',
    description: 'Überhitzungsschutz für wärmeempfindliche Reptilien.',
    color: 'emerald',
    trigger: {
      id: 'p-trig-terra',
      type: 'terrarium',
      deviceName: 'Terrarium Basking Temperaturfühler',
      conditionText: 'Temperatur > 42.0 °C',
      operator: '>',
      threshold: 42.0,
    },
    actions: [
      {
        id: 'p-act-terra-off',
        type: 'turn_off',
        targetDeviceId: 'smart-terrarium-master',
        targetDeviceName: 'Terrarium Heizstrahler Relais',
        actionText: 'Wärmestrahler zum Schutz abschalten',
      },
    ],
  },
];

import { RoomConfig, AttachmentSide, RoomType, FurnitureItem, ElectricalElement } from '../types';

export interface RoomPreset {
  id: string;
  name: string;
  roomType: RoomType;
  defaultWidth: number;
  defaultLength: number;
  defaultHeight: number;
  wallThickness: number;
  floorTexture: 'wood_parquet' | 'tiles_grey' | 'concrete_modern' | 'carpet_warm';
  wallColor: string;
  description: string;
  defaultFurnishings?: Partial<FurnitureItem>[];
  defaultElectrical?: Partial<ElectricalElement>[];
}

export const ROOM_PRESETS: RoomPreset[] = [
  {
    id: 'preset-bedroom',
    name: 'Schlafzimmer',
    roomType: 'bedroom',
    defaultWidth: 4.6,
    defaultLength: 3.8,
    defaultHeight: 2.6,
    wallThickness: 0.15,
    floorTexture: 'wood_parquet',
    wallColor: '#1e293b',
    description: 'Ruhiger Schlafraum mit Platz für Doppelbett, Nachttische und Kleiderschrank nach DIN 18015.',
    defaultFurnishings: [
      {
        type: 'bed',
        name: 'Doppelbett (180x200cm)',
        dimensions: { width: 2.0, depth: 2.1, height: 0.8 },
        color: '#334155',
      },
      {
        type: 'wardrobe',
        name: 'Kleiderschrank 3-türig',
        dimensions: { width: 2.2, depth: 0.65, height: 2.2 },
        color: '#1e293b',
      },
    ],
    defaultElectrical: [
      {
        type: 'light_ceiling',
        name: 'Schlafzimmer Deckenleuchte',
        heightFromFloorCm: 255,
        powerWatts: 30,
      },
      {
        type: 'switch_single',
        name: 'Lichtschalter Tür',
        heightFromFloorCm: 105,
        powerWatts: 2,
      },
      {
        type: 'socket_double',
        name: 'Steckdose Bett links',
        heightFromFloorCm: 30,
        powerWatts: 60,
      },
      {
        type: 'socket_double',
        name: 'Steckdose Bett rechts',
        heightFromFloorCm: 30,
        powerWatts: 60,
      },
    ],
  },
  {
    id: 'preset-kitchen',
    name: 'Küche & Speisekammer',
    roomType: 'kitchen',
    defaultWidth: 4.2,
    defaultLength: 3.2,
    defaultHeight: 2.6,
    wallThickness: 0.15,
    floorTexture: 'tiles_grey',
    wallColor: '#0f172a',
    description: 'Funktionale Küche mit Sanitär- und Gasanschluss, Arbeitsflächen und Arbeitssteckdosen nach DIN 18015.',
    defaultFurnishings: [
      {
        type: 'kitchen_counter',
        name: 'L-Küchenzeile mit Spülbecken & Kochfeld',
        dimensions: { width: 3.2, depth: 0.65, height: 0.92 },
        color: '#1e293b',
        hasWaterPipe: true,
        hasGasPipe: true,
        sanitaryType: 'water_sink',
      },
    ],
    defaultElectrical: [
      {
        type: 'socket_double',
        name: 'Küchenarbeitssteckdose 1',
        heightFromFloorCm: 115,
        powerWatts: 2200,
      },
      {
        type: 'socket_double',
        name: 'Küchenarbeitssteckdose 2',
        heightFromFloorCm: 115,
        powerWatts: 1800,
      },
      {
        type: 'light_ceiling',
        name: 'Küchen-Deckenleuchte',
        heightFromFloorCm: 255,
        powerWatts: 45,
      },
      {
        type: 'socket_single',
        name: 'Steckdose Geschirrspüler (sep. LS)',
        heightFromFloorCm: 30,
        powerWatts: 2100,
      },
    ],
  },
  {
    id: 'preset-bathroom',
    name: 'Badezimmer (DIN VDE 0100-701)',
    roomType: 'bathroom',
    defaultWidth: 3.2,
    defaultLength: 2.6,
    defaultHeight: 2.6,
    wallThickness: 0.15,
    floorTexture: 'tiles_grey',
    wallColor: '#1e293b',
    description: 'Badezimmer mit Schutzbereichen nach DIN VDE 0100-701, RCD 30mA Pflicht und IP44 Steckdosen.',
    defaultFurnishings: [
      {
        type: 'custom_box',
        name: 'Waschtisch mit Spiegel & Unterschrank',
        dimensions: { width: 1.2, depth: 0.55, height: 0.85 },
        color: '#38bdf8',
        hasWaterPipe: true,
        sanitaryType: 'water_sink',
      },
      {
        type: 'custom_box',
        name: 'Walk-In Dusche / Wanne',
        dimensions: { width: 1.2, depth: 1.0, height: 0.15 },
        color: '#0284c7',
        hasWaterPipe: true,
      },
    ],
    defaultElectrical: [
      {
        type: 'socket_single',
        name: 'Bad-Steckdose IP44 mit Klappdeckel',
        heightFromFloorCm: 115,
        powerWatts: 1200,
      },
      {
        type: 'light_wall',
        name: 'Spiegelleuchte IP44',
        heightFromFloorCm: 190,
        powerWatts: 25,
      },
      {
        type: 'light_ceiling',
        name: 'Feuchtraum-Deckenleuchte IP65',
        heightFromFloorCm: 255,
        powerWatts: 30,
      },
    ],
  },
  {
    id: 'preset-hallway',
    name: 'Flur & Diele',
    roomType: 'hallway',
    defaultWidth: 4.8,
    defaultLength: 1.9,
    defaultHeight: 2.6,
    wallThickness: 0.15,
    floorTexture: 'tiles_grey',
    wallColor: '#1e293b',
    description: 'Verbindungstrakt mit Rauchwarnmelder nach DIN 14676 und Platz für Stromkreis-Unterverteiler.',
    defaultFurnishings: [
      {
        type: 'wardrobe',
        name: 'Flurgarderobe & Schuhschrank',
        dimensions: { width: 1.4, depth: 0.4, height: 2.0 },
        color: '#475569',
      },
    ],
    defaultElectrical: [
      {
        type: 'smoke_detector',
        name: 'Rauchwarnmelder Flur (DIN 14676)',
        heightFromFloorCm: 258,
        powerWatts: 1,
      },
      {
        type: 'light_ceiling',
        name: 'Flur-Deckenleuchte mit Kreuzschaltung',
        heightFromFloorCm: 255,
        powerWatts: 20,
      },
      {
        type: 'switch_series',
        name: 'Serienschalter Flur',
        heightFromFloorCm: 105,
        powerWatts: 2,
      },
    ],
  },
  {
    id: 'preset-office',
    name: 'Home Office / Arbeitszimmer',
    roomType: 'office',
    defaultWidth: 3.8,
    defaultLength: 3.2,
    defaultHeight: 2.6,
    wallThickness: 0.15,
    floorTexture: 'wood_parquet',
    wallColor: '#1e293b',
    description: 'Arbeitsplatz mit LAN-CAT.7 Duplexdose, EDV-Überspannungsschutz und reichlich Arbeitssteckdosen.',
    defaultFurnishings: [
      {
        type: 'desk',
        name: 'Ergonomischer Schreibtisch 160x80cm',
        dimensions: { width: 1.6, depth: 0.8, height: 0.74 },
        color: '#475569',
      },
      {
        type: 'chair',
        name: 'Bürodrehstuhl',
        dimensions: { width: 0.65, depth: 0.65, height: 1.0 },
        color: '#0f172a',
      },
      {
        type: 'bookshelf',
        name: 'Akten- und Bücherregal',
        dimensions: { width: 1.4, depth: 0.35, height: 1.8 },
        color: '#334155',
      },
    ],
    defaultElectrical: [
      {
        type: 'socket_double',
        name: 'EDV-Arbeitsplatz Steckdose 1',
        heightFromFloorCm: 30,
        powerWatts: 450,
      },
      {
        type: 'socket_double',
        name: 'EDV-Arbeitsplatz Steckdose 2',
        heightFromFloorCm: 30,
        powerWatts: 300,
      },
      {
        type: 'light_ceiling',
        name: 'Blendfreie Office-Deckenleuchte',
        heightFromFloorCm: 255,
        powerWatts: 40,
      },
    ],
  },
  {
    id: 'preset-terrarium-lab',
    name: 'Terrarienraum & Reptilien-Lounge',
    roomType: 'terrarium_lab',
    defaultWidth: 3.8,
    defaultLength: 3.0,
    defaultHeight: 2.6,
    wallThickness: 0.15,
    floorTexture: 'tiles_grey',
    wallColor: '#064e3b',
    description: 'Spezialraum für Terrarienanlagen mit automatischer Regenanlage, UV-Zeitschaltuhren und Klimaregelung.',
    defaultFurnishings: [
      {
        type: 'terrarium_tank',
        name: 'Großterrarium Regenwald (150x70x100cm)',
        dimensions: { width: 1.5, depth: 0.7, height: 1.0 },
        color: '#064e3b',
        isTerrarium: true,
      },
      {
        type: 'custom_box',
        name: 'Technikunterschrank Beregnungsanlage',
        dimensions: { width: 1.5, depth: 0.7, height: 0.8 },
        color: '#1f2937',
      },
    ],
    defaultElectrical: [
      {
        type: 'socket_double',
        name: 'Terrarium Smart Socket (Regen & UV)',
        heightFromFloorCm: 50,
        powerWatts: 250,
      },
      {
        type: 'room_thermostat',
        name: 'Digital-Thermostat / Hygrometer',
        heightFromFloorCm: 140,
        powerWatts: 5,
      },
    ],
  },
  {
    id: 'preset-balcony',
    name: 'Balkon / Terrasse',
    roomType: 'balcony',
    defaultWidth: 4.2,
    defaultLength: 1.8,
    defaultHeight: 2.6,
    wallThickness: 0.15,
    floorTexture: 'concrete_modern',
    wallColor: '#334155',
    description: 'Außenbereich mit witterungsbeständiger IP54 Außensteckdose und Außenwandleuchte.',
    defaultElectrical: [
      {
        type: 'socket_single',
        name: 'Außensteckdose IP54 (abschaltbar von innen)',
        heightFromFloorCm: 40,
        powerWatts: 1500,
      },
      {
        type: 'light_wall',
        name: 'Balkon-Wandleuchte IP54',
        heightFromFloorCm: 210,
        powerWatts: 15,
      },
    ],
  },
  {
    id: 'preset-custom',
    name: 'Individueller Raum',
    roomType: 'custom',
    defaultWidth: 4.0,
    defaultLength: 3.5,
    defaultHeight: 2.6,
    wallThickness: 0.15,
    floorTexture: 'wood_parquet',
    wallColor: '#1e293b',
    description: 'Frei konfigurierbarer Raum mit frei wählbaren Maßen, Bodenbelag und Wandfarbe.',
  },
];

/**
 * Calculates the exact 2D center position (x, z) of a new room attached to a target room.
 */
export function calculateAttachedRoomPosition(
  targetRoom: RoomConfig,
  side: AttachmentSide,
  newWidth: number,
  newLength: number,
  alignOffset: number = 0
): { x: number; z: number } {
  const targetPos = targetRoom.position || { x: 0, z: 0 };
  const targetHalfW = targetRoom.width / 2;
  const targetHalfL = targetRoom.length / 2;
  const newHalfW = newWidth / 2;
  const newHalfL = newLength / 2;

  switch (side) {
    case 'east': // Attach to the right (+X)
      return {
        x: Number((targetPos.x + targetHalfW + newHalfW).toFixed(2)),
        z: Number((targetPos.z + alignOffset).toFixed(2)),
      };
    case 'west': // Attach to the left (-X)
      return {
        x: Number((targetPos.x - targetHalfW - newHalfW).toFixed(2)),
        z: Number((targetPos.z + alignOffset).toFixed(2)),
      };
    case 'north': // Attach to the top/back (-Z)
      return {
        x: Number((targetPos.x + alignOffset).toFixed(2)),
        z: Number((targetPos.z - targetHalfL - newHalfL).toFixed(2)),
      };
    case 'south': // Attach to the bottom/front (+Z)
      return {
        x: Number((targetPos.x + alignOffset).toFixed(2)),
        z: Number((targetPos.z + targetHalfL + newHalfL).toFixed(2)),
      };
    default:
      return { x: targetPos.x + targetHalfW + newHalfW, z: targetPos.z };
  }
}

/**
 * Calculates the overall bounding box and total floor area for an array of rooms.
 */
export function calculateApartmentMetrics(rooms: RoomConfig[]): {
  totalAreaSqM: number;
  roomCount: number;
  boundingBox: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    width: number;
    length: number;
    centerX: number;
    centerZ: number;
  };
} {
  if (!rooms || rooms.length === 0) {
    return {
      totalAreaSqM: 0,
      roomCount: 0,
      boundingBox: { minX: -4, maxX: 4, minZ: -3, maxZ: 3, width: 8, length: 6, centerX: 0, centerZ: 0 },
    };
  }

  let totalArea = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  rooms.forEach((r) => {
    const area = r.width * r.length;
    totalArea += area;

    const posX = r.position?.x || 0;
    const posZ = r.position?.z || 0;
    const halfW = r.width / 2;
    const halfL = r.length / 2;

    minX = Math.min(minX, posX - halfW);
    maxX = Math.max(maxX, posX + halfW);
    minZ = Math.min(minZ, posZ - halfL);
    maxZ = Math.max(maxZ, posZ + halfL);
  });

  return {
    totalAreaSqM: Number(totalArea.toFixed(1)),
    roomCount: rooms.length,
    boundingBox: {
      minX,
      maxX,
      minZ,
      maxZ,
      width: Number((maxX - minX).toFixed(2)),
      length: Number((maxZ - minZ).toFixed(2)),
      centerX: Number(((minX + maxX) / 2).toFixed(2)),
      centerZ: Number(((minZ + maxZ) / 2).toFixed(2)),
    },
  };
}

/**
 * Checks if a 2D point (x, z) is inside a specific room.
 */
export function isPointInsideRoom(point: { x: number; z: number }, room: RoomConfig): boolean {
  const posX = room.position?.x || 0;
  const posZ = room.position?.z || 0;
  const halfW = room.width / 2;
  const halfL = room.length / 2;

  return (
    point.x >= posX - halfW &&
    point.x <= posX + halfW &&
    point.z >= posZ - halfL &&
    point.z <= posZ + halfL
  );
}

/**
 * Finds which room a given coordinate belongs to.
 */
export function findRoomAtPoint(point: { x: number; z: number }, rooms: RoomConfig[]): RoomConfig | undefined {
  return rooms.find((r) => isPointInsideRoom(point, r));
}

/**
 * Determines whether two rooms share an adjacent wall and where the shared boundary lies.
 */
export interface SharedWallInfo {
  isAdjacent: boolean;
  sharedSide: AttachmentSide; // Side on roomA
  startCoord: number; // e.g. start along the axis
  endCoord: number; // end along the axis
  overlapLength: number; // length of shared wall in meters
  wallCoordinate: number; // constant coordinate (X or Z)
}

export function detectSharedWall(roomA: RoomConfig, roomB: RoomConfig, tolerance = 0.08): SharedWallInfo | null {
  const posA = roomA.position || { x: 0, z: 0 };
  const posB = roomB.position || { x: 0, z: 0 };

  const aMinX = posA.x - roomA.width / 2;
  const aMaxX = posA.x + roomA.width / 2;
  const aMinZ = posA.z - roomA.length / 2;
  const aMaxZ = posA.z + roomA.length / 2;

  const bMinX = posB.x - roomB.width / 2;
  const bMaxX = posB.x + roomB.width / 2;
  const bMinZ = posB.z - roomB.length / 2;
  const bMaxZ = posB.z + roomB.length / 2;

  // Check East-West touch: roomA East wall touches roomB West wall
  if (Math.abs(aMaxX - bMinX) <= tolerance) {
    const overlapMinZ = Math.max(aMinZ, bMinZ);
    const overlapMaxZ = Math.min(aMaxZ, bMaxZ);
    if (overlapMaxZ - overlapMinZ > 0.3) {
      return {
        isAdjacent: true,
        sharedSide: 'east',
        startCoord: overlapMinZ,
        endCoord: overlapMaxZ,
        overlapLength: Number((overlapMaxZ - overlapMinZ).toFixed(2)),
        wallCoordinate: Number(((aMaxX + bMinX) / 2).toFixed(2)),
      };
    }
  }

  // Check West-East touch: roomA West wall touches roomB East wall
  if (Math.abs(aMinX - bMaxX) <= tolerance) {
    const overlapMinZ = Math.max(aMinZ, bMinZ);
    const overlapMaxZ = Math.min(aMaxZ, bMaxZ);
    if (overlapMaxZ - overlapMinZ > 0.3) {
      return {
        isAdjacent: true,
        sharedSide: 'west',
        startCoord: overlapMinZ,
        endCoord: overlapMaxZ,
        overlapLength: Number((overlapMaxZ - overlapMinZ).toFixed(2)),
        wallCoordinate: Number(((aMinX + bMaxX) / 2).toFixed(2)),
      };
    }
  }

  // Check North-South touch: roomA North wall touches roomB South wall
  if (Math.abs(aMinZ - bMaxZ) <= tolerance) {
    const overlapMinX = Math.max(aMinX, bMinX);
    const overlapMaxX = Math.min(aMaxX, bMaxX);
    if (overlapMaxX - overlapMinX > 0.3) {
      return {
        isAdjacent: true,
        sharedSide: 'north',
        startCoord: overlapMinX,
        endCoord: overlapMaxX,
        overlapLength: Number((overlapMaxX - overlapMinX).toFixed(2)),
        wallCoordinate: Number(((aMinZ + bMaxZ) / 2).toFixed(2)),
      };
    }
  }

  // Check South-North touch: roomA South wall touches roomB North wall
  if (Math.abs(aMaxZ - bMinZ) <= tolerance) {
    const overlapMinX = Math.max(aMinX, bMinX);
    const overlapMaxX = Math.min(aMaxX, bMaxX);
    if (overlapMaxX - overlapMinX > 0.3) {
      return {
        isAdjacent: true,
        sharedSide: 'south',
        startCoord: overlapMinX,
        endCoord: overlapMaxX,
        overlapLength: Number((overlapMaxX - overlapMinX).toFixed(2)),
        wallCoordinate: Number(((aMaxZ + bMinZ) / 2).toFixed(2)),
      };
    }
  }

  return null;
}

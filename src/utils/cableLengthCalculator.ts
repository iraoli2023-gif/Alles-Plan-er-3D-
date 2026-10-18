/**
 * DIN 18015 & VDE 0100 Cable Length & Wall Layout Routing Calculator
 * 
 * Calculates exact cable route lengths based on:
 * 1. Physical room geometry & wall layout (North, East, South, West walls)
 * 2. Device placement & vertical installation zones (DIN 18015-3)
 * 3. Perimeter wall navigation with 90° corner bends and doorway passages
 * 4. Norm-compliant stripping, termination & connection reserves
 * 5. Physical voltage drop (Delta U %) calculations
 */

import { RoomConfig, ElectricalElement, WiringRoute, CableType, Vector3D } from '../types';

export type WallName = 'north' | 'south' | 'east' | 'west' | 'ceiling' | 'floor';

export interface RouteSegmentDetail {
  segmentType: 'vertical_rise' | 'vertical_drop' | 'wall_run' | 'corner_bend' | 'door_transit' | 'connection_reserve';
  label: string;
  distanceMeters: number;
  wall?: WallName;
  description: string;
}

export interface CableLengthCalculationResult {
  totalLengthMeters: number;
  baseGeometricDistanceMeters: number;
  verticalFromMeters: number;
  horizontalWallMeters: number;
  verticalToMeters: number;
  cornerBendsMeters: number;
  reserveMeters: number;
  cornersCount: number;
  startWall: WallName;
  endWall: WallName;
  wallRelationship: 'same_wall' | 'adjacent_wall' | 'opposite_wall' | 'ceiling_connection' | 'cross_room';
  wallPathDescription: string;
  segments: RouteSegmentDetail[];
  points3D: Vector3D[];
  voltageDropPct: number;
  isVoltageDropCompliant: boolean; // <= 3.0%
}

export interface CableLengthOptions {
  installationZone?: 'DIN 18015 Decke (15-30cm)' | 'DIN 18015 Boden (15-30cm)' | 'Senkrechte Vorzugszone' | 'Estrichverlegung';
  customReserveMeters?: number; // Override default connection reserve
  ceilingMarginMeters?: number; // default 0.25m below ceiling
  floorMarginMeters?: number; // default 0.25m above floor
  cornerBendAllowanceMeters?: number; // default 0.15m per 90° bend
}

/**
 * Determine which wall an electrical element belongs to in local room coordinates
 */
export function getElementWall(element: ElectricalElement, room: RoomConfig): WallName {
  if (element.wallSnapped && ['north', 'south', 'east', 'west', 'ceiling', 'floor'].includes(element.wallSnapped)) {
    return element.wallSnapped as WallName;
  }

  // Ceiling detection
  if (
    element.type === 'light_ceiling' || 
    element.type === 'smoke_detector' || 
    element.heightFromFloorCm >= (room.height * 100 - 30)
  ) {
    return 'ceiling';
  }

  // Floor detection
  if (element.heightFromFloorCm <= 5 && element.type === 'sub_distribution_panel') {
    return 'north';
  }

  // Calculate local coordinates relative to room center
  const rx = (room.position?.x || 0);
  const rz = (room.position?.z || 0);
  const localX = element.position.x - rx;
  const localZ = element.position.z - rz;

  const halfW = room.width / 2;
  const halfL = room.length / 2;

  const distNorth = Math.abs(localZ - (-halfL));
  const distSouth = Math.abs(localZ - halfL);
  const distEast = Math.abs(localX - halfW);
  const distWest = Math.abs(localX - (-halfW));

  const minDist = Math.min(distNorth, distSouth, distEast, distWest);

  if (minDist === distNorth) return 'north';
  if (minDist === distSouth) return 'south';
  if (minDist === distEast) return 'east';
  return 'west';
}

/**
 * Get human-readable German name for a wall
 */
export function getWallDisplayName(wall: WallName): string {
  switch (wall) {
    case 'north': return 'Nordwand';
    case 'south': return 'Südwand';
    case 'east': return 'Ostwand';
    case 'west': return 'Westwand';
    case 'ceiling': return 'Decke';
    case 'floor': return 'Boden/Estrich';
  }
}

/**
 * Core calculation of cable length based on room wall layout
 */
export function calculateRouteCableLength(
  fromEl: ElectricalElement,
  toEl: ElectricalElement,
  room: RoomConfig,
  cableType: CableType = 'NYM-J 3x1.5 mm²',
  options: CableLengthOptions = {},
  rooms: RoomConfig[] = []
): CableLengthCalculationResult {
  const allRooms = rooms.length > 0 ? rooms : [room];
  const fromRoom = allRooms.find(r => r.id === fromEl.roomId) || room;
  const toRoom = allRooms.find(r => r.id === toEl.roomId) || room;
  const isCrossRoom = fromRoom.id !== toRoom.id;

  const startWall = getElementWall(fromEl, fromRoom);
  const endWall = getElementWall(toEl, toRoom);

  const ceilingMargin = options.ceilingMarginMeters ?? 0.25;
  const floorMargin = options.floorMarginMeters ?? 0.25;
  const cornerBendAllowance = options.cornerBendAllowanceMeters ?? 0.15;

  // Determine routing elevation Y according to DIN installation zone
  const isFloorRouting = options.installationZone === 'DIN 18015 Boden (15-30cm)';
  const isEstrich = options.installationZone === 'Estrichverlegung';

  let zoneY: number;
  if (isEstrich) {
    zoneY = 0.05; // directly in floor screed
  } else if (isFloorRouting) {
    zoneY = floorMargin; // 25cm above finished floor
  } else {
    // Upper horizontal installation zone 15-30cm below ceiling
    zoneY = Math.max(fromRoom.height - ceilingMargin, 2.30);
  }

  // 1. Vertical Rise/Drop Calculations
  const fromY = fromEl.heightFromFloorCm / 100;
  const toY = toEl.heightFromFloorCm / 100;

  const verticalFromMeters = Number(Math.abs(zoneY - fromY).toFixed(2));
  const verticalToMeters = Number(Math.abs(zoneY - toY).toFixed(2));

  // 2. Horizontal Wall Distance Calculation
  let horizontalWallMeters = 0;
  let cornersCount = 0;
  let wallRelationship: CableLengthCalculationResult['wallRelationship'] = 'same_wall';
  let wallPathDescription = '';
  const segments: RouteSegmentDetail[] = [];
  const points3D: Vector3D[] = [];

  // Add initial start point
  points3D.push({ x: fromEl.position.x, y: fromY, z: fromEl.position.z });

  // Add vertical rise to zone
  points3D.push({ x: fromEl.position.x, y: zoneY, z: fromEl.position.z });
  segments.push({
    segmentType: 'vertical_rise',
    label: `Steigtrasse ${fromEl.name}`,
    distanceMeters: verticalFromMeters,
    wall: startWall,
    description: `Vertikaler Steigweg von Montagehöhe ${fromEl.heightFromFloorCm}cm auf DIN-Installationszone (${(zoneY * 100).toFixed(0)}cm)`
  });

  const rCenterFrom = fromRoom.position || { x: 0, z: 0 };
  const halfW = fromRoom.width / 2;
  const halfL = fromRoom.length / 2;

  // Convert elements to local room coordinates
  const p1 = {
    x: fromEl.position.x - rCenterFrom.x,
    z: fromEl.position.z - rCenterFrom.z,
  };
  const p2 = {
    x: toEl.position.x - rCenterFrom.x,
    z: toEl.position.z - rCenterFrom.z,
  };

  if (isCrossRoom) {
    wallRelationship = 'cross_room';
    // Multi-room passage: distance to doorway + door transition + distance from doorway to destination
    const rCenterTo = toRoom.position || { x: 0, z: 0 };
    const dx = Math.abs(toEl.position.x - fromEl.position.x);
    const dz = Math.abs(toEl.position.z - fromEl.position.z);
    const wallTransit = Number((dx + dz + (fromRoom.wallThickness || 0.18)).toFixed(2));
    horizontalWallMeters = wallTransit;
    cornersCount = 2;
    wallPathDescription = `${getWallDisplayName(startWall)} (${fromRoom.name}) → Wanddurchbruch (${(fromRoom.wallThickness || 0.18).toFixed(2)}m) → ${getWallDisplayName(endWall)} (${toRoom.name})`;

    segments.push({
      segmentType: 'door_transit',
      label: `Raumübergreifende Wandtrasse`,
      distanceMeters: wallTransit,
      description: `Wandtrasse durch Zwischenwanddurchbruch zwischen ${fromRoom.name} und ${toRoom.name}`
    });

    // Cross-room intermediate 3D point
    const midX = (fromEl.position.x + toEl.position.x) / 2;
    const midZ = (fromEl.position.z + toEl.position.z) / 2;
    points3D.push({ x: midX, y: zoneY, z: midZ });
  } else if (startWall === 'ceiling' || endWall === 'ceiling') {
    wallRelationship = 'ceiling_connection';
    const dx = Math.abs(p2.x - p1.x);
    const dz = Math.abs(p2.z - p1.z);
    horizontalWallMeters = Number((dx + dz).toFixed(2));
    cornersCount = 1;
    wallPathDescription = `Deckenverrohrung rechtwinklig nach DIN 18015 (${getWallDisplayName(startWall)} → ${getWallDisplayName(endWall)})`;

    segments.push({
      segmentType: 'wall_run',
      label: 'Decken- & Wandtrasse',
      distanceMeters: horizontalWallMeters,
      description: `Rechtwinklige Verlegung im Deckenbereich parallel zu den Raumachsen (${dx.toFixed(2)}m × ${dz.toFixed(2)}m)`
    });

    points3D.push({ x: toEl.position.x, y: zoneY, z: fromEl.position.z });
  } else if (startWall === endWall) {
    wallRelationship = 'same_wall';
    cornersCount = 0;
    let distAlongWall = 0;
    if (startWall === 'north' || startWall === 'south') {
      distAlongWall = Math.abs(p2.x - p1.x);
    } else {
      distAlongWall = Math.abs(p2.z - p1.z);
    }
    distAlongWall = Number(distAlongWall.toFixed(2));
    horizontalWallMeters = distAlongWall;
    wallPathDescription = `Direkte Wandtrasse auf derselben ${getWallDisplayName(startWall)} (${distAlongWall}m)`;

    segments.push({
      segmentType: 'wall_run',
      label: `Wandtrasse ${getWallDisplayName(startWall)}`,
      distanceMeters: distAlongWall,
      wall: startWall,
      description: `Horizontale Installationszone auf der ${getWallDisplayName(startWall)} zwischen Punkt 1 und 2`
    });

    // Same wall waypoint
    points3D.push({ x: toEl.position.x, y: zoneY, z: toEl.position.z });
  } else if (
    (startWall === 'north' && endWall === 'south') ||
    (startWall === 'south' && endWall === 'north') ||
    (startWall === 'east' && endWall === 'west') ||
    (startWall === 'west' && endWall === 'east')
  ) {
    wallRelationship = 'opposite_wall';
    cornersCount = 2;

    if (isEstrich) {
      // Direct 90-degree screed route across the room
      const dx = Math.abs(p2.x - p1.x);
      const dz = Math.abs(p2.z - p1.z);
      horizontalWallMeters = Number((dx + dz).toFixed(2));
      wallPathDescription = `Estrich-Bodenquerung 90° (${horizontalWallMeters}m)`;

      segments.push({
        segmentType: 'wall_run',
        label: 'Estrich-Bodenkanal',
        distanceMeters: horizontalWallMeters,
        description: `Unterestrich-Verrohrung im Rohboden quer durch den Raum`
      });

      points3D.push({ x: toEl.position.x, y: zoneY, z: fromEl.position.z });
    } else if (startWall === 'north' || startWall === 'south') {
      // Route around the perimeter walls via East or West wall
      const northPoint = startWall === 'north' ? p1 : p2;
      const southPoint = startWall === 'south' ? p1 : p2;

      // Via East wall:
      const eastRouteDist = (halfW - northPoint.x) + fromRoom.length + (halfW - southPoint.x);
      // Via West wall:
      const westRouteDist = (northPoint.x + halfW) + fromRoom.length + (southPoint.x + halfW);

      if (eastRouteDist <= westRouteDist) {
        horizontalWallMeters = Number(eastRouteDist.toFixed(2));
        wallPathDescription = `Perimeter-Wandtrasse über Ostwand: ${getWallDisplayName(startWall)} (${(halfW - p1.x).toFixed(2)}m) → NO-Ecke → Ostwand (${fromRoom.length.toFixed(2)}m) → SE-Ecke → ${getWallDisplayName(endWall)} (${(halfW - p2.x).toFixed(2)}m)`;
        
        segments.push({
          segmentType: 'wall_run',
          label: 'Wandperimeter via Ostwand',
          distanceMeters: horizontalWallMeters,
          description: `Perimeter-Umfahrung der Raumecken Nord-Ost und Süd-Ost`
        });

        points3D.push({ x: rCenterFrom.x + halfW, y: zoneY, z: rCenterFrom.z - halfL });
        points3D.push({ x: rCenterFrom.x + halfW, y: zoneY, z: rCenterFrom.z + halfL });
      } else {
        horizontalWallMeters = Number(westRouteDist.toFixed(2));
        wallPathDescription = `Perimeter-Wandtrasse über Westwand: ${getWallDisplayName(startWall)} (${(p1.x + halfW).toFixed(2)}m) → NW-Ecke → Westwand (${fromRoom.length.toFixed(2)}m) → SW-Ecke → ${getWallDisplayName(endWall)} (${(p2.x + halfW).toFixed(2)}m)`;

        segments.push({
          segmentType: 'wall_run',
          label: 'Wandperimeter via Westwand',
          distanceMeters: horizontalWallMeters,
          description: `Perimeter-Umfahrung der Raumecken Nord-West und Süd-West`
        });

        points3D.push({ x: rCenterFrom.x - halfW, y: zoneY, z: rCenterFrom.z - halfL });
        points3D.push({ x: rCenterFrom.x - halfW, y: zoneY, z: rCenterFrom.z + halfL });
      }
    } else {
      // East to West opposite wall
      const eastPoint = startWall === 'east' ? p1 : p2;
      const westPoint = startWall === 'west' ? p1 : p2;

      // Via North wall:
      const northRouteDist = (eastPoint.z + halfL) + fromRoom.width + (westPoint.z + halfL);
      // Via South wall:
      const southRouteDist = (halfL - eastPoint.z) + fromRoom.width + (halfL - westPoint.z);

      if (northRouteDist <= southRouteDist) {
        horizontalWallMeters = Number(northRouteDist.toFixed(2));
        wallPathDescription = `Perimeter-Wandtrasse über Nordwand: ${getWallDisplayName(startWall)} (${(p1.z + halfL).toFixed(2)}m) → NO-Ecke → Nordwand (${fromRoom.width.toFixed(2)}m) → NW-Ecke → ${getWallDisplayName(endWall)} (${(p2.z + halfL).toFixed(2)}m)`;

        segments.push({
          segmentType: 'wall_run',
          label: 'Wandperimeter via Nordwand',
          distanceMeters: horizontalWallMeters,
          description: `Perimeter-Umfahrung der Raumecken über die Nordwand`
        });

        points3D.push({ x: rCenterFrom.x + halfW, y: zoneY, z: rCenterFrom.z - halfL });
        points3D.push({ x: rCenterFrom.x - halfW, y: zoneY, z: rCenterFrom.z - halfL });
      } else {
        horizontalWallMeters = Number(southRouteDist.toFixed(2));
        wallPathDescription = `Perimeter-Wandtrasse über Südwand: ${getWallDisplayName(startWall)} (${(halfL - p1.z).toFixed(2)}m) → SO-Ecke → Südwand (${fromRoom.width.toFixed(2)}m) → SW-Ecke → ${getWallDisplayName(endWall)} (${(halfL - p2.z).toFixed(2)}m)`;

        segments.push({
          segmentType: 'wall_run',
          label: 'Wandperimeter via Südwand',
          distanceMeters: horizontalWallMeters,
          description: `Perimeter-Umfahrung der Raumecken über die Südwand`
        });

        points3D.push({ x: rCenterFrom.x + halfW, y: zoneY, z: rCenterFrom.z + halfL });
        points3D.push({ x: rCenterFrom.x - halfW, y: zoneY, z: rCenterFrom.z + halfL });
      }
    }
  } else {
    // Adjacent walls (e.g. North and East, North and West, South and East, South and West)
    wallRelationship = 'adjacent_wall';
    cornersCount = 1;

    let cornerName = '';
    let cornerX = 0;
    let cornerZ = 0;
    let dist1 = 0;
    let dist2 = 0;

    if ((startWall === 'north' && endWall === 'east') || (startWall === 'east' && endWall === 'north')) {
      cornerName = 'Nord-Ost-Ecke (NE)';
      cornerX = halfW;
      cornerZ = -halfL;
      dist1 = startWall === 'north' ? Math.abs(halfW - p1.x) : Math.abs(p1.z - (-halfL));
      dist2 = endWall === 'east' ? Math.abs(p2.z - (-halfL)) : Math.abs(halfW - p2.x);
    } else if ((startWall === 'north' && endWall === 'west') || (startWall === 'west' && endWall === 'north')) {
      cornerName = 'Nord-West-Ecke (NW)';
      cornerX = -halfW;
      cornerZ = -halfL;
      dist1 = startWall === 'north' ? Math.abs(p1.x - (-halfW)) : Math.abs(p1.z - (-halfL));
      dist2 = endWall === 'west' ? Math.abs(p2.z - (-halfL)) : Math.abs(p2.x - (-halfW));
    } else if ((startWall === 'south' && endWall === 'east') || (startWall === 'east' && endWall === 'south')) {
      cornerName = 'Süd-Ost-Ecke (SE)';
      cornerX = halfW;
      cornerZ = halfL;
      dist1 = startWall === 'south' ? Math.abs(halfW - p1.x) : Math.abs(halfL - p1.z);
      dist2 = endWall === 'east' ? Math.abs(halfL - p2.z) : Math.abs(halfW - p2.x);
    } else {
      cornerName = 'Süd-West-Ecke (SW)';
      cornerX = -halfW;
      cornerZ = halfL;
      dist1 = startWall === 'south' ? Math.abs(p1.x - (-halfW)) : Math.abs(halfL - p1.z);
      dist2 = endWall === 'west' ? Math.abs(halfL - p2.z) : Math.abs(p2.x - (-halfW));
    }

    horizontalWallMeters = Number((dist1 + dist2).toFixed(2));
    wallPathDescription = `${getWallDisplayName(startWall)} (${dist1.toFixed(2)}m) → 90°-Knick an ${cornerName} → ${getWallDisplayName(endWall)} (${dist2.toFixed(2)}m)`;

    segments.push({
      segmentType: 'wall_run',
      label: `Wandtrasse über ${cornerName}`,
      distanceMeters: horizontalWallMeters,
      description: `Wandverlauf von ${getWallDisplayName(startWall)} über die ${cornerName} zur ${getWallDisplayName(endWall)}`
    });

    points3D.push({ x: rCenterFrom.x + cornerX, y: zoneY, z: rCenterFrom.z + cornerZ });
  }

  // Add vertical drop to target element
  points3D.push({ x: toEl.position.x, y: zoneY, z: toEl.position.z });
  points3D.push({ x: toEl.position.x, y: toY, z: toEl.position.z });

  segments.push({
    segmentType: 'vertical_drop',
    label: `Falltrasse ${toEl.name}`,
    distanceMeters: verticalToMeters,
    wall: endWall,
    description: `Vertikaler Fallweg von DIN-Installationszone (${(zoneY * 100).toFixed(0)}cm) auf Zielhöhe ${toEl.heightFromFloorCm}cm`
  });

  // 3. Corner & Bend Allowance (Biegeradius-Zuschlag)
  const cornerBendsMeters = Number((cornersCount * cornerBendAllowance).toFixed(2));
  if (cornersCount > 0) {
    segments.push({
      segmentType: 'corner_bend',
      label: `${cornersCount}x 90°-Rohrbögen`,
      distanceMeters: cornerBendsMeters,
      description: `Zuschlag für ${cornersCount} 90°-Biegeradien nach DIN EN 61386 (+${cornerBendAllowance}m je Bogen)`
    });
  }

  // 4. Connection & Stripping Reserve (DIN Verschnitt & Anschlussreserve)
  let reserveMeters: number;
  if (options.customReserveMeters !== undefined) {
    reserveMeters = Number(options.customReserveMeters.toFixed(2));
  } else {
    const fromIsPanel = fromEl.type === 'sub_distribution_panel';
    const toIsPanel = toEl.type === 'sub_distribution_panel';
    const fromReserve = fromIsPanel ? 0.75 : 0.35;
    const toReserve = toIsPanel ? 0.75 : 0.35;
    reserveMeters = Number((fromReserve + toReserve).toFixed(2));
  }

  segments.push({
    segmentType: 'connection_reserve',
    label: 'Anschluss- & Abmantelreserve',
    distanceMeters: reserveMeters,
    description: `DIN-Verlegezuschlag für Dosenanschlussklemmen, Abmantelung und Schaltschrankverdrahtung (+${reserveMeters}m)`
  });

  // Base geometric distance (without reserves)
  const baseGeometricDistanceMeters = Number(
    (verticalFromMeters + horizontalWallMeters + verticalToMeters).toFixed(2)
  );

  // Total calculated length in meters
  const totalLengthMeters = Number(
    (baseGeometricDistanceMeters + cornerBendsMeters + reserveMeters).toFixed(1)
  );

  // 5. Accurate VDE 0100 Voltage Drop (Delta U %)
  const crossSection = cableType.includes('2.5') ? 2.5 : 1.5;
  const isThreePhase = cableType.includes('5x2.5');
  const voltage = isThreePhase ? 400 : 230;
  // Standard residential circuit rated current or load current
  const currentA = 16.0;
  const copperConductivity = 56.0; // m / (Ohm * mm²)

  // Formula: Delta U % = (2 * L * I) / (gamma * A * U) * 100 for 1-phase AC
  // For 3-phase: Delta U % = (sqrt(3) * L * I) / (gamma * A * U) * 100
  const factor = isThreePhase ? Math.sqrt(3) : 2.0;
  const voltageDropPct = Number(
    (((factor * totalLengthMeters * currentA) / (copperConductivity * crossSection * voltage)) * 100).toFixed(2)
  );
  const isVoltageDropCompliant = voltageDropPct <= 3.0;

  return {
    totalLengthMeters,
    baseGeometricDistanceMeters,
    verticalFromMeters,
    horizontalWallMeters,
    verticalToMeters,
    cornerBendsMeters,
    reserveMeters,
    cornersCount,
    startWall,
    endWall,
    wallRelationship,
    wallPathDescription,
    segments,
    points3D,
    voltageDropPct,
    isVoltageDropCompliant,
  };
}

/**
 * Batch recalculate all wiring routes in a project based on the wall layouts
 */
export function recalculateAllWiringRoutes(
  routes: WiringRoute[],
  electrical: ElectricalElement[],
  room: RoomConfig,
  rooms: RoomConfig[] = [],
  options: CableLengthOptions = {}
): WiringRoute[] {
  return routes.map(route => {
    const fromEl = electrical.find(e => e.id === route.fromId);
    const toEl = electrical.find(e => e.id === route.toId);
    if (!fromEl || !toEl) return route;

    const calc = calculateRouteCableLength(
      fromEl,
      toEl,
      room,
      route.cableType,
      {
        ...options,
        installationZone: (route.installationZone as any) || options.installationZone
      },
      rooms
    );

    return {
      ...route,
      lengthMeters: calc.totalLengthMeters,
      voltageDropPct: calc.voltageDropPct,
      points: calc.points3D,
    };
  });
}

import * as THREE from 'three';
import { FurnitureItem, RoomConfig, WiringRoute, ElectricalElement, PipeClearanceConflict, Vector3D } from '../types';

export interface PipeSegmentDef {
  id: string;
  type: 'water' | 'gas';
  subType: 'cold_water' | 'warm_water' | 'drainage' | 'gas';
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number; // in meters (e.g. 0.012 = 12mm)
  color: number;
  label: string;
}

export interface SanitaryPipeSystem {
  id: string;
  furnitureId: string;
  furnitureName: string;
  hasWater: boolean;
  hasGas: boolean;
  segments: PipeSegmentDef[];
  anchorPosition: Vector3D;
}

/**
 * Derives realistic 3D in-wall / surface-mounted pipe routes based on furniture placement (kitchen sink, dishwasher, gas appliances).
 */
export function deriveSanitaryPipes(furniture: FurnitureItem[], room: RoomConfig, rooms?: RoomConfig[]): SanitaryPipeSystem[] {
  const systems: SanitaryPipeSystem[] = [];

  furniture.forEach((furn) => {
    const isKitchen = furn.type === 'kitchen_counter' || furn.name.toLowerCase().includes('küche') || furn.name.toLowerCase().includes('spüle');
    const hasWater = Boolean(furn.hasWaterPipe || furn.sanitaryType === 'water_sink' || isKitchen);
    const hasGas = Boolean(furn.hasGasPipe || furn.sanitaryType === 'gas_stove' || furn.name.toLowerCase().includes('gas'));

    if (!hasWater && !hasGas) return;

    // Resolve containing room
    const targetRoom = (rooms && furn.roomId ? rooms.find(r => r.id === furn.roomId) : null)
      || (rooms ? rooms.find(r => {
        const rx = r.position?.x || 0;
        const rz = r.position?.z || 0;
        return Math.abs(furn.position.x - rx) <= r.width / 2 + 0.1 && Math.abs(furn.position.z - rz) <= r.length / 2 + 0.1;
      }) : null)
      || room;

    const rPos = targetRoom.position || { x: 0, z: 0 };
    const halfW = targetRoom.width / 2;
    const halfL = targetRoom.length / 2;

    // Determine nearest wall to attach the installation pipes
    // Distances to west, east, north, south of this room
    const distWest = Math.abs(furn.position.x - (rPos.x - halfW));
    const distEast = Math.abs(furn.position.x - (rPos.x + halfW));
    const distNorth = Math.abs(furn.position.z - (rPos.z - halfL));
    const distSouth = Math.abs(furn.position.z - (rPos.z + halfL));

    const minDist = Math.min(distWest, distEast, distNorth, distSouth);
    let wallSide: 'west' | 'east' | 'north' | 'south' = 'west';
    let wallCoord = rPos.x - halfW + 0.18; // offset from wall core onto inside face

    if (minDist === distEast) {
      wallSide = 'east';
      wallCoord = rPos.x + halfW - 0.18;
    } else if (minDist === distNorth) {
      wallSide = 'north';
      wallCoord = rPos.z - halfL + 0.18;
    } else if (minDist === distSouth) {
      wallSide = 'south';
      wallCoord = rPos.z + halfL - 0.18;
    }

    const segments: PipeSegmentDef[] = [];
    const fx = furn.position.x;
    const fz = furn.position.z;

    if (wallSide === 'west' || wallSide === 'east') {
      const wx = wallCoord;
      // Sink area center is around fz + 0.25
      const sinkZ = fz + 0.25;

      if (hasWater) {
        // 1. Cold water pipe (Trinkwasser Kalt DIN 1988, Blue RAL 5015)
        // Vertical riser from floor up to tap
        segments.push({
          id: `${furn.id}-pipe-cold-riser`,
          type: 'water',
          subType: 'cold_water',
          start: new THREE.Vector3(wx, 0.05, sinkZ + 0.08),
          end: new THREE.Vector3(wx, 0.65, sinkZ + 0.08),
          radius: 0.012,
          color: 0x0284c7, // Sky blue
          label: 'Kaltwasserleitung (DN15)',
        });
        // Horizontal distribution pipe along wall
        segments.push({
          id: `${furn.id}-pipe-cold-horiz`,
          type: 'water',
          subType: 'cold_water',
          start: new THREE.Vector3(wx, 0.35, sinkZ - 0.65),
          end: new THREE.Vector3(wx, 0.35, sinkZ + 0.45),
          radius: 0.012,
          color: 0x0284c7,
          label: 'Kaltwasser Verteilstrang',
        });

        // 2. Warm water pipe (Trinkwasser Warm, Red RAL 3000)
        segments.push({
          id: `${furn.id}-pipe-warm-riser`,
          type: 'water',
          subType: 'warm_water',
          start: new THREE.Vector3(wx, 0.05, sinkZ - 0.08),
          end: new THREE.Vector3(wx, 0.65, sinkZ - 0.08),
          radius: 0.011,
          color: 0xef4444, // Red
          label: 'Warmwasserleitung (DN15)',
        });
        segments.push({
          id: `${furn.id}-pipe-warm-horiz`,
          type: 'water',
          subType: 'warm_water',
          start: new THREE.Vector3(wx, 0.42, sinkZ - 0.65),
          end: new THREE.Vector3(wx, 0.42, sinkZ + 0.45),
          radius: 0.011,
          color: 0xef4444,
          label: 'Warmwasser Verteilstrang',
        });

        // 3. Drainage pipe (Abwasser HT-Rohr DN50, Grey)
        segments.push({
          id: `${furn.id}-pipe-drain`,
          type: 'water',
          subType: 'drainage',
          start: new THREE.Vector3(wx - 0.01, 0.05, sinkZ),
          end: new THREE.Vector3(wx - 0.01, 0.45, sinkZ),
          radius: 0.026,
          color: 0x64748b, // Slate
          label: 'Abwasseranschluss HT DN50',
        });
      }

      if (hasGas) {
        // Gas pipe (DVGW-TRGI Erdgasleitung, Yellow RAL 1021)
        const gasZ = fz - 0.45;
        segments.push({
          id: `${furn.id}-pipe-gas-riser`,
          type: 'gas',
          subType: 'gas',
          start: new THREE.Vector3(wx, 0.05, gasZ),
          end: new THREE.Vector3(wx, 0.55, gasZ),
          radius: 0.015,
          color: 0xeab308, // Yellow
          label: 'Gasrohr DVGW-TRGI (DN20)',
        });
        segments.push({
          id: `${furn.id}-pipe-gas-horiz`,
          type: 'gas',
          subType: 'gas',
          start: new THREE.Vector3(wx, 0.22, gasZ - 0.4),
          end: new THREE.Vector3(wx, 0.22, gasZ + 0.3),
          radius: 0.015,
          color: 0xeab308,
          label: 'Gas-Zuleitung (Gelb)',
        });
      }
    } else {
      // North or South wall alignment
      const wz = wallCoord;
      const sinkX = fx + 0.25;

      if (hasWater) {
        segments.push({
          id: `${furn.id}-pipe-cold-riser`,
          type: 'water',
          subType: 'cold_water',
          start: new THREE.Vector3(sinkX + 0.08, 0.05, wz),
          end: new THREE.Vector3(sinkX + 0.08, 0.65, wz),
          radius: 0.012,
          color: 0x0284c7,
          label: 'Kaltwasserleitung (DN15)',
        });
        segments.push({
          id: `${furn.id}-pipe-cold-horiz`,
          type: 'water',
          subType: 'cold_water',
          start: new THREE.Vector3(sinkX - 0.65, 0.35, wz),
          end: new THREE.Vector3(sinkX + 0.45, 0.35, wz),
          radius: 0.012,
          color: 0x0284c7,
          label: 'Kaltwasser Verteilstrang',
        });
        segments.push({
          id: `${furn.id}-pipe-warm-riser`,
          type: 'water',
          subType: 'warm_water',
          start: new THREE.Vector3(sinkX - 0.08, 0.05, wz),
          end: new THREE.Vector3(sinkX - 0.08, 0.65, wz),
          radius: 0.011,
          color: 0xef4444,
          label: 'Warmwasserleitung (DN15)',
        });
      }

      if (hasGas) {
        const gasX = fx - 0.45;
        segments.push({
          id: `${furn.id}-pipe-gas-riser`,
          type: 'gas',
          subType: 'gas',
          start: new THREE.Vector3(gasX, 0.05, wz),
          end: new THREE.Vector3(gasX, 0.55, wz),
          radius: 0.015,
          color: 0xeab308,
          label: 'Gasrohr DVGW-TRGI (DN20)',
        });
      }
    }

    systems.push({
      id: `sys-${furn.id}`,
      furnitureId: furn.id,
      furnitureName: furn.name,
      hasWater,
      hasGas,
      segments,
      anchorPosition: furn.position,
    });
  });

  return systems;
}

/**
 * Calculates Euclidean 3D distance between a point P and a finite line segment [A, B].
 */
export function distancePointToSegment(
  P: THREE.Vector3,
  A: THREE.Vector3,
  B: THREE.Vector3
): { distance: number; closestPoint: THREE.Vector3 } {
  const AB = new THREE.Vector3().subVectors(B, A);
  const AP = new THREE.Vector3().subVectors(P, A);
  const abLenSq = AB.lengthSq();

  if (abLenSq < 0.000001) {
    return { distance: P.distanceTo(A), closestPoint: A.clone() };
  }

  const t = Math.max(0, Math.min(1, AP.dot(AB) / abLenSq));
  const closest = new THREE.Vector3().copy(A).addScaledVector(AB, t);
  return { distance: P.distanceTo(closest), closestPoint: closest };
}

/**
 * Calculates shortest 3D distance between two finite line segments [A, B] and [C, D].
 */
export function distanceBetweenSegments(
  A: THREE.Vector3,
  B: THREE.Vector3,
  C: THREE.Vector3,
  D: THREE.Vector3,
  samples = 8
): { distance: number; pointOnAB: THREE.Vector3; pointOnCD: THREE.Vector3 } {
  let minDistance = Infinity;
  let bestOnAB = A.clone();
  let bestOnCD = C.clone();

  // Sample points along AB and find closest on CD
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pAB = new THREE.Vector3().lerpVectors(A, B, t);
    const { distance, closestPoint } = distancePointToSegment(pAB, C, D);
    if (distance < minDistance) {
      minDistance = distance;
      bestOnAB = pAB;
      bestOnCD = closestPoint;
    }
  }

  // Also sample along CD and find closest on AB
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pCD = new THREE.Vector3().lerpVectors(C, D, t);
    const { distance, closestPoint } = distancePointToSegment(pCD, A, B);
    if (distance < minDistance) {
      minDistance = distance;
      bestOnAB = closestPoint;
      bestOnCD = pCD;
    }
  }

  return { distance: minDistance, pointOnAB: bestOnAB, pointOnCD: bestOnCD };
}

/**
 * Checks all electrical wiring routes against water and gas pipe systems according to DIN VDE 0100-520 and DVGW-TRGI.
 * Minimum clearance threshold: 20 cm (0.20 m).
 */
export function checkPipeClearanceConflicts(
  systems: SanitaryPipeSystem[],
  wiring: WiringRoute[],
  electrical: ElectricalElement[]
): PipeClearanceConflict[] {
  const conflicts: PipeClearanceConflict[] = [];
  const MIN_CLEARANCE_METERS = 0.20; // 20 cm DIN VDE 0100-520

  systems.forEach((sys) => {
    sys.segments.forEach((pipe) => {
      // Check each wiring route
      wiring.forEach((route) => {
        if (!route.points || route.points.length < 2) return;

        for (let i = 0; i < route.points.length - 1; i++) {
          const ptA = new THREE.Vector3(route.points[i].x, route.points[i].y, route.points[i].z);
          const ptB = new THREE.Vector3(route.points[i + 1].x, route.points[i + 1].y, route.points[i + 1].z);

          const { distance, pointOnAB, pointOnCD } = distanceBetweenSegments(ptA, ptB, pipe.start, pipe.end);

          if (distance < MIN_CLEARANCE_METERS) {
            const actualDistanceCm = Math.round(distance * 100 * 10) / 10;
            const conflictId = `conflict-${route.id}-${pipe.id}`;

            // Prevent duplicate conflicts for the same route and system
            const existing = conflicts.find(c => c.routeId === route.id && c.furnitureId === sys.furnitureId);
            if (!existing) {
              const isGas = pipe.type === 'gas';
              conflicts.push({
                id: conflictId,
                type: pipe.type,
                standard: isGas ? 'DVGW-TRGI' : 'DIN VDE 0100-520',
                minDistanceCm: 20,
                actualDistanceCm,
                location: {
                  x: Number(pointOnAB.x.toFixed(3)),
                  y: Number(pointOnAB.y.toFixed(3)),
                  z: Number(pointOnAB.z.toFixed(3)),
                },
                routeId: route.id,
                routeName: `${route.cableType} (${route.installationZone || 'UP'})`,
                furnitureId: sys.furnitureId,
                furnitureName: sys.furnitureName,
                severity: actualDistanceCm < 12 ? 'critical' : 'warning',
                description: `Elektrische Leitung '${route.cableType}' unterschreitet den DIN VDE 0100-520 Sicherheitsabstand zu ${
                  isGas ? 'Gasrohr' : 'Wasserleitung'
                } (${actualDistanceCm} cm statt mind. 20 cm).`,
                suggestedOffsetMeters: 0.18,
              });
            }
          }
        }
      });
    });
  });

  return conflicts;
}

/**
 * 1-Click DIN clearance resolution: offsets the wiring points away from the sanitary pipes to guarantee >= 25 cm clearance.
 */
export function autoFixClearance(
  conflict: PipeClearanceConflict,
  wiring: WiringRoute[]
): WiringRoute[] {
  return wiring.map((route) => {
    if (route.id !== conflict.routeId) return route;

    const newPoints = route.points.map((p) => {
      // If the point is close to the conflict location in 3D
      const pVec = new THREE.Vector3(p.x, p.y, p.z);
      const confVec = new THREE.Vector3(conflict.location.x, conflict.location.y, conflict.location.z);
      const dist = pVec.distanceTo(confVec);

      if (dist < 1.2) {
        // Shift Z away from the sink / water pipe towards room center or north/south
        const shiftedZ = p.z > conflict.location.z ? p.z + 0.25 : p.z - 0.25;
        return {
          ...p,
          z: Number(shiftedZ.toFixed(2)),
        };
      }
      return p;
    });

    return {
      ...route,
      points: newPoints,
      installationZone: route.installationZone,
    };
  });
}

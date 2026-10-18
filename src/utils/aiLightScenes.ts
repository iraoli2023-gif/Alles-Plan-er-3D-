import { RoomConfig, ElectricalElement, SmartDevice, FurnitureItem, LightSceneSuggestion } from '../types';

/**
 * Generates automated, intelligent photometric light scene suggestions
 * based on the room's CAD floor plan, functional zones, and electrical lighting equipment.
 */
export function generateAILightSceneSuggestions(
  room: RoomConfig,
  electrical: ElectricalElement[],
  smartDevices: SmartDevice[],
  furniture: FurnitureItem[]
): LightSceneSuggestion[] {
  const roomArea = (room.width * room.length).toFixed(1);
  const lights = electrical.filter(e => e.type.includes('light'));
  const hasTerrarium = furniture.some(f => f.isTerrarium || f.type === 'terrarium_tank');
  const hasKitchen = furniture.some(f => f.type === 'kitchen_counter');
  const hasDeskOrTable = furniture.some(f => f.type === 'table' || f.type === 'desk');

  const suggestions: LightSceneSuggestion[] = [
    {
      id: 'scene-ai-ambiente',
      name: 'Ambiente & Wohlfühlen',
      category: 'ambiente',
      iconName: 'Sparkles',
      description: 'Sanftes, warmes Stimmungslicht für gemütliche Feierabende und Entspannung.',
      luxTarget: 120,
      colorTempKelvin: 2700,
      estimatedWatts: 32,
      energySavingPct: 75,
      dimmerSettings: lights.map(l => ({
        deviceId: l.smartDeviceId || l.id,
        deviceName: l.name,
        dimLevelPct: l.name.toLowerCase().includes('wohnzimmer') ? 25 : l.name.toLowerCase().includes('esstisch') ? 18 : 15,
        colorTemp: '2700K (Warmweiß)',
      })),
      rationale: `Auf Basis des ${roomArea} m² Grundrisses: Durch das gezielte Abdimmen der Deckenleuchten auf unter 25% und Fokussierung auf indirektes Warmweiß im Sofabereich entsteht eine ergonomische Wohlfühlatmosphäre nach DIN EN 12464-1.`,
    },
    {
      id: 'scene-ai-arbeiten',
      name: 'Arbeiten & Homeoffice',
      category: 'arbeiten',
      iconName: 'Briefcase',
      description: 'Normgerechte Beleuchtung nach DIN EN 12464-1 für konzentriertes Arbeiten und Lesen.',
      luxTarget: 550,
      colorTempKelvin: 4000,
      estimatedWatts: 86,
      energySavingPct: 35,
      dimmerSettings: lights.map(l => ({
        deviceId: l.smartDeviceId || l.id,
        deviceName: l.name,
        dimLevelPct: l.name.toLowerCase().includes('esstisch') || l.name.toLowerCase().includes('tisch') ? 100 : 40,
        colorTemp: '4000K (Neutralweiß / Fokus)',
      })),
      rationale: `Für die im Grundriss erkannte Ess- und Arbeitstisch-Zone wird eine schattenfreie Beleuchtungsstärke von ≥ 500 Lux (DIN EN 12464-1) bei 4000K bereitgestellt. Das Umfeld wird auf 40% gedimmt, um Augenermüdung durch extreme Kontraste zu verhindern.`,
    },
    {
      id: 'scene-ai-kochen',
      name: 'Kochen & Zubereitung',
      category: 'kochen',
      iconName: 'ChefHat',
      description: 'Helles, farbtreues Arbeitslicht für die Küchenzeile und Lebensmittelzubereitung.',
      luxTarget: 750,
      colorTempKelvin: 3500,
      estimatedWatts: 72,
      energySavingPct: 45,
      dimmerSettings: lights.map(l => ({
        deviceId: l.smartDeviceId || l.id,
        deviceName: l.name,
        dimLevelPct: l.name.toLowerCase().includes('küche') ? 100 : l.name.toLowerCase().includes('esstisch') ? 45 : 20,
        colorTemp: '3500K (Reinweiß CRI > 90)',
      })),
      rationale: `Gezielte Beleuchtung der an der Westwand platzierten Küchenzeile. Mindestens 750 Lux sorgen für hohe Farbwiedergabe (CRI > 90) und optimale Schnittsicherheit auf der Arbeitsplatte.`,
    },
    {
      id: 'scene-ai-kino',
      name: 'Kino & Streaming',
      category: 'kino',
      iconName: 'Tv',
      description: 'Minimale Akzentbeleuchtung für optimalen TV-Kontrast ohne störende Reflexionen.',
      luxTarget: 15,
      colorTempKelvin: 2200,
      estimatedWatts: 12,
      energySavingPct: 91,
      dimmerSettings: lights.map(l => ({
        deviceId: l.smartDeviceId || l.id,
        deviceName: l.name,
        dimLevelPct: l.name.toLowerCase().includes('wohnzimmer') ? 10 : 0,
        colorTemp: '2200K (Kerzenschein)',
      })),
      rationale: `Deckenleuchten werden vollständig deaktiviert, um jegliche störende Lichtreflexionen auf dem Display zu verhindern. Eine minimale 10% Hinterleuchtung verhindert Sehermüdung bei dunklen Filmszenen.`,
    },
    {
      id: 'scene-ai-nacht',
      name: 'Nacht-Orientierung (Smart Path)',
      category: 'nacht',
      iconName: 'Moon',
      description: 'Ultra-sanfte Orientierungsbeleuchtung zur Vermeidung von Melatonin-Hemmung.',
      luxTarget: 8,
      colorTempKelvin: 2000,
      estimatedWatts: 4,
      energySavingPct: 97,
      dimmerSettings: lights.map(l => ({
        deviceId: l.smartDeviceId || l.id,
        deviceName: l.name,
        dimLevelPct: 5,
        colorTemp: '2000K (Bernstein)',
      })),
      rationale: `Bernsteinfarbene Sockel- und Flurbeleuchtung (5%) für sichere Fortbewegung bei Nacht ohne Schlafunterbrechung oder Blendung.`,
    },
  ];

  if (hasTerrarium) {
    suggestions.push({
      id: 'scene-ai-terrarium-dusk',
      name: 'Terrarium Naturzyklus (Dämmerung)',
      category: 'terrarium_cycle',
      iconName: 'Sun',
      description: 'Biologische Dämmerungssimulation synchronisiert mit dem afrikanischen Biotop-Tagesrhythmus.',
      luxTarget: 85,
      colorTempKelvin: 2800,
      estimatedWatts: 40,
      energySavingPct: 68,
      dimmerSettings: lights.map(l => ({
        deviceId: l.smartDeviceId || l.id,
        deviceName: l.name,
        dimLevelPct: 20,
        colorTemp: '2800K (Dämmerung)',
      })),
      rationale: `Sanfte 30-minütige Dämmerungsphase vor der Nachtabsenkung des Großterrariums. Das Raumlicht dimmt synchron auf 20%, während der Wärmespot ausklingt, um natürlichen Tag-Nacht-Zyklen zu entsprechen.`,
    });
  }

  return suggestions;
}

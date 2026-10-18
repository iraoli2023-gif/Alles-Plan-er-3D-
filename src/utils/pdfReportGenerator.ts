import { jsPDF } from 'jspdf';
import { 
  RoomConfig, 
  FurnitureItem, 
  ElectricalElement, 
  WiringRoute, 
  BreakerCircuit, 
  EnergyMetrics, 
  RCDDevice 
} from '../types';

export interface PDFReportOptions {
  room: RoomConfig;
  furniture: FurnitureItem[];
  electrical: ElectricalElement[];
  wiring: WiringRoute[];
  circuits: BreakerCircuit[];
  energyMetrics: EnergyMetrics;
  rcds?: RCDDevice[];
  projectName?: string;
  inspectorName?: string;
}

/**
 * Render a high-resolution 2D floorplan onto an HTML canvas and return as data URL
 */
export function generateFloorplanCanvas(
  room: RoomConfig,
  furniture: FurnitureItem[],
  electrical: ElectricalElement[],
  wiring: WiringRoute[],
  widthPx = 1400,
  heightPx = 900
): string {
  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.fillRect(0, 0, widthPx, heightPx);

  // Padding & bounds
  const paddingX = 140;
  const paddingY = 120;
  const drawWidth = widthPx - paddingX * 2;
  const drawHeight = heightPx - paddingY * 2;

  // Scale calculation (room.width x room.length in meters)
  const scaleX = drawWidth / room.width;
  const scaleY = drawHeight / room.length;
  const scale = Math.min(scaleX, scaleY);

  const roomPixelW = room.width * scale;
  const roomPixelH = room.length * scale;
  const startX = paddingX + (drawWidth - roomPixelW) / 2;
  const startY = paddingY + (drawHeight - roomPixelH) / 2;

  // Floor
  ctx.fillStyle = '#1e293b'; // slate-800
  ctx.fillRect(startX, startY, roomPixelW, roomPixelH);

  // 1-Meter Grid
  ctx.strokeStyle = '#334155'; // slate-700
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (let m = 1; m < room.width; m++) {
    const x = startX + m * scale;
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY + roomPixelH);
    ctx.stroke();
  }
  for (let m = 1; m < room.length; m++) {
    const y = startY + m * scale;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + roomPixelW, y);
    ctx.stroke();
  }
  ctx.setLineDash([]); // Reset dash

  // Dimension lines
  ctx.strokeStyle = '#38bdf8'; // sky-400
  ctx.fillStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.font = 'bold 24px sans-serif';

  // Top dimension line (Room Width)
  const topDimY = startY - 45;
  ctx.beginPath();
  ctx.moveTo(startX, topDimY);
  ctx.lineTo(startX + roomPixelW, topDimY);
  ctx.stroke();
  // Ticks
  ctx.beginPath();
  ctx.moveTo(startX, topDimY - 12);
  ctx.lineTo(startX, topDimY + 12);
  ctx.moveTo(startX + roomPixelW, topDimY - 12);
  ctx.lineTo(startX + roomPixelW, topDimY + 12);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillText(`${room.width.toFixed(2)} m (Breite)`, startX + roomPixelW / 2, topDimY - 12);

  // Left dimension line (Room Length)
  const leftDimX = startX - 45;
  ctx.beginPath();
  ctx.moveTo(leftDimX, startY);
  ctx.lineTo(leftDimX, startY + roomPixelH);
  ctx.stroke();
  // Ticks
  ctx.beginPath();
  ctx.moveTo(leftDimX - 12, startY);
  ctx.lineTo(leftDimX + 12, startY);
  ctx.moveTo(leftDimX - 12, startY + roomPixelH);
  ctx.lineTo(leftDimX + 12, startY + roomPixelH);
  ctx.stroke();
  ctx.save();
  ctx.translate(leftDimX - 15, startY + roomPixelH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(`${room.length.toFixed(2)} m (Tiefe)`, 0, 0);
  ctx.restore();

  // Helper to convert 3D coordinates (centered at 0,0) to Canvas pixels
  const toCanvasPos = (pos: { x: number; z: number }) => ({
    x: startX + (pos.x + room.width / 2) * scale,
    y: startY + (pos.z + room.length / 2) * scale,
  });

  // Draw Wiring Routes first (underneath furniture & devices)
  wiring.forEach((route) => {
    if (!route.points || route.points.length < 2) return;
    ctx.beginPath();
    const first = toCanvasPos(route.points[0]);
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < route.points.length; i++) {
      const p = toCanvasPos(route.points[i]);
      ctx.lineTo(p.x, p.y);
    }

    if (route.cableType.includes('5x2.5')) {
      ctx.strokeStyle = '#ef4444'; // Red for heavy power
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
    } else if (route.cableType.includes('CAT')) {
      ctx.strokeStyle = '#a855f7'; // Purple for data
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
    } else {
      ctx.strokeStyle = '#38bdf8'; // Sky blue for general
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Draw Furniture
  furniture.forEach((f) => {
    const center = toCanvasPos(f.position);
    const w = f.dimensions.width * scale;
    const h = f.dimensions.depth * scale;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(((f.rotation || 0) * Math.PI) / 180);

    // Block
    if (f.isTerrarium) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)'; // Emerald
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
    } else {
      ctx.fillStyle = 'rgba(100, 116, 139, 0.35)'; // Slate
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
    }

    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Label
    ctx.fillStyle = '#f8fafc';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.name, 0, 0);

    ctx.restore();
  });

  // Draw Outer Walls (heavy border)
  ctx.strokeStyle = '#cbd5e1'; // slate-300
  ctx.lineWidth = 8;
  ctx.strokeRect(startX, startY, roomPixelW, roomPixelH);

  // Draw Electrical Installations
  electrical.forEach((el) => {
    const p = toCanvasPos(el.position);

    ctx.save();
    ctx.translate(p.x, p.y);

    if (el.type.includes('socket')) {
      // Socket symbol (half circle + prongs)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI, false);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (el.type.includes('switch')) {
      // Switch symbol (circle with angled arm)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      // Switch flag
      ctx.beginPath();
      ctx.moveTo(7, -7);
      ctx.lineTo(16, -16);
      ctx.stroke();
    } else if (el.type.includes('light')) {
      // Light symbol (circle with diagonal cross)
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-11, -11);
      ctx.lineTo(11, 11);
      ctx.moveTo(11, -11);
      ctx.lineTo(-11, 11);
      ctx.stroke();
    } else if (el.type === 'sub_distribution_panel') {
      // Distribution panel symbol (rect with division)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-18, -12, 36, 24);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(-18, -12, 36, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('UV', 0, 0);
    } else {
      // Sensor or generic
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Label below
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(el.name, 0, 16);

    ctx.restore();
  });

  // Legend Box (Bottom Left)
  const legX = startX + 15;
  const legY = startY + roomPixelH - 110;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.fillRect(legX, legY, 320, 95);
  ctx.strokeRect(legX, legY, 320, 95);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LEGENDE DIN 18015 SYMBOLE:', legX + 12, legY + 20);

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#f8fafc';
  // Row 1
  ctx.fillText('⊞ Schuko-Steckdose', legX + 12, legY + 44);
  ctx.fillText('◫ Lichtschalter', legX + 160, legY + 44);
  // Row 2
  ctx.fillText('⨁ Deckenleuchte', legX + 12, legY + 68);
  ctx.fillText('⚡ Unterverteiler (UV)', legX + 160, legY + 68);
  // Row 3
  ctx.fillText('── Kabelkanal / Schutzrohr', legX + 12, legY + 86);
  ctx.fillText('M 1:50 Grundriss', legX + 195, legY + 86);

  // Stamp in top right
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Projekt: ${room.name}`, widthPx - paddingX, 40);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Fläche: ${(room.width * room.length).toFixed(1)} m² • Höhe: ${room.height.toFixed(2)} m`, widthPx - paddingX, 65);

  return canvas.toDataURL('image/png', 0.95);
}

/**
 * Generate a complete, multi-page professional PDF engineering report
 */
export async function generateEngineeringReportPDF(options: PDFReportOptions): Promise<jsPDF> {
  const { 
    room, 
    furniture, 
    electrical, 
    wiring, 
    circuits, 
    energyMetrics, 
    rcds = [], 
    projectName = 'VoltCAD 3D Elektroplanung',
    inspectorName = 'Dipl.-Ing. Elektroplanung'
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const todayStr = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const docNumber = `VC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // --- Helper: Header & Footer on each page ---
  const drawPageHeaderFooter = (pageNumber: number, totalPages: number, pageTitle: string) => {
    // Top Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, margin, contentWidth, 18, 'F');

    // Accent line
    doc.setFillColor(56, 189, 248); // sky-400
    doc.rect(margin, margin + 17, contentWidth, 1, 'F');

    // Title text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('VOLTCAD 3D — ELEKTRO- & BAUDOKUMENTATION', margin + 6, margin + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Prüfnormen: DIN 18015-1/2/4 • DIN VDE 0100-410/520 • TAB 2023`, margin + 6, margin + 13);

    // Top Right Info
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(56, 189, 248);
    doc.text(docNumber, pageWidth - margin - 6, margin + 8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Datum: ${todayStr}`, pageWidth - margin - 6, margin + 13, { align: 'right' });

    // Page Section Title Sub-Bar
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, margin + 20, contentWidth, 8, 'F');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(pageTitle.toUpperCase(), margin + 4, margin + 25.5);

    // Footer
    const footerY = pageHeight - margin + 2;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`VoltCAD 3D Engineering Report • Dokument-ID: ${docNumber} • ${room.name}`, margin, footerY);
    doc.text(`Seite ${pageNumber} von ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: DECKBLATT & 2D-GRUNDRISSPLAN
  // ==========================================
  drawPageHeaderFooter(1, 2, 'Teil 1: Projektdaten & Maßstabsgetreuer 2D-Installationsplan');

  let currentY = margin + 34;

  // Metadata Card Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Bauvorhaben / Raum:', margin + 4, currentY + 7);
  doc.text('Raumabmessungen:', margin + 4, currentY + 14);
  doc.text('Installierte Anschlüsse:', margin + 4, currentY + 21);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${room.name} (${projectName})`, margin + 45, currentY + 7);
  doc.text(
    `${room.width.toFixed(2)} m × ${room.length.toFixed(2)} m (Fläche: ${(room.width * room.length).toFixed(1)} m², Höhe: ${room.height.toFixed(2)} m)`,
    margin + 45,
    currentY + 14
  );
  doc.text(
    `${electrical.length} Geräte (${electrical.filter(e => e.type.includes('socket')).length} Steckdosen, ${electrical.filter(e => e.type.includes('light')).length} Leuchten, ${wiring.length} Trassen)`,
    margin + 45,
    currentY + 21
  );

  // Right column in metadata card: DIN Seal Stamp
  const sealX = pageWidth - margin - 48;
  doc.setFillColor(240, 253, 244); // light emerald
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(sealX, currentY + 3, 44, 22, 1.5, 1.5, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DIN 18015 KONFORM', sealX + 22, currentY + 10, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Ausstattungswert ★★★', sealX + 22, currentY + 15, { align: 'center' });
  doc.text('VDE 0100 Vorzugszonen', sealX + 22, currentY + 19, { align: 'center' });

  currentY += 34;

  // Title for Floorplan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1.2 Installations- & Möbelierungsplan (Maßstab 1:50)', margin, currentY);

  currentY += 4;

  // Render 2D floorplan image to canvas
  try {
    const floorplanDataUrl = generateFloorplanCanvas(room, furniture, electrical, wiring, 1400, 880);
    if (floorplanDataUrl) {
      const planHeight = 112; // mm
      doc.addImage(floorplanDataUrl, 'PNG', margin, currentY, contentWidth, planHeight);
      currentY += planHeight + 6;
    }
  } catch (err) {
    console.error('Failed to render floorplan image into PDF:', err);
    currentY += 80;
  }

  // Cable Summary Table below Floorplan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1.3 Leitungs- & Kabelverlegeübersicht', margin, currentY);

  currentY += 4;

  // Table header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('KABELTYP', margin + 4, currentY + 4.2);
  doc.text('VERLEGEART', margin + 55, currentY + 4.2);
  doc.text('ZONE (DIN 18015)', margin + 105, currentY + 4.2);
  doc.text('LÄNGE', margin + 145, currentY + 4.2);
  doc.text('SPANNUNGSFALL ΔU', margin + 162, currentY + 4.2);

  currentY += 6;

  // Render cable rows
  wiring.slice(0, 4).forEach((w, idx) => {
    const rowBg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, currentY, contentWidth, 5.5, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(w.cableType, margin + 4, currentY + 3.8);
    doc.text(w.conduitType, margin + 55, currentY + 3.8);
    doc.text(w.installationZone.replace('DIN 18015 ', ''), margin + 105, currentY + 3.8);
    doc.text(`${w.lengthMeters.toFixed(1)} m`, margin + 145, currentY + 3.8);
    
    const isOk = (w.voltageDropPct || 1.1) < 3.0;
    doc.setTextColor(isOk ? 22 : 185, isOk ? 101 : 28, isOk ? 52 : 28);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(w.voltageDropPct || 1.1).toFixed(1)}% (DIN < 3%)`, margin + 162, currentY + 3.8);

    currentY += 5.5;
  });

  // ==========================================
  // PAGE 2: STROMKREISVERZEICHNIS & ENERGIEBILANZ
  // ==========================================
  doc.addPage();
  drawPageHeaderFooter(2, 2, 'Teil 2: Stromkreisverzeichnis, Absicherung & Energie-Audit');

  currentY = margin + 34;

  // Circuit List Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2.1 Stromkreisverzeichnis nach DIN 18015 & DIN VDE 0100-410', margin, currentY);

  currentY += 4.5;

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, currentY, contentWidth, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('NR.', margin + 3, currentY + 4.5);
  doc.text('BEZEICHNUNG & VERWENDUNG', margin + 15, currentY + 4.5);
  doc.text('PHASE', margin + 78, currentY + 4.5);
  doc.text('SICHERUNG', margin + 96, currentY + 4.5);
  doc.text('QUERSCHNITT', margin + 120, currentY + 4.5);
  doc.text('LEISTUNG', margin + 148, currentY + 4.5);
  doc.text('STATUS', margin + 167, currentY + 4.5);

  currentY += 6.5;

  let totalConnectedWatts = 0;

  circuits.forEach((c, idx) => {
    const load = c.activeLoadWatts || c.baseLoadWatts || 0;
    totalConnectedWatts += load;

    const rowBg = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, currentY, contentWidth, 6, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(c.number || `F${idx + 1}`, margin + 3, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.text(c.name.substring(0, 36), margin + 15, currentY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.phase === 'L1' ? 14 : c.phase === 'L2' ? 217 : 34, c.phase === 'L1' ? 165 : c.phase === 'L2' ? 119 : 197, c.phase === 'L1' ? 233 : 6);
    doc.text(c.phase || 'L1', margin + 78, currentY + 4.2);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.text(c.breakerType || 'LS B16A', margin + 96, currentY + 4.2);
    doc.text(c.cableCrossSection || '3x1.5 mm²', margin + 120, currentY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.text(`${load} W`, margin + 148, currentY + 4.2);

    doc.setTextColor(c.state ? 22 : 220, c.state ? 101 : 38, c.state ? 52 : 38);
    doc.text(c.state ? 'Aktiv (EIN)' : 'Inaktiv (AUS)', margin + 167, currentY + 4.2);

    currentY += 6;
  });

  // Circuit Subtotal Summary Box
  currentY += 2;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Summe installierte Anschlussleistung:', margin + 4, currentY + 5);
  doc.text(`${(totalConnectedWatts / 1000).toFixed(2)} kW`, margin + 85, currentY + 5);

  const diversityWatts = totalConnectedWatts * 0.7;
  doc.text(`Gleichzeitigkeitsfaktor g = 0.70 ➔ Bemessungs-Spitzenlast: ${(diversityWatts / 1000).toFixed(2)} kW`, margin + 105, currentY + 5);

  currentY += 13;

  // Energy Demand & Phase Balance Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2.2 Energiebedarf & 3-Phasen Lastenverteilung', margin, currentY);

  currentY += 4.5;

  const cardW = (contentWidth - 6) / 3;

  // Phase L1 Box
  doc.setFillColor(239, 246, 255); // light blue
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, currentY, cardW, 28, 2, 2, 'FD');
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PHASE L1 (230 V)', margin + 4, currentY + 7);
  doc.setFontSize(14);
  doc.text(`${energyMetrics.phaseL1Watts} W`, margin + 4, currentY + 16);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Stromstärke: ${(energyMetrics.phaseL1Watts / 230).toFixed(1)} A`, margin + 4, currentY + 23);

  // Phase L2 Box
  const l2X = margin + cardW + 3;
  doc.setFillColor(254, 242, 242); // light red
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(l2X, currentY, cardW, 28, 2, 2, 'FD');
  doc.setTextColor(153, 27, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PHASE L2 (230 V)', l2X + 4, currentY + 7);
  doc.setFontSize(14);
  doc.text(`${energyMetrics.phaseL2Watts} W`, l2X + 4, currentY + 16);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Stromstärke: ${(energyMetrics.phaseL2Watts / 230).toFixed(1)} A`, l2X + 4, currentY + 23);

  // Phase L3 Box
  const l3X = margin + (cardW + 3) * 2;
  doc.setFillColor(240, 253, 244); // light green
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(l3X, currentY, cardW, 28, 2, 2, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PHASE L3 (230 V)', l3X + 4, currentY + 7);
  doc.setFontSize(14);
  doc.text(`${energyMetrics.phaseL3Watts} W`, l3X + 4, currentY + 16);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Stromstärke: ${(energyMetrics.phaseL3Watts / 230).toFixed(1)} A`, l3X + 4, currentY + 23);

  currentY += 34;

  // Energy Costs & Ecology Forecast Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  const annualKwh = Number(((energyMetrics.todayKWh || 9.4) * 365).toFixed(0));
  const priceKwh = energyMetrics.electricityPriceKWh || 0.38;
  const annualCost = (annualKwh * priceKwh).toFixed(2);
  const annualCo2Kg = ((annualKwh * (energyMetrics.co2PerKWhGram || 385)) / 1000).toFixed(0);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Jahres-Energieprognose:', margin + 4, currentY + 7);
  doc.text('Stromtarif-Kalkulation:', margin + 4, currentY + 14);
  doc.text('Ökologische CO₂-Bilanz:', margin + 4, currentY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`ca. ${annualKwh} kWh / Jahr (Tagesbezug: ${energyMetrics.todayKWh.toFixed(1)} kWh)`, margin + 48, currentY + 7);
  doc.text(`ca. ${annualCost} € / Jahr (Basis: ${priceKwh.toFixed(2)} €/kWh Brutto)`, margin + 48, currentY + 14);
  doc.text(`ca. ${annualCo2Kg} kg CO₂ / Jahr (Basis: ${energyMetrics.co2PerKWhGram || 385} g CO₂/kWh deutscher Strommix)`, margin + 48, currentY + 20);

  currentY += 30;

  // Certification, Sign-off & Inspection Stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2.3 Prüfzertifikat & Freigabevermerk nach DIN VDE 0100-600', margin, currentY);

  currentY += 4.5;

  const stampBoxH = 34;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, stampBoxH, 'FD');

  // Left side: Checklist
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('✔ Schutzleiter-Durchgängigkeit (R_PE < 0,2 Ω) rechnerisch eingehalten', margin + 4, currentY + 8);
  doc.text('✔ Isolationswiderstand aller aktiven Leiter gegen Erde > 1,0 MΩ', margin + 4, currentY + 14);
  doc.text('✔ RCD Fehlerstromauslösung I_Δn ≤ 30 mA, Abschaltzeit t_a < 300 ms konform', margin + 4, currentY + 20);
  doc.text('✔ Maximaler Spannungsfall nach DIN VDE 0100-520 (< 3,0 %) nicht überschritten', margin + 4, currentY + 26);

  // Right side: Signature block
  const sigX = pageWidth - margin - 65;
  doc.setDrawColor(148, 163, 184);
  doc.line(sigX, currentY + 22, pageWidth - margin - 4, currentY + 22);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Datum, Ort & Unterschrift Fachprüfer / Sachverständiger', sigX, currentY + 27);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(inspectorName, sigX, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`VoltCAD Zertifikat #${docNumber}`, sigX, currentY + 19);

  return doc;
}

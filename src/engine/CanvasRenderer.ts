import type { CanvasViewport, CellGrid, ColorEntry } from "@/types";

export interface RenderOptions {
  viewport: CanvasViewport;
  cols: number;
  rows: number;
  cells: CellGrid;
  colorMap: Map<string, ColorEntry>;
  hoveredCell: { col: number; row: number } | null;
  showStitchMark: boolean;
  highlightEmpty?: boolean;
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private dpr: number;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
  }

  resize(cssWidth: number, cssHeight: number) {
    this.canvas.width = cssWidth * this.dpr;
    this.canvas.height = cssHeight * this.dpr;
    this.canvas.style.width = cssWidth + "px";
    this.canvas.style.height = cssHeight + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  screenToGrid(sx: number, sy: number, vp: CanvasViewport): { col: number; row: number } {
    const col = Math.floor((sx - vp.offsetX) / vp.scale);
    const row = Math.floor((sy - vp.offsetY) / vp.scale);
    return { col, row };
  }

  gridToScreen(col: number, row: number, vp: CanvasViewport): { x: number; y: number; size: number } {
    return {
      x: col * vp.scale + vp.offsetX,
      y: row * vp.scale + vp.offsetY,
      size: vp.scale,
    };
  }

  render(opts: RenderOptions) {
    const { viewport: vp, cols, rows, cells, colorMap, hoveredCell, showStitchMark } = opts;
    const ctx = this.ctx;
    const cssW = this.canvas.width / this.dpr;
    const cssH = this.canvas.height / this.dpr;

    ctx.clearRect(0, 0, cssW, cssH);
    this.drawLinenBackground(cssW, cssH);

    const gridLeft = vp.offsetX;
    const gridTop = vp.offsetY;
    const gridW = cols * vp.scale;
    const gridH = rows * vp.scale;

    ctx.save();
    ctx.beginPath();
    ctx.rect(gridLeft - 1, gridTop - 1, gridW + 2, gridH + 2);
    ctx.clip();

    const startCol = Math.max(0, Math.floor(-vp.offsetX / vp.scale));
    const endCol = Math.min(cols, Math.ceil((cssW - vp.offsetX) / vp.scale));
    const startRow = Math.max(0, Math.floor(-vp.offsetY / vp.scale));
    const endRow = Math.min(rows, Math.ceil((cssH - vp.offsetY) / vp.scale));

    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const cid = cells[r]?.[c];
        if (!cid) continue;
        const color = colorMap.get(cid);
        if (!color) continue;
        this.drawCell(c, r, vp, color.hexColor, showStitchMark);
      }
    }

    if (hoveredCell) {
      const { col, row } = hoveredCell;
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        const g = this.gridToScreen(col, row, vp);
        ctx.save();
        ctx.strokeStyle = "#C25B56";
        ctx.lineWidth = 2;
        ctx.strokeRect(g.x + 1, g.y + 1, g.size - 2, g.size - 2);
        ctx.restore();
      }
    }

    this.drawGridLines(vp, cols, rows, cssW, cssH);
    ctx.restore();

    this.drawGridBorder(gridLeft, gridTop, gridW, gridH);
  }

  private drawLinenBackground(w: number, h: number) {
    const ctx = this.ctx;
    ctx.fillStyle = "#FAF7F2";
    ctx.fillRect(0, 0, w, h);
  }

  private drawCell(col: number, row: number, vp: CanvasViewport, color: string, showMark: boolean) {
    const ctx = this.ctx;
    const g = this.gridToScreen(col, row, vp);

    if (vp.scale < 3) {
      ctx.fillStyle = color;
      ctx.fillRect(g.x, g.y, g.size, g.size);
      return;
    }

    const px = Math.max(1, Math.floor(vp.scale / 16));
    ctx.fillStyle = color;
    ctx.fillRect(g.x + px, g.y + px, g.size - px * 2, g.size - px * 2);

    if (showMark && vp.scale >= 10) {
      ctx.save();
      ctx.strokeStyle = this.darken(color, 0.25);
      ctx.lineWidth = Math.max(1, vp.scale / 20);
      ctx.lineCap = "round";
      ctx.beginPath();
      const pad = vp.scale / 4.5;
      ctx.moveTo(g.x + pad, g.y + pad);
      ctx.lineTo(g.x + g.size - pad, g.y + g.size - pad);
      ctx.moveTo(g.x + g.size - pad, g.y + pad);
      ctx.lineTo(g.x + pad, g.y + g.size - pad);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawGridLines(
    vp: CanvasViewport,
    cols: number,
    rows: number,
    _cssW: number,
    _cssH: number
  ) {
    const ctx = this.ctx;
    const thin = Math.max(0.5, vp.scale / 40);
    const thick = Math.max(1, vp.scale / 14);

    ctx.save();
    for (let c = 0; c <= cols; c++) {
      const x = c * vp.scale + vp.offsetX + 0.5;
      const is10 = c % 10 === 0;
      ctx.strokeStyle = is10 ? "rgba(139,111,71,0.55)" : "rgba(179,147,100,0.3)";
      ctx.lineWidth = is10 ? thick : thin;
      ctx.beginPath();
      ctx.moveTo(x, vp.offsetY);
      ctx.lineTo(x, rows * vp.scale + vp.offsetY);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      const y = r * vp.scale + vp.offsetY + 0.5;
      const is10 = r % 10 === 0;
      ctx.strokeStyle = is10 ? "rgba(139,111,71,0.55)" : "rgba(179,147,100,0.3)";
      ctx.lineWidth = is10 ? thick : thin;
      ctx.beginPath();
      ctx.moveTo(vp.offsetX, y);
      ctx.lineTo(cols * vp.scale + vp.offsetX, y);
      ctx.stroke();
    }
    if (cols % 2 === 0 && rows % 2 === 0) {
      ctx.strokeStyle = "rgba(194,91,86,0.6)";
      ctx.lineWidth = thick;
      const midX = (cols / 2) * vp.scale + vp.offsetX + 0.5;
      const midY = (rows / 2) * vp.scale + vp.offsetY + 0.5;
      ctx.beginPath();
      ctx.moveTo(midX, vp.offsetY);
      ctx.lineTo(midX, rows * vp.scale + vp.offsetY);
      ctx.moveTo(vp.offsetX, midY);
      ctx.lineTo(cols * vp.scale + vp.offsetX, midY);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawGridBorder(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "#8B6F47";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.shadowColor = "rgba(87,67,42,0.25)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.restore();
  }

  generateThumbnail(
    cells: CellGrid,
    cols: number,
    rows: number,
    colorMap: Map<string, ColorEntry>,
    size = 120
  ): string {
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const ctx = off.getContext("2d");
    if (!ctx) return "";

    ctx.fillStyle = "#FAF7F2";
    ctx.fillRect(0, 0, size, size);

    const maxSide = Math.max(cols, rows);
    const padding = size > 60 ? 8 : 4;
    let cellSize = Math.floor((size - padding * 2) / maxSide);
    cellSize = Math.max(1, cellSize);

    const totalW = cols * cellSize;
    const totalH = rows * cellSize;
    const ox = Math.floor((size - totalW) / 2);
    const oy = Math.floor((size - totalH) / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cid = cells[r]?.[c];
        if (cid) {
          const color = colorMap.get(cid);
          if (color) {
            ctx.fillStyle = color.hexColor;
            ctx.fillRect(ox + c * cellSize, oy + r * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    if (cellSize >= 3) {
      ctx.strokeStyle = "rgba(179,147,100,0.2)";
      ctx.lineWidth = 1;
      const every = Math.max(1, Math.round(10 / cellSize));
      for (let c = 0; c <= cols; c += every * 5) {
        const x = ox + c * cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, oy);
        ctx.lineTo(x, oy + totalH);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r += every * 5) {
        const y = oy + r * cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(ox, y);
        ctx.lineTo(ox + totalW, y);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "rgba(139,111,71,0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, oy + 0.5, totalW, totalH);

    return off.toDataURL("image/png");
  }

  private darken(hex: string, amount: number): string {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const dr = Math.max(0, Math.floor(r * (1 - amount)));
    const dg = Math.max(0, Math.floor(g * (1 - amount)));
    const db = Math.max(0, Math.floor(b * (1 - amount)));
    return `rgb(${dr},${dg},${db})`;
  }
}

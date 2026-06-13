import { create } from "zustand";
import type { CellGrid, ToolMode, UndoSnapshot, CanvasViewport } from "@/types";

interface CanvasState {
  cols: number;
  rows: number;
  mmPerCell: number;
  cells: CellGrid;
  tool: ToolMode;
  showStitchMark: boolean;
  viewport: CanvasViewport;
  hoveredCell: { col: number; row: number } | null;
  undos: UndoSnapshot[];
  redos: UndoSnapshot[];
  currentSchemeId: number | null;
  currentSchemeName: string;

  setTool: (tool: ToolMode) => void;
  setGridSize: (cols: number, rows: number) => void;
  setMmPerCell: (mm: number) => void;
  setViewport: (vp: Partial<CanvasViewport>) => void;
  setHoveredCell: (cell: { col: number; row: number } | null) => void;
  setShowStitchMark: (show: boolean) => void;
  setSchemeMeta: (id: number | null, name: string) => void;

  paintCell: (col: number, row: number, colorId: string | null) => boolean;
  paintCells: (changes: { col: number; row: number; colorId: string | null }[]) => boolean;
  fillArea: (startCol: number, startRow: number, colorId: string | null) => boolean;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  loadCells: (cells: CellGrid, cols: number, rows: number, mmPerCell: number) => void;
  fitViewport: (canvasW: number, canvasH: number, padding?: number) => void;
}

function createEmptyGrid(cols: number, rows: number): CellGrid {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

function snapshot(cells: CellGrid, cols: number, rows: number): UndoSnapshot {
  return {
    cols,
    rows,
    cells: cells.map((row) => row.slice()),
  };
}

const INITIAL_COLS = 40;
const INITIAL_ROWS = 40;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  cols: INITIAL_COLS,
  rows: INITIAL_ROWS,
  mmPerCell: 1.81,
  cells: createEmptyGrid(INITIAL_COLS, INITIAL_ROWS),
  tool: "brush",
  showStitchMark: true,
  viewport: { scale: 12, offsetX: 40, offsetY: 40 },
  hoveredCell: null,
  undos: [],
  redos: [],
  currentSchemeId: null,
  currentSchemeName: "未命名方案",

  setTool: (tool) => set({ tool }),
  setGridSize(cols, rows) {
    const prev = get();
    const newCells = createEmptyGrid(cols, rows);
    const minR = Math.min(rows, prev.rows);
    const minC = Math.min(cols, prev.cols);
    for (let r = 0; r < minR; r++) {
      for (let c = 0; c < minC; c++) {
        newCells[r][c] = prev.cells[r][c];
      }
    }
    set({ cols, rows, cells: newCells });
  },
  setMmPerCell: (mm) => set({ mmPerCell: Math.max(0.1, Math.min(10, mm)) }),
  setViewport: (vp) =>
    set((s) => ({ viewport: { ...s.viewport, ...vp } })),
  setHoveredCell: (cell) => set({ hoveredCell: cell }),
  setShowStitchMark: (show) => set({ showStitchMark: show }),
  setSchemeMeta: (id, name) => set({ currentSchemeId: id, currentSchemeName: name }),

  paintCell(col, row, colorId) {
    const s = get();
    if (col < 0 || col >= s.cols || row < 0 || row >= s.rows) return false;
    if (s.cells[row][col] === colorId) return false;
    const newCells = s.cells.map((r, ri) =>
      ri === row ? r.map((c, ci) => (ci === col ? colorId : c)) : r
    );
    set({ cells: newCells });
    return true;
  },

  paintCells(changes) {
    const s = get();
    let changed = false;
    const newCells = s.cells.map((r) => r.slice());
    for (const { col, row, colorId } of changes) {
      if (col < 0 || col >= s.cols || row < 0 || row >= s.rows) continue;
      if (newCells[row][col] === colorId) continue;
      newCells[row][col] = colorId;
      changed = true;
    }
    if (changed) set({ cells: newCells });
    return changed;
  },

  fillArea(startCol, startRow, colorId) {
    const s = get();
    const { cols, rows, cells } = s;
    if (startCol < 0 || startCol >= cols || startRow < 0 || startRow >= rows) return false;

    const targetColor = cells[startRow][startCol];
    if (targetColor === colorId) return false;

    const total = cols * rows;
    const visited = new Uint8Array(total);
    const newCells = cells.map((r) => r.slice());
    const queue: number[] = [startRow * cols + startCol];
    let changed = false;

    while (queue.length > 0) {
      const idx = queue.pop()!;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const r = (idx / cols) | 0;
      const c = idx - r * cols;

      if (newCells[r][c] !== targetColor) continue;
      newCells[r][c] = colorId;
      changed = true;

      if (r > 0) {
        const up = idx - cols;
        if (!visited[up]) queue.push(up);
      }
      if (r < rows - 1) {
        const down = idx + cols;
        if (!visited[down]) queue.push(down);
      }
      if (c > 0) {
        const left = idx - 1;
        if (!visited[left]) queue.push(left);
      }
      if (c < cols - 1) {
        const right = idx + 1;
        if (!visited[right]) queue.push(right);
      }
    }

    if (changed) set({ cells: newCells });
    return changed;
  },

  pushUndo() {
    const s = get();
    const snap = snapshot(s.cells, s.cols, s.rows);
    set({
      undos: [...s.undos, snap].slice(-100),
      redos: [],
    });
  },

  undo() {
    const s = get();
    if (s.undos.length === 0) return;
    const prevSnap = s.undos[s.undos.length - 1];
    const currentSnap = snapshot(s.cells, s.cols, s.rows);
    set({
      undos: s.undos.slice(0, -1),
      redos: [...s.redos, currentSnap],
      cells: prevSnap.cells,
      cols: prevSnap.cols,
      rows: prevSnap.rows,
    });
  },

  redo() {
    const s = get();
    if (s.redos.length === 0) return;
    const nextSnap = s.redos[s.redos.length - 1];
    const currentSnap = snapshot(s.cells, s.cols, s.rows);
    set({
      redos: s.redos.slice(0, -1),
      undos: [...s.undos, currentSnap],
      cells: nextSnap.cells,
      cols: nextSnap.cols,
      rows: nextSnap.rows,
    });
  },

  clearAll() {
    const s = get();
    s.pushUndo();
    set({ cells: createEmptyGrid(s.cols, s.rows) });
  },

  loadCells(cells, cols, rows, mmPerCell) {
    const grid: CellGrid = createEmptyGrid(cols, rows);
    const minR = Math.min(rows, cells.length);
    for (let r = 0; r < minR; r++) {
      const minC = Math.min(cols, cells[r].length);
      for (let c = 0; c < minC; c++) {
        grid[r][c] = cells[r][c];
      }
    }
    set({
      cells: grid,
      cols,
      rows,
      mmPerCell,
      undos: [],
      redos: [],
    });
  },

  fitViewport(canvasW, canvasH, padding = 40) {
    const s = get();
    const gridW = s.cols;
    const gridH = s.rows;
    const scaleX = (canvasW - padding * 2) / gridW;
    const scaleY = (canvasH - padding * 2) / gridH;
    const scale = Math.max(4, Math.min(scaleX, scaleY));
    const offsetX = (canvasW - gridW * scale) / 2;
    const offsetY = (canvasH - gridH * scale) / 2;
    set({ viewport: { scale, offsetX, offsetY } });
  },
}));

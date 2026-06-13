export interface ColorEntry {
  id: string;
  brand: string;
  code: string;
  hexColor: string;
  inStock: boolean;
  note?: string;
}

export type CellValue = string | null;

export type CellGrid = CellValue[][];

export interface UndoSnapshot {
  cells: CellGrid;
  cols: number;
  rows: number;
}

export type ToolMode = "brush" | "eraser" | "picker";

export interface CanvasViewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface Scheme {
  id?: number;
  name: string;
  thumbnail: string;
  createdAt: number;
  updatedAt: number;
  gridCols: number;
  gridRows: number;
  mmPerCell: number;
  cells: string;
  colors?: ColorEntry[];
}

export interface CtReference {
  label: string;
  ct: number;
  mm: number;
}

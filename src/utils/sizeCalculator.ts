import type { CtReference } from "@/types";

export const CT_REFERENCES: CtReference[] = [
  { label: "9CT 粗布", ct: 9, mm: 2.82 },
  { label: "11CT 中布", ct: 11, mm: 2.31 },
  { label: "14CT 小布", ct: 14, mm: 1.81 },
  { label: "16CT 细布", ct: 16, mm: 1.59 },
  { label: "18CT 超细", ct: 18, mm: 1.41 },
  { label: "22CT 特细", ct: 22, mm: 1.13 },
  { label: "28CT 高密", ct: 28, mm: 0.91 },
  { label: "32CT 极细", ct: 32, mm: 0.79 },
];

export const COMMON_BRANDS = [
  "DMC",
  "Anchor",
  "Cosmo",
  "Olympus",
  "Mouline",
  "花彩",
  "其他",
];

export interface SizeResult {
  widthMm: number;
  heightMm: number;
  widthCm: number;
  heightCm: number;
  widthInch: number;
  heightInch: number;
}

export function calculateSize(
  cols: number,
  rows: number,
  mmPerCell: number
): SizeResult {
  const widthMm = cols * mmPerCell;
  const heightMm = rows * mmPerCell;
  return {
    widthMm,
    heightMm,
    widthCm: widthMm / 10,
    heightCm: heightMm / 10,
    widthInch: widthMm / 25.4,
    heightInch: heightMm / 25.4,
  };
}

export function mmToCt(mm: number): CtReference | null {
  let closest: CtReference | null = null;
  let minDiff = Infinity;
  for (const ref of CT_REFERENCES) {
    const diff = Math.abs(ref.mm - mm);
    if (diff < minDiff) {
      minDiff = diff;
      closest = ref;
    }
  }
  return closest;
}

export function formatNumber(n: number, digits = 2): string {
  return Number(n.toFixed(digits)).toString();
}

export function generateId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

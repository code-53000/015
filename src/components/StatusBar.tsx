import { useCanvasStore } from "@/store/canvasStore";
import { calculateSize, formatNumber } from "@/utils/sizeCalculator";
import { Crosshair, Grid3X3, Ruler, Maximize2 } from "lucide-react";

export default function StatusBar() {
  const cols = useCanvasStore((s) => s.cols);
  const rows = useCanvasStore((s) => s.rows);
  const mmPerCell = useCanvasStore((s) => s.mmPerCell);
  const hovered = useCanvasStore((s) => s.hoveredCell);
  const scale = useCanvasStore((s) => s.viewport.scale);

  const size = calculateSize(cols, rows, mmPerCell);

  return (
    <footer className="h-8 flex items-center gap-4 px-4 paper-card border-t border-linen-300 text-[11px] text-sienna-600 shrink-0">
      <div className="flex items-center gap-1.5">
        <Crosshair className="w-3 h-3" />
        <span className="tabular-nums">
          {hovered
            ? `(${hovered.col + 1}, ${hovered.row + 1})`
            : "(-, -)"}
        </span>
      </div>
      <div className="w-px h-3 bg-linen-300" />
      <div className="flex items-center gap-1.5">
        <Grid3X3 className="w-3 h-3" />
        <span className="tabular-nums">
          {cols} × {rows} 格
        </span>
      </div>
      <div className="w-px h-3 bg-linen-300" />
      <div className="flex items-center gap-1.5">
        <Ruler className="w-3 h-3" />
        <span className="tabular-nums">
          {formatNumber(size.widthCm)} × {formatNumber(size.heightCm)} cm
          <span className="text-sienna-400 ml-1">
            ({mmPerCell}mm/格)
          </span>
        </span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Maximize2 className="w-3 h-3" />
        <span className="tabular-nums font-medium">
          {Math.round(scale * 10)}%
        </span>
      </div>
      <div className="text-sienna-400">
        <kbd className="px-1 py-0.5 text-[9px] bg-linen-200 rounded border border-linen-300 font-sans">
          Space
        </kbd>
        <span className="mx-1">平移</span>
        <kbd className="px-1 py-0.5 text-[9px] bg-linen-200 rounded border border-linen-300 font-sans">
          B/E/I
        </kbd>
        <span className="mx-1">笔/橡/吸</span>
      </div>
    </footer>
  );
}

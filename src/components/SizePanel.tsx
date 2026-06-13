import { useMemo } from "react";
import { Ruler, Grid2X2, Layers } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { useColorStore } from "@/store/colorStore";
import {
  calculateSize,
  CT_REFERENCES,
  mmToCt,
  formatNumber,
} from "@/utils/sizeCalculator";

export default function SizePanel() {
  const cols = useCanvasStore((s) => s.cols);
  const rows = useCanvasStore((s) => s.rows);
  const mmPerCell = useCanvasStore((s) => s.mmPerCell);
  const setMmPerCell = useCanvasStore((s) => s.setMmPerCell);
  const cells = useCanvasStore((s) => s.cells);
  const colors = useColorStore((s) => s.colors);

  const size = useMemo(
    () => calculateSize(cols, rows, mmPerCell),
    [cols, rows, mmPerCell]
  );
  const matchedCt = useMemo(() => mmToCt(mmPerCell), [mmPerCell]);

  const stats = useMemo(() => {
    const usage = new Map<string, number>();
    let filled = 0;
    for (let r = 0; r < cells.length; r++) {
      for (let c = 0; c < cells[r].length; c++) {
        const v = cells[r][c];
        if (v) {
          filled++;
          usage.set(v, (usage.get(v) ?? 0) + 1);
        }
      }
    }
    return {
      total: cols * rows,
      filled,
      empty: cols * rows - filled,
      uniqueColors: usage.size,
      usage,
    };
  }, [cells, cols, rows]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b border-linen-200 space-y-3">
        <div>
          <label className="flex items-center gap-1.5 text-[11px] text-sienna-500 mb-1.5">
            <Ruler className="w-3 h-3" />
            每格尺寸 (毫米)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.1"
              max="10"
              value={mmPerCell}
              onChange={(e) => setMmPerCell(parseFloat(e.target.value) || 1)}
              className="stitch-input !py-1.5 flex-1 tabular-nums"
            />
            <span className="text-xs text-sienna-500 w-6">mm</span>
          </div>
          {matchedCt && (
            <div className="mt-1.5 text-[10px] text-sienna-500">
              接近布料规格：
              <span className="font-semibold text-stitch-500 ml-1">
                {matchedCt.label}（{matchedCt.mm}mm）
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-[11px] text-sienna-500 mb-1.5">
            <Layers className="w-3 h-3" />
            快速选择布料 CT 数
          </label>
          <div className="grid grid-cols-4 gap-1">
            {CT_REFERENCES.map((ct) => (
              <button
                key={ct.ct}
                onClick={() => setMmPerCell(ct.mm)}
                className={`px-1.5 py-1 rounded-md text-[10px] border transition-all ${
                  Math.abs(ct.mm - mmPerCell) < 0.01
                    ? "bg-stitch-50 border-stitch-300 text-stitch-600 font-semibold"
                    : "bg-white/60 border-linen-300 text-sienna-600 hover:bg-linen-100"
                }`}
              >
                <div className="font-medium">{ct.ct}CT</div>
                <div className="text-[9px] text-sienna-400 tabular-nums">
                  {ct.mm}mm
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-linen-200">
        <div className="flex items-center gap-1.5 text-[11px] text-sienna-500 mb-2">
          <Grid2X2 className="w-3 h-3" />
          成品尺寸估算
        </div>
        <div className="paper-card p-3 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-sienna-500">宽 (水平)</span>
            <span className="text-right">
              <span className="font-serif font-bold text-sienna-700 text-lg tabular-nums">
                {formatNumber(size.widthCm)}
              </span>
              <span className="text-xs text-sienna-500 ml-0.5">cm</span>
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-sienna-500">高 (垂直)</span>
            <span className="text-right">
              <span className="font-serif font-bold text-sienna-700 text-lg tabular-nums">
                {formatNumber(size.heightCm)}
              </span>
              <span className="text-xs text-sienna-500 ml-0.5">cm</span>
            </span>
          </div>
          <div className="h-px bg-linen-200 my-1.5" />
          <div className="grid grid-cols-2 gap-2 text-[10px] text-sienna-500">
            <div className="flex justify-between">
              <span>毫米</span>
              <span className="tabular-nums">
                {formatNumber(size.widthMm)}×{formatNumber(size.heightMm)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>英寸</span>
              <span className="tabular-nums">
                {formatNumber(size.widthInch)}×{formatNumber(size.heightInch)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="总格子" value={stats.total} />
          <StatCard label="已填色" value={stats.filled} accent />
          <StatCard label="空白" value={stats.empty} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-sienna-500">用色量统计</span>
            <span className="text-[10px] text-sienna-400">
              {stats.uniqueColors} 种颜色
            </span>
          </div>
          {stats.uniqueColors === 0 ? (
            <div className="text-center text-sienna-400 text-xs py-4 paper-card">
              尚未填色
            </div>
          ) : (
            <div className="space-y-1.5">
              {[...stats.usage.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([colorId, count]) => {
                  const color = colors.find((c) => c.id === colorId);
                  if (!color) return null;
                  const pct = (count / stats.filled) * 100;
                  return (
                    <div key={colorId} className="group">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div
                          className="w-4 h-4 rounded shrink-0 shadow-stitch-in border border-linen-300"
                          style={{ backgroundColor: color.hexColor }}
                        />
                        <span className="text-[10px] font-medium text-sienna-700 truncate flex-1">
                          {color.brand} {color.code}
                        </span>
                        <span className="text-[10px] text-sienna-500 tabular-nums shrink-0">
                          {count} 格
                        </span>
                      </div>
                      <div className="h-1.5 bg-linen-200 rounded-full overflow-hidden ml-6">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color.hexColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2 text-center ${
        accent
          ? "bg-stitch-50 border-stitch-200"
          : "bg-white/60 border-linen-300"
      }`}
    >
      <div
        className={`font-serif font-bold text-lg tabular-nums ${
          accent ? "text-stitch-500" : "text-sienna-700"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] text-sienna-500">{label}</div>
    </div>
  );
}

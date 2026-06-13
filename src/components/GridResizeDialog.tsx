import { useState } from "react";
import { X, Grid2X2 } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";

interface Props {
  open: boolean;
  onClose: (confirmed: boolean) => void;
}

export default function GridResizeDialog({ open, onClose }: Props) {
  const storeCols = useCanvasStore((s) => s.cols);
  const storeRows = useCanvasStore((s) => s.rows);
  const setGridSize = useCanvasStore((s) => s.setGridSize);
  const pushUndo = useCanvasStore((s) => s.pushUndo);

  const [cols, setCols] = useState(storeCols);
  const [rows, setRows] = useState(storeRows);

  if (!open) return null;

  const submit = () => {
    const c = Math.max(1, Math.min(400, Math.floor(cols)));
    const r = Math.max(1, Math.min(400, Math.floor(rows)));
    pushUndo();
    setGridSize(c, r);
    onClose(true);
  };

  const presets = [
    { w: 30, h: 30, label: "小" },
    { w: 60, h: 60, label: "中" },
    { w: 100, h: 80, label: "大" },
    { w: 150, h: 120, label: "特大" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sienna-700/40 backdrop-blur-sm">
      <div className="paper-card w-full max-w-md p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-sienna-100 border border-sienna-200 flex items-center justify-center">
              <Grid2X2 className="w-5 h-5 text-sienna-600" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-sienna-700 text-lg">
                调整网格尺寸
              </h2>
              <p className="text-[11px] text-sienna-500">
                放大时保留原有内容，缩小时超出部分会被裁掉
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="text-sienna-500 hover:text-sienna-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-sienna-500 mb-1">
                列数 (横向格子)
              </label>
              <input
                type="number"
                min="1"
                max="400"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                className="stitch-input"
              />
            </div>
            <div>
              <label className="block text-[11px] text-sienna-500 mb-1">
                行数 (纵向格子)
              </label>
              <input
                type="number"
                min="1"
                max="400"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                className="stitch-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-sienna-500 mb-1.5">
              快速选择
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setCols(p.w);
                    setRows(p.h);
                  }}
                  className={`p-2 rounded-lg border text-xs transition-all ${
                    cols === p.w && rows === p.h
                      ? "bg-stitch-50 border-stitch-300 text-stitch-600"
                      : "bg-white/60 border-linen-300 text-sienna-600 hover:bg-linen-100"
                  }`}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-[10px] text-sienna-400 tabular-nums">
                    {p.w}×{p.h}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-sienna-500 paper-card p-2.5">
            <div className="flex items-center justify-between">
              <span>当前设置</span>
              <span className="font-semibold tabular-nums text-sienna-700">
                {cols} × {rows} 格 = {cols * rows} 个格子
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={() => onClose(false)} className="stitch-btn flex-1 !py-2">
            取消
          </button>
          <button onClick={submit} className="stitch-btn-primary flex-1 !py-2">
            确认调整
          </button>
        </div>
      </div>
    </div>
  );
}

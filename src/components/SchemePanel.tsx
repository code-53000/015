import { useEffect, useState } from "react";
import {
  FolderPlus,
  FolderOpen,
  Trash2,
  Edit3,
  X,
  Check,
  Loader2,
  FilePlus2,
  Search,
} from "lucide-react";
import { useSchemeStore } from "@/store/schemeStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useColorStore } from "@/store/colorStore";
import type { CellGrid, Scheme } from "@/types";

interface Props {
  onNewBlank: () => void;
}

export default function SchemePanel({ onNewBlank }: Props) {
  const schemes = useSchemeStore((s) => s.schemes);
  const loading = useSchemeStore((s) => s.loading);
  const fetchAll = useSchemeStore((s) => s.fetchAll);
  const loadScheme = useSchemeStore((s) => s.loadScheme);
  const removeScheme = useSchemeStore((s) => s.removeScheme);
  const renameScheme = useSchemeStore((s) => s.renameScheme);
  const saving = useSchemeStore((s) => s.saving);

  const loadCells = useCanvasStore((s) => s.loadCells);
  const setSchemeMeta = useCanvasStore((s) => s.setSchemeMeta);
  const setColor = useColorStore((s) => s.setSelected);

  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameText, setRenameText] = useState("");

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = schemes.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLoad = async (scheme: Scheme) => {
    const data = await loadScheme(scheme.id!);
    if (!data) return;
    try {
      const cells: CellGrid = JSON.parse(data.cells);
      loadCells(cells, data.gridCols, data.gridRows, data.mmPerCell);
      setSchemeMeta(data.id!, data.name);
      if (data.colors && data.colors.length > 0) {
        setColor(data.colors[0]?.id ?? null);
      }
    } catch (e) {
      console.error("加载方案失败", e);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`确定删除方案「${name}」？此操作无法撤销。`)) {
      await removeScheme(id);
    }
  };

  const handleRename = (s: Scheme) => {
    setRenameId(s.id!);
    setRenameText(s.name);
  };

  const submitRename = async () => {
    if (renameId && renameText.trim()) {
      await renameScheme(renameId, renameText.trim());
    }
    setRenameId(null);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60_000) return "刚刚";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-linen-200 space-y-2">
        <button
          onClick={onNewBlank}
          className="w-full stitch-btn-primary flex items-center justify-center gap-1.5 !py-2"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>新建空白方案</span>
        </button>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sienna-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索方案名称"
            className="stitch-input !py-1.5 !pl-7"
          />
        </div>
        <div className="text-[10px] text-sienna-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <FolderOpen className="w-3 h-3" />
            共 {schemes.length} 个方案
          </span>
          {saving && (
            <span className="flex items-center gap-1 text-stitch-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              保存中...
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {loading && schemes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sienna-400 text-sm">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span>加载方案中...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sienna-400 text-sm">
            <FolderPlus className="w-10 h-10 mb-2 opacity-40" />
            <span>{search ? "没有匹配的方案" : "暂无保存的方案"}</span>
            {!search && (
              <span className="text-[11px] mt-1 opacity-70">
                点击右上角「保存方案」开始
              </span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="group paper-card p-2 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                onClick={() => handleLoad(s)}
              >
                <div className="aspect-square rounded-md bg-linen-100 border border-linen-300 overflow-hidden mb-1.5 relative">
                  {s.thumbnail ? (
                    <img
                      src={s.thumbnail}
                      alt={s.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sienna-300 text-xs">
                      无预览
                    </div>
                  )}
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(s);
                      }}
                      className="w-5 h-5 rounded bg-white/90 border border-linen-300 flex items-center justify-center text-sienna-500 hover:bg-linen-100"
                      title="重命名"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id!, s.name);
                      }}
                      className="w-5 h-5 rounded bg-white/90 border border-linen-300 flex items-center justify-center text-stitch-500 hover:bg-stitch-50"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {renameId === s.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={renameText}
                      onChange={(e) => setRenameText(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitRename();
                        if (e.key === "Escape") setRenameId(null);
                      }}
                      className="stitch-input !py-0.5 !px-1.5 text-xs flex-1"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        submitRename();
                      }}
                      className="w-5 h-5 rounded bg-stitch-400 text-white flex items-center justify-center"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameId(null);
                      }}
                      className="w-5 h-5 rounded bg-linen-200 text-sienna-500 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-sienna-700 truncate">
                      {s.name}
                    </div>
                    <div className="flex items-center justify-between mt-0.5 text-[10px] text-sienna-400">
                      <span className="tabular-nums">
                        {s.gridCols}×{s.gridRows}
                      </span>
                      <span>{formatTime(s.updatedAt)}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

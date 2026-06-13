import { useState } from "react";
import { Plus, Edit3, Trash2, Check, X, Package, PackageOpen } from "lucide-react";
import { useColorStore } from "@/store/colorStore";
import { COMMON_BRANDS } from "@/utils/sizeCalculator";
import clsx from "clsx";
import type { ColorEntry } from "@/types";

export default function ColorPalettePanel() {
  const colors = useColorStore((s) => s.colors);
  const selectedId = useColorStore((s) => s.selectedColorId);
  const setSelected = useColorStore((s) => s.setSelected);
  const addColor = useColorStore((s) => s.addColor);
  const updateColor = useColorStore((s) => s.updateColor);
  const removeColor = useColorStore((s) => s.removeColor);
  const toggleStock = useColorStore((s) => s.toggleStock);
  const initialized = useColorStore((s) => s.initialized);

  const [filter, setFilter] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<ColorEntry | null>(null);
  const [form, setForm] = useState({
    brand: "DMC",
    code: "",
    hexColor: "#C25B56",
    inStock: true,
    note: "",
  });

  const filtered = colors.filter((c) => {
    if (!filter.trim()) return colors;
    const f = filter.toLowerCase();
    return (
      c.brand.toLowerCase().includes(f) ||
      c.code.toLowerCase().includes(f) ||
      c.note?.toLowerCase().includes(f)
    );
  });

  const openEditor = (c?: ColorEntry) => {
    if (c) {
      setEditing(c);
      setForm({
        brand: c.brand,
        code: c.code,
        hexColor: c.hexColor,
        inStock: c.inStock,
        note: c.note ?? "",
      });
    } else {
      setEditing(null);
      setForm({
        brand: "DMC",
        code: "",
        hexColor: "#C25B56",
        inStock: true,
        note: "",
      });
    }
    setShowEditor(true);
  };

  const submitForm = async () => {
    if (!form.code.trim()) return;
    if (editing) {
      await updateColor(editing.id, form);
    } else {
      await addColor(form);
    }
    setShowEditor(false);
  };

  const handleRemove = async (c: ColorEntry) => {
    if (confirm(`确定删除色号 ${c.brand} ${c.code}?`)) {
      await removeColor(c.id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-linen-200">
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="搜索品牌/色号/备注"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="stitch-input !py-1.5 !pl-7"
            />
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sienna-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="M20 20L16 16" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <button
            onClick={() => openEditor()}
            className="stitch-btn-primary !px-2 !py-0 flex items-center"
            title="添加色号"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-sienna-500">
          <span className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          共 {colors.length} 种
          </span>
          <span>
            已存库 {colors.filter((c) => c.inStock).length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {!initialized ? (
          <div className="text-center text-sienna-400 text-sm py-8">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-sienna-400 text-sm py-8">无匹配色号</div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(c.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") setSelected(c.id); }}
                className={clsx(
                  "group w-full flex items-center gap-2 p-2 rounded-lg border transition-all text-left cursor-pointer",
                  selectedId === c.id
                    ? "bg-stitch-50 border-stitch-300 shadow-sm"
                    : "bg-white/60 border-linen-300 hover:bg-white hover:border-sienna-300"
                )}
              >
                <div
                  className="relative w-9 h-9 rounded-md shrink-0 shadow-stitch-in border border-linen-300"
                  style={{ backgroundColor: c.hexColor }}
                >
                  {selectedId === c.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check
                        className={clsx(
                          "w-4 h-4",
                          isLightColor(c.hexColor) ? "text-sienna-700" : "text-white"
                        )}
                        strokeWidth={3}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-sienna-700">
                      {c.brand}
                    </span>
                    <span className="text-xs font-mono text-sienna-600">{c.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {c.inStock ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-sienna-500">
                        <PackageOpen className="w-2.5 h-2.5 text-sienna-400" />
                        有库存
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-stitch-400">
                        <Package className="w-2.5 h-2.5" />
                        缺货
                      </span>
                    )}
                    {c.note && (
                      <span className="text-[10px] text-sienna-400 truncate">
                        · {c.note}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStock(c.id);
                    }}
                    className="w-6 h-6 rounded flex items-center justify-center text-sienna-500 hover:bg-linen-200"
                    title={c.inStock ? "标为缺货" : "标为有库存"}
                  >
                    {c.inStock ? (
                      <PackageOpen className="w-3.5 h-3.5" />
                    ) : (
                      <Package className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditor(c);
                    }}
                    className="w-6 h-6 rounded flex items-center justify-center text-sienna-500 hover:bg-linen-200"
                    title="编辑"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(c);
                    }}
                    className="w-6 h-6 rounded flex items-center justify-center text-stitch-500 hover:bg-stitch-50"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <div className="absolute inset-0 bg-sienna-700/40 backdrop-blur-sm z-10 flex items-start justify-center p-4">
          <div className="w-full paper-card p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-sienna-700">
                {editing ? "编辑色号" : "新增色号"}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-sienna-500 hover:text-sienna-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-sienna-500 mb-1">品牌</label>
                  <select
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="stitch-input !py-1.5"
                  >
                    {COMMON_BRANDS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-sienna-500 mb-1">色号</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="如 666"
                    className="stitch-input !py-1.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-sienna-500 mb-1">颜色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.hexColor}
                      onChange={(e) => setForm({ ...form, hexColor: e.target.value })}
                      className="w-9 h-9 rounded-md border border-linen-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.hexColor}
                      onChange={(e) => setForm({ ...form, hexColor: e.target.value })}
                      className="stitch-input !py-1.5 font-mono uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-sienna-500 mb-1">库存</label>
                  <label className="flex items-center gap-2 mt-1.5 text-xs text-sienna-600">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                      className="w-4 h-4 rounded border-linen-300 text-stitch-500 focus:ring-stitch-400"
                    />
                    有库存
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-sienna-500 mb-1">备注</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="如：圣诞红、枯叶色"
                  className="stitch-input !py-1.5"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowEditor(false)}
                  className="stitch-btn flex-1"
                >
                  取消
                </button>
                <button
                  onClick={submitForm}
                  className="stitch-btn-primary flex-1"
                >
                  {editing ? "保存" : "新增"}
                </button>
              </div>
            </div>
          </div>
          </div>
      )}
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

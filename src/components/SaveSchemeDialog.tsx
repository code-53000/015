import { useEffect, useState } from "react";
import { X, Save, FileImage } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, saveAsCopy: boolean) => void;
  currentName: string;
  isExisting: boolean;
  thumbnail?: string;
}

export default function SaveSchemeDialog({
  open,
  onClose,
  onSave,
  currentName,
  isExisting,
  thumbnail,
}: Props) {
  const [name, setName] = useState(currentName);
  const [saveAsCopy, setSaveAsCopy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setSaveAsCopy(false);
    }
  }, [open, currentName]);

  if (!open) return null;

  const submit = () => {
    if (!name.trim()) return;
    onSave(name.trim(), isExisting ? saveAsCopy : false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sienna-700/40 backdrop-blur-sm">
      <div className="paper-card w-full max-w-md p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-stitch-50 border border-stitch-200 flex items-center justify-center">
              <Save className="w-5 h-5 text-stitch-500" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-sienna-700 text-lg">
                保存方案
              </h2>
              <p className="text-[11px] text-sienna-500">
                方案将保存在本地浏览器中
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sienna-500 hover:text-sienna-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {thumbnail && (
          <div className="mb-4 flex justify-center">
            <div className="w-36 h-36 rounded-lg bg-linen-100 border-2 border-linen-300 overflow-hidden flex items-center justify-center paper-card">
              <img src={thumbnail} alt="缩略图预览" className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-sienna-500 mb-1">
              方案名称
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="给这个花样起个名字吧"
              className="stitch-input"
            />
          </div>

          {isExisting && (
            <label className="flex items-start gap-2 p-3 rounded-lg bg-linen-100/60 border border-linen-300 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsCopy}
                onChange={(e) => setSaveAsCopy(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-linen-300 text-stitch-500 focus:ring-stitch-400"
              />
              <div className="flex-1">
                <div className="text-xs font-medium text-sienna-700">
                  另存为新方案
                </div>
                <div className="text-[10px] text-sienna-500 mt-0.5">
                  不覆盖原方案，保存为副本
                </div>
              </div>
              <FileImage className="w-4 h-4 text-sienna-400" />
            </label>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="stitch-btn flex-1 !py-2">
            取消
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="stitch-btn-primary flex-1 !py-2 flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saveAsCopy || !isExisting ? "保存为新方案" : "更新方案"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

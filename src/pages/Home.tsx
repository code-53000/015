import { useEffect, useMemo, useRef, useState } from "react";
import { Palette, Ruler, FolderOpen } from "lucide-react";
import clsx from "clsx";

import StitchCanvas from "@/components/StitchCanvas";
import Toolbar from "@/components/Toolbar";
import ColorPalettePanel from "@/components/ColorPalettePanel";
import SizePanel from "@/components/SizePanel";
import SchemePanel from "@/components/SchemePanel";
import StatusBar from "@/components/StatusBar";
import GridResizeDialog from "@/components/GridResizeDialog";
import SaveSchemeDialog from "@/components/SaveSchemeDialog";

import { useColorStore } from "@/store/colorStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useSchemeStore } from "@/store/schemeStore";
import { CanvasRenderer } from "@/engine/CanvasRenderer";

type TabKey = "colors" | "size" | "schemes";

const TABS: { key: TabKey; label: string; icon: typeof Palette }[] = [
  { key: "colors", label: "色号表", icon: Palette },
  { key: "size", label: "尺寸", icon: Ruler },
  { key: "schemes", label: "方案", icon: FolderOpen },
];

export default function Home() {
  const initColors = useColorStore((s) => s.init);
  useEffect(() => {
    initColors();
  }, [initColors]);

  const cols = useCanvasStore((s) => s.cols);
  const rows = useCanvasStore((s) => s.rows);
  const mmPerCell = useCanvasStore((s) => s.mmPerCell);
  const cells = useCanvasStore((s) => s.cells);
  const currentSchemeId = useCanvasStore((s) => s.currentSchemeId);
  const currentSchemeName = useCanvasStore((s) => s.currentSchemeName);
  const setSchemeMeta = useCanvasStore((s) => s.setSchemeMeta);
  const loadCells = useCanvasStore((s) => s.loadCells);
  const fitViewport = useCanvasStore((s) => s.fitViewport);

  const colors = useColorStore((s) => s.colors);

  const saveCurrent = useSchemeStore((s) => s.saveCurrent);

  const [activeTab, setActiveTab] = useState<TabKey>("colors");
  const [showResize, setShowResize] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [thumbnail, setThumbnail] = useState<string>("");

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const generateThumbnail = useMemo(
    () => () => {
      const off = document.createElement("canvas");
      const r = new CanvasRenderer(off);
      const colorMap = new Map(colors.map((c) => [c.id, c]));
      return r.generateThumbnail(cells, cols, rows, colorMap, 160);
    },
    [cols, rows, cells, colors]
  );

  const openSave = () => {
    setThumbnail(generateThumbnail());
    setShowSave(true);
  };

  const handleSave = async (name: string, saveAsCopy: boolean) => {
    const th = thumbnail || generateThumbnail();
    const existingId = saveAsCopy ? null : currentSchemeId;
    const id = await saveCurrent(name, {
      thumbnail: th,
      cols,
      rows,
      mmPerCell,
      cellsJson: JSON.stringify(cells),
      colorsJson: JSON.stringify(colors),
      existingId,
    });
    setSchemeMeta(id, name);
    setShowSave(false);
  };

  const handleNewBlank = () => {
    if (
      cells.some((r) => r.some((v) => v !== null)) &&
      !confirm("当前画布有内容，确认新建空白方案将清空内容？")
    ) {
      return;
    }
    loadCells(
      Array.from({ length: rows }, () => Array(cols).fill(null)),
      cols,
      rows,
      mmPerCell
    );
    setSchemeMeta(null, "未命名方案");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-linen-100 overflow-hidden p-2 gap-2">
      <Toolbar
        onSave={openSave}
        onResize={() => setShowResize(true)}
      />

      <div className="flex-1 flex gap-2 min-h-0">
        <aside className="w-[340px] shrink-0 paper-card overflow-hidden flex flex-col relative">
          <div className="flex items-center border-b border-linen-200 shrink-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={clsx("flex-1 !rounded-none border-0", active ? "tab-btn-active" : "tab-btn")}
                >
                  <Icon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-hidden min-h-0 relative">
            {activeTab === "colors" && <ColorPalettePanel />}
            {activeTab === "size" && <SizePanel />}
            {activeTab === "schemes" && (
              <SchemePanel onNewBlank={handleNewBlank} />
            )}
          </div>
        </aside>

        <main
          ref={canvasContainerRef}
          className="flex-1 paper-card overflow-hidden min-w-0 relative stitch-canvas-target"
        >
          <StitchCanvas />
        </main>
      </div>

      <StatusBar />

      <GridResizeDialog
        open={showResize}
        onClose={(confirmed) => {
          setShowResize(false);
          if (confirmed && canvasContainerRef.current) {
            setTimeout(() => {
              fitViewport(
                canvasContainerRef.current!.clientWidth,
                canvasContainerRef.current!.clientHeight,
                40
              );
            }, 50);
          }
        }}
      />

      <SaveSchemeDialog
        open={showSave}
        onClose={() => setShowSave(false)}
        onSave={handleSave}
        currentName={currentSchemeName}
        isExisting={!!currentSchemeId}
        thumbnail={thumbnail}
      />
    </div>
  );
}

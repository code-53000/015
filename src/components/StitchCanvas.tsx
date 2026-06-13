import { useEffect, useRef, useCallback } from "react";
import { CanvasRenderer } from "@/engine/CanvasRenderer";
import { useCanvasStore } from "@/store/canvasStore";
import { useColorStore } from "@/store/colorStore";

export interface StitchCanvasHandle {
  getRenderer: () => CanvasRenderer | null;
}

export default function StitchCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const isPanningRef = useRef(false);
  const isPaintingRef = useRef(false);
  const spacePressedRef = useRef(false);
  const lastPaintRef = useRef<{ col: number; row: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const {
    cols, rows, cells, viewport, tool,
    hoveredCell, showStitchMark,
    setViewport, setHoveredCell, paintCell, pushUndo,
  } = useCanvasStore();

  const colors = useColorStore((s) => s.colors);
  const selectedColorId = useColorStore((s) => s.selectedColorId);
  const setSelectedColorId = useColorStore((s) => s.setSelected);

  const colorMapRef = useRef(new Map<string, ReturnType<typeof useColorStore.getState>["colors"][number]>());
  useEffect(() => {
    colorMapRef.current = new Map(colors.map((c) => [c.id, c]));
  }, [colors]);

  const scheduleRender = useCallback(() => {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const r = rendererRef.current;
      if (!r) return;
      r.render({
        viewport: useCanvasStore.getState().viewport,
        cols: useCanvasStore.getState().cols,
        rows: useCanvasStore.getState().rows,
        cells: useCanvasStore.getState().cells,
        colorMap: colorMapRef.current,
        hoveredCell: useCanvasStore.getState().hoveredCell,
        showStitchMark: useCanvasStore.getState().showStitchMark,
      });
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;

    const handleResize = () => {
      const rect = el.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
      scheduleRender();
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    scheduleRender();

    setTimeout(() => {
      const store = useCanvasStore.getState();
      const rect = el.getBoundingClientRect();
      store.fitViewport(rect.width, rect.height, 40);
    }, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleRender]);

  useEffect(() => {
    scheduleRender();
  }, [viewport, cols, rows, cells, hoveredCell, showStitchMark, scheduleRender]);

  useEffect(() => {
    scheduleRender();
  }, [colors, scheduleRender]);

  const applyPaintAt = useCallback(
    (col: number, row: number) => {
      const state = useCanvasStore.getState();
      const mode = state.tool;
      if (mode === "brush") {
        if (!selectedColorId) return;
        paintCell(col, row, selectedColorId);
      } else if (mode === "eraser") {
        paintCell(col, row, null);
      } else if (mode === "picker") {
        const cid = state.cells[row]?.[col];
        if (cid) setSelectedColorId(cid);
      }
    },
    [selectedColorId, paintCell, setSelectedColorId]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseMove = (e: MouseEvent) => {
      const pos = getPos(e);
      const renderer = rendererRef.current;
      if (!renderer) return;
      const vp = useCanvasStore.getState().viewport;
      const { col, row } = renderer.screenToGrid(pos.x, pos.y, vp);
      setHoveredCell({ col, row });

      if (isPanningRef.current && panStartRef.current) {
        const dx = pos.x - panStartRef.current.x;
        const dy = pos.y - panStartRef.current.y;
        setViewport({
          offsetX: panStartRef.current.ox + dx,
          offsetY: panStartRef.current.oy + dy,
        });
      } else if (isPaintingRef.current && !spacePressedRef.current) {
        const last = lastPaintRef.current;
        if (!last || last.col !== col || last.row !== row) {
          const state = useCanvasStore.getState();
          if (col >= 0 && col < state.cols && row >= 0 && row < state.rows) {
            applyPaintAt(col, row);
            lastPaintRef.current = { col, row };
          }
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const pos = getPos(e);
      const renderer = rendererRef.current;
      if (!renderer) return;
      const vp = useCanvasStore.getState().viewport;
      const { col, row } = renderer.screenToGrid(pos.x, pos.y, vp);

      const shouldPan =
        e.button === 1 ||
        (e.button === 0 && spacePressedRef.current) ||
        (e.button === 0 && e.shiftKey);

      if (shouldPan) {
        isPanningRef.current = true;
        panStartRef.current = {
          x: pos.x,
          y: pos.y,
          ox: vp.offsetX,
          oy: vp.offsetY,
        };
        canvas.style.cursor = "grabbing";
        e.preventDefault();
        return;
      }

      if (e.button === 0) {
        const mode = useCanvasStore.getState().tool;
        if (mode === "picker") {
          const state = useCanvasStore.getState();
          const cid = state.cells[row]?.[col];
          if (cid) setSelectedColorId(cid);
          return;
        }
        const state = useCanvasStore.getState();
        if (col >= 0 && col < state.cols && row >= 0 && row < state.rows) {
          pushUndo();
          isPaintingRef.current = true;
          lastPaintRef.current = { col, row };
          applyPaintAt(col, row);
        }
      }
    };

    const onMouseUp = () => {
      isPaintingRef.current = false;
      isPanningRef.current = false;
      panStartRef.current = null;
      lastPaintRef.current = null;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = spacePressedRef.current
          ? "grab"
          : "crosshair";
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const pos = getPos(e);
      const vp = useCanvasStore.getState().viewport;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(2, Math.min(60, vp.scale * delta));
      const ratio = newScale / vp.scale;
      setViewport({
        scale: newScale,
        offsetX: pos.x - (pos.x - vp.offsetX) * ratio,
        offsetY: pos.y - (pos.y - vp.offsetY) * ratio,
      });
    };

    const onMouseLeave = () => {
      setHoveredCell(null);
      isPanningRef.current = false;
      isPaintingRef.current = false;
      panStartRef.current = null;
      lastPaintRef.current = null;
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [applyPaintAt, setViewport, setHoveredCell, pushUndo, setSelectedColorId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        spacePressedRef.current = true;
        if (canvasRef.current && !isPanningRef.current) {
          canvasRef.current.style.cursor = "grab";
        }
      }
      if (e.code === "KeyB") useCanvasStore.getState().setTool("brush");
      if (e.code === "KeyE") useCanvasStore.getState().setTool("eraser");
      if (e.code === "KeyI") useCanvasStore.getState().setTool("picker");
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyZ" && !e.shiftKey) {
        e.preventDefault();
        useCanvasStore.getState().undo();
      }
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyZ") ||
        ((e.metaKey || e.ctrlKey) && e.code === "KeyY")
      ) {
        e.preventDefault();
        useCanvasStore.getState().redo();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spacePressedRef.current = false;
        if (canvasRef.current && !isPanningRef.current) {
          canvasRef.current.style.cursor = "crosshair";
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative linen-bg overflow-hidden rounded-xl"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: "crosshair", touchAction: "none" }}
      />
    </div>
  );
}

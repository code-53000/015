import { create } from "zustand";
import type { Scheme } from "@/types";
import {
  getAllSchemes,
  getScheme,
  saveScheme as dbSaveScheme,
  deleteScheme as dbDeleteScheme,
} from "@/db";

interface SchemeState {
  schemes: Scheme[];
  loading: boolean;
  saving: boolean;

  fetchAll: () => Promise<void>;
  saveCurrent: (
    name: string,
    options: {
      thumbnail: string;
      cols: number;
      rows: number;
      mmPerCell: number;
      cellsJson: string;
      colorsJson?: string;
      existingId?: number | null;
    }
  ) => Promise<number>;
  loadScheme: (id: number) => Promise<Scheme | undefined>;
  removeScheme: (id: number) => Promise<void>;
  renameScheme: (id: number, name: string) => Promise<void>;
}

export const useSchemeStore = create<SchemeState>((set, get) => ({
  schemes: [],
  loading: false,
  saving: false,

  async fetchAll() {
    set({ loading: true });
    try {
      const list = await getAllSchemes();
      set({ schemes: list });
    } finally {
      set({ loading: false });
    }
  },

  async saveCurrent(name, opts) {
    set({ saving: true });
    try {
      const now = Date.now();
      const existing = opts.existingId
        ? get().schemes.find((s) => s.id === opts.existingId)
        : undefined;
      const record: Omit<Scheme, "id"> & { id?: number } = {
        name: name.trim() || "未命名方案",
        thumbnail: opts.thumbnail,
        gridCols: opts.cols,
        gridRows: opts.rows,
        mmPerCell: opts.mmPerCell,
        cells: opts.cellsJson,
        colors: opts.colorsJson ? JSON.parse(opts.colorsJson) : undefined,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      if (opts.existingId) {
        record.id = opts.existingId;
      }
      const id = await dbSaveScheme(record);
      await get().fetchAll();
      return id;
    } finally {
      set({ saving: false });
    }
  },

  async loadScheme(id) {
    return getScheme(id);
  },

  async removeScheme(id) {
    await dbDeleteScheme(id);
    await get().fetchAll();
  },

  async renameScheme(id, name) {
    const s = get().schemes.find((x) => x.id === id);
    if (!s) return;
    await dbSaveScheme({ ...s, name, updatedAt: Date.now() });
    await get().fetchAll();
  },
}));

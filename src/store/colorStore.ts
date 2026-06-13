import { create } from "zustand";
import type { ColorEntry } from "@/types";
import {
  getAllColors,
  saveColor as dbSaveColor,
  deleteColor as dbDeleteColor,
  saveColorBatch,
} from "@/db";
import { generateId } from "@/utils/sizeCalculator";

const DEFAULT_COLORS: ColorEntry[] = [
  { id: "c_dmc_666", brand: "DMC", code: "666", hexColor: "#C41E3A", inStock: true, note: "圣诞红" },
  { id: "c_dmc_321", brand: "DMC", code: "321", hexColor: "#E4002B", inStock: true, note: "正红" },
  { id: "c_dmc_815", brand: "DMC", code: "815", hexColor: "#FF8674", inStock: true, note: "珊瑚粉" },
  { id: "c_dmc_760", brand: "DMC", code: "760", hexColor: "#FAB3A4", inStock: false },
  { id: "c_dmc_947", brand: "DMC", code: "947", hexColor: "#FFD700", inStock: true, note: "金黄" },
  { id: "c_dmc_973", brand: "DMC", code: "973", hexColor: "#FFA343", inStock: true },
  { id: "c_dmc_907", brand: "DMC", code: "907", hexColor: "#E67E22", inStock: true },
  { id: "c_dmc_898", brand: "DMC", code: "898", hexColor: "#C08410", inStock: false },
  { id: "c_dmc_3345", brand: "DMC", code: "3345", hexColor: "#6AB04C", inStock: true },
  { id: "c_dmc_906", brand: "DMC", code: "906", hexColor: "#2ECC71", inStock: true, note: "翠绿" },
  { id: "c_dmc_699", brand: "DMC", code: "699", hexColor: "#1E8449", inStock: true },
  { id: "c_dmc_996", brand: "DMC", code: "996", hexColor: "#155E37", inStock: false },
  { id: "c_dmc_995", brand: "DMC", code: "995", hexColor: "#5DADE2", inStock: true },
  { id: "c_dmc_3843", brand: "DMC", code: "3843", hexColor: "#3498DB", inStock: true },
  { id: "c_dmc_797", brand: "DMC", code: "797", hexColor: "#1F618D", inStock: true },
  { id: "c_dmc_820", brand: "DMC", code: "820", hexColor: "#884EA0", inStock: true },
  { id: "c_dmc_718", brand: "DMC", code: "718", hexColor: "#BB8FCE", inStock: false },
  { id: "c_dmc_359", brand: "DMC", code: "359", hexColor: "#D7BDE2", inStock: true },
  { id: "c_dmc_891", brand: "DMC", code: "891", hexColor: "#6B4423", inStock: true, note: "深棕" },
  { id: "c_dmc_437", brand: "DMC", code: "437", hexColor: "#A0522D", inStock: true },
  { id: "c_dmc_422", brand: "DMC", code: "422", hexColor: "#D2B48C", inStock: true },
  { id: "c_dmc_415", brand: "DMC", code: "415", hexColor: "#F5DEB3", inStock: true },
  { id: "c_dmc_310", brand: "DMC", code: "310", hexColor: "#2C2C2C", inStock: true, note: "黑色" },
  { id: "c_dmc_413", brand: "DMC", code: "413", hexColor: "#7A7A7A", inStock: true },
  { id: "c_dmc_762", brand: "DMC", code: "762", hexColor: "#BDBDBD", inStock: true },
  { id: "c_dmc_blanc", brand: "DMC", code: "BLANC", hexColor: "#FFFFFF", inStock: true, note: "白色" },
];

interface ColorState {
  colors: ColorEntry[];
  selectedColorId: string | null;
  loading: boolean;
  initialized: boolean;

  init: () => Promise<void>;
  setSelected: (id: string | null) => void;
  addColor: (data: Omit<ColorEntry, "id">) => Promise<ColorEntry>;
  updateColor: (id: string, data: Partial<ColorEntry>) => Promise<void>;
  removeColor: (id: string) => Promise<void>;
  toggleStock: (id: string) => Promise<void>;
  getColorById: (id: string | null | undefined) => ColorEntry | undefined;
}

export const useColorStore = create<ColorState>((set, get) => ({
  colors: [],
  selectedColorId: null,
  loading: false,
  initialized: false,

  async init() {
    if (get().initialized) return;
    set({ loading: true });
    try {
      let existing = await getAllColors();
      if (existing.length === 0) {
        await saveColorBatch(DEFAULT_COLORS);
        existing = DEFAULT_COLORS;
      }
      const selected =
        existing.find((c) => c.inStock)?.id ?? existing[0]?.id ?? null;
      set({ colors: existing, selectedColorId: selected, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  setSelected: (id) => set({ selectedColorId: id }),

  async addColor(data) {
    const newColor: ColorEntry = { ...data, id: generateId() };
    await dbSaveColor(newColor);
    set((s) => ({ colors: [...s.colors, newColor] }));
    return newColor;
  },

  async updateColor(id, data) {
    const existing = get().colors.find((c) => c.id === id);
    if (!existing) return;
    const updated = { ...existing, ...data };
    await dbSaveColor(updated);
    set((s) => ({
      colors: s.colors.map((c) => (c.id === id ? updated : c)),
    }));
  },

  async removeColor(id) {
    await dbDeleteColor(id);
    set((s) => {
      const next = s.colors.filter((c) => c.id !== id);
      const nextSelected =
        s.selectedColorId === id
          ? next[0]?.id ?? null
          : s.selectedColorId;
      return { colors: next, selectedColorId: nextSelected };
    });
  },

  async toggleStock(id) {
    const c = get().colors.find((x) => x.id === id);
    if (!c) return;
    await get().updateColor(id, { inStock: !c.inStock });
  },

  getColorById(id) {
    if (!id) return undefined;
    return get().colors.find((c) => c.id === id);
  },
}));

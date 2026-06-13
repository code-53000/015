import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { ColorEntry, Scheme } from "@/types";

interface StitchDB extends DBSchema {
  schemes: {
    key: number;
    value: Scheme;
    indexes: { "by-updatedAt": number; "by-name": string };
  };
  colors: {
    key: string;
    value: ColorEntry;
    indexes: { "by-brand": string; "by-code": string };
  };
}

const DB_NAME = "stitch-design-db";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<StitchDB>> | null = null;

function getDB(): Promise<IDBPDatabase<StitchDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StitchDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains("schemes")) {
            const schemeStore = db.createObjectStore("schemes", {
              keyPath: "id",
              autoIncrement: true,
            });
            schemeStore.createIndex("by-updatedAt", "updatedAt");
            schemeStore.createIndex("by-name", "name");
          }
          if (!db.objectStoreNames.contains("colors")) {
            const colorStore = db.createObjectStore("colors", {
              keyPath: "id",
            });
            colorStore.createIndex("by-brand", "brand");
            colorStore.createIndex("by-code", "code");
          }
        }
        if (oldVersion < 2) {
          void db;
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllSchemes(): Promise<Scheme[]> {
  const db = await getDB();
  const result = await db.getAllFromIndex("schemes", "by-updatedAt");
  return result.reverse();
}

export async function getScheme(id: number): Promise<Scheme | undefined> {
  const db = await getDB();
  return db.get("schemes", id);
}

export async function saveScheme(scheme: Omit<Scheme, "id"> & { id?: number }): Promise<number> {
  const db = await getDB();
  if (scheme.id != null && scheme.id > 0) {
    await db.put("schemes", scheme as Scheme);
    return scheme.id;
  }
  const { id: _id, ...rest } = scheme as Scheme & { id?: number };
  const id = await db.add("schemes", rest as Omit<Scheme, "id">);
  return Number(id);
}

export async function deleteScheme(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("schemes", id);
}

export async function getAllColors(): Promise<ColorEntry[]> {
  const db = await getDB();
  return db.getAll("colors");
}

export async function saveColor(color: ColorEntry): Promise<string> {
  const db = await getDB();
  await db.put("colors", color);
  return color.id;
}

export async function deleteColor(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("colors", id);
}

export async function saveColorBatch(colors: ColorEntry[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("colors", "readwrite");
  await Promise.all([
    ...colors.map((c) => tx.store.put(c)),
    tx.done,
  ]);
}

export async function clearColors(): Promise<void> {
  const db = await getDB();
  await db.clear("colors");
}

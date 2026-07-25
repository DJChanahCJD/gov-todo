import type { Task, RecurringTemplate } from "@/lib/types";

const DB_NAME = "gov-todo";
const DB_VERSION = 2;
const TASK_STORE = "tasks";
const TEMPLATE_STORE = "templates";

/** 打开/初始化 IndexedDB */
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      // 模板存储结构变更，删除旧 store 重建
      if (db.objectStoreNames.contains(TEMPLATE_STORE)) {
        db.deleteObjectStore(TEMPLATE_STORE);
      }
      db.createObjectStore(TEMPLATE_STORE, { keyPath: "id" });

      if (!db.objectStoreNames.contains(TASK_STORE)) {
        db.createObjectStore(TASK_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 通用事务辅助 */
function tx(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const req = handler(s);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Task CRUD ──

export async function getAllTasks(): Promise<Task[]> {
  const db = await open();
  return (await tx(db, TASK_STORE, "readonly", (s) => s.getAll())) as Promise<
    Task[]
  >;
}

export async function putTask(task: Task): Promise<void> {
  const db = await open();
  await tx(db, TASK_STORE, "readwrite", (s) => s.put(task));
}

export async function deleteTask(id: string): Promise<void> {
  const db = await open();
  await tx(db, TASK_STORE, "readwrite", (s) => s.delete(id));
}

// ── Template CRUD ──

export async function getAllTemplates(): Promise<RecurringTemplate[]> {
  const db = await open();
  return (await tx(db, TEMPLATE_STORE, "readonly", (s) =>
    s.getAll()
  )) as Promise<RecurringTemplate[]>;
}

export async function putTemplate(template: RecurringTemplate): Promise<void> {
  const db = await open();
  await tx(db, TEMPLATE_STORE, "readwrite", (s) => s.put(template));
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await open();
  await tx(db, TEMPLATE_STORE, "readwrite", (s) => s.delete(id));
}

import type { Task, RecurringTemplate } from "@/lib/types";

const DB_NAME = "gov-todo";
const DB_VERSION = 2;
const TASK_STORE = "tasks";
const TEMPLATE_STORE = "templates";

/** 连接单例：复用同一 IDBDatabase，避免每次操作泄漏句柄 */
let dbPromise: Promise<IDBDatabase> | null = null;

/** 把 IndexedDB 底层错误转为可展示的中文提示 */
export function describeDbError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "QuotaExceededError")
      return "存储空间已满，请先清理浏览器数据或导出备份后重试";
    if (err.name === "VersionError")
      return "数据库版本不兼容，请使用最新版本页面";
    if (err.name === "UnknownError")
      return "存储被浏览器占用，请关闭其他同源页面后重试";
  }
  return "本地存储操作失败";
}

/** 打开/初始化 IndexedDB（单例） */
function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      // 仅补建缺失的 store，绝不删除已有 store（删除会导致数据丢失）
      if (!db.objectStoreNames.contains(TASK_STORE)) {
        db.createObjectStore(TASK_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(TEMPLATE_STORE)) {
        db.createObjectStore(TEMPLATE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // 其他标签页升级时主动让出连接，避免阻塞
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
    request.onblocked = () => {
      console.warn("gov-todo 数据库升级被其他页面阻塞");
    };
  });

  return dbPromise;
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
    // 事务级错误（如配额超限）也在此捕获
    t.onerror = () => reject(t.error ?? req.error);
    t.onabort = () => reject(t.error);
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

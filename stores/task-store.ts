import { create } from "zustand";
import type { Task, Quadrant } from "@/lib/types";
import * as db from "@/lib/db/db";
import { toast } from "sonner";
import { isToday, parseISO } from "date-fns";

interface TaskState {
  /** 所有任务（活跃 + 已归档），内存缓存 */
  tasks: Task[];
  loading: boolean;

  /** 从 IndexedDB 加载 */
  load: () => Promise<void>;

  /** 新建任务 */
  add: (data: {
    title: string;
    deadline?: string;
    quadrant?: Quadrant;
    templateId?: string;
  }) => Promise<Task>;

  /** 更新任务标题或截止时间 */
  update: (
    id: string,
    data: { title?: string; deadline?: string | null }
  ) => Promise<void>;

  /** 切换置顶 */
  togglePin: (id: string) => Promise<void>;

  /** 拖动到新象限 */
  moveQuadrant: (id: string, quadrant: Quadrant) => Promise<void>;

  /** 完成任务（设置 completedAt，标记为已归档） */
  complete: (id: string) => Promise<void>;

  /** 切换完成态：完成或恢复 */
  toggleComplete: (id: string) => Promise<void>;

  /** 删除已归档任务 */
  remove: (id: string) => Promise<void>;
}

/** 生成 UUID v4 */
function uid(): string {
  return crypto.randomUUID();
}

/** 按 deadline 排序，undefined 排最后 */
function byDeadline(a: Task, b: Task): number {
  if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
  if (a.deadline) return -1;
  if (b.deadline) return 1;
  return a.createdAt.localeCompare(b.createdAt);
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  loading: true,

  load: async () => {
    try {
      const tasks = await db.getAllTasks();
      set({ tasks, loading: false });
    } catch (e) {
      console.error("加载任务失败", e);
      set({ loading: false });
    }
  },

  add: async (data) => {
    const task: Task = {
      id: uid(),
      title: data.title,
      deadline: data.deadline,
      quadrant: data.quadrant ?? 1,
      pinned: false,
      createdAt: new Date().toISOString(),
      templateId: data.templateId,
    };
    await db.putTask(task);
    set((s) => ({ tasks: [...s.tasks, task] }));
    toast.success("任务已创建");
    return task;
  },

  update: async (id, data) => {
    const tasks = get().tasks;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const updated = { ...tasks[idx] };
    if (data.title !== undefined) updated.title = data.title;
    if (data.deadline !== undefined)
      updated.deadline = data.deadline ?? undefined;
    await db.putTask(updated);
    set({ tasks: tasks.map((t) => (t.id === id ? updated : t)) });
  },

  togglePin: async (id) => {
    const tasks = get().tasks;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const updated: Task = { ...tasks[idx], pinned: !tasks[idx].pinned };
    await db.putTask(updated);
    set({ tasks: tasks.map((t) => (t.id === id ? updated : t)) });
  },

  moveQuadrant: async (id, quadrant) => {
    const tasks = get().tasks;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const updated: Task = { ...tasks[idx], quadrant };
    await db.putTask(updated);
    set({ tasks: tasks.map((t) => (t.id === id ? updated : t)) });
  },

  complete: async (id) => {
    const tasks = get().tasks;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const updated: Task = {
      ...tasks[idx],
      completedAt: new Date().toISOString(),
    };
    await db.putTask(updated);
    set({ tasks: tasks.map((t) => (t.id === id ? updated : t)) });
    toast.success("任务已完成，已归档");
  },

  toggleComplete: async (id) => {
    const tasks = get().tasks;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const current = tasks[idx];
    const updated: Task = {
      ...current,
      completedAt: current.completedAt ? undefined : new Date().toISOString(),
    };
    await db.putTask(updated);
    set({ tasks: tasks.map((t) => (t.id === id ? updated : t)) });
    toast.success(current.completedAt ? "任务已恢复" : "任务已完成，已归档");
  },

  remove: async (id) => {
    await db.deleteTask(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    toast.success("任务已删除");
  },
}));

/** 获取指定象限的活跃任务（已排序：置顶在前，然后按 deadline） */
export function selectActiveByQuadrant(
  tasks: Task[],
  quadrant: Quadrant
): Task[] {
  return tasks
    .filter(
      (t) =>
        t.quadrant === quadrant &&
        (!t.completedAt || isToday(parseISO(t.completedAt)))
    )
    .sort((a, b) => {
      const aDone = a.completedAt ? 1 : 0;
      const bDone = b.completedAt ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      if (aDone) return b.completedAt!.localeCompare(a.completedAt!);
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return byDeadline(a, b);
    });
}

/** 获取已归档任务（按完成时间倒序） */
export function selectArchived(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.completedAt)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
}

/** 四象限类型：0=重要且紧急 1=重要不紧急(默认) 2=不重要紧急 3=不重要不紧急 */
export type Quadrant = 0 | 1 | 2 | 3;

/** 任务实体 */
export interface Task {
  id: string;
  title: string;
  deadline?: string; // ISO 日期字符串
  quadrant: Quadrant;
  pinned: boolean;
  createdAt: string; // ISO datetime
  completedAt?: string; // 完成时记录，存在即为已归档
  templateId?: string; // 关联的周期模板 id
}

/** 周期任务模板 */
export interface RecurringTemplate {
  id: string;
  title: string;
  description: string;
  quadrant: Quadrant;
  cron: string; // cron 表达式，底层存储
  enabled: boolean;
  lastGenerated?: string; // 上次生成实例的时间
}

/** 模板预设类型（UI 层面友好选项） */
export type TemplatePreset =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

/** 象限标签映射 */
export const QUADRANT_LABELS: Record<
  Quadrant,
  { title: string; subtitle: string }
> = {
  0: { title: "Do", subtitle: "重要且紧急" },
  1: { title: "Schedule", subtitle: "重要但不紧急" },
  2: { title: "Delegate", subtitle: "紧急但不重要" },
  3: { title: "Delete", subtitle: "不紧急且不重要" },
};

/** 预设 cron 表达式映射 */
export const PRESET_CRON: Record<TemplatePreset, string> = {
  daily: "0 0 * * *",
  weekly: "0 0 * * 1",
  monthly: "0 0 1 * *",
  yearly: "0 0 1 1 *",
  custom: "",
};

/** 预设 cron 标签 */
export const PRESET_LABELS: Record<TemplatePreset, string> = {
  daily: "每日",
  weekly: "每周",
  monthly: "每月",
  yearly: "每年",
  custom: "自定义",
};

/** 四象限类型：0=重要且紧急 1=重要不紧急(默认) 2=不重要紧急 3=不重要不紧急 */
export type Quadrant = 0 | 1 | 2 | 3;

/** 任务实体 */
export interface Task {
  id: string;
  title: string;
  deadline?: string; // ISO 日期字符串
  description?: string;
  quadrant: Quadrant;
  pinned: boolean;
  createdAt: string; // ISO datetime
  completedAt?: string; // 完成时记录，存在即为已归档
  templateId?: string; // 关联的周期模板 id
}

/** 周期类型 */
export type RecurringType =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "interval";

/** 每天（无额外参数） */
export interface DailyRule {}

/** 每周：指定星期几 0=周日 1=周一 ... 6=周六 */
export interface WeeklyRule {
  dayOfWeek: number;
}

/** 每月：指定几号（1-28） */
export interface MonthlyRule {
  day: number;
}

/** 每年：指定月日 */
export interface YearlyRule {
  month: number; // 1-12
  day: number; // 1-31
}

/** 每隔 N 天 */
export interface IntervalRule {
  every: number;
}

export type RecurringRule =
  | DailyRule
  | WeeklyRule
  | MonthlyRule
  | YearlyRule
  | IntervalRule;

/** 周期任务模板 */
export interface RecurringTemplate {
  id: string;
  title: string;
  description: string;
  quadrant: Quadrant;
  type: RecurringType;
  rule: RecurringRule;
  leadDays: number; // 提前多少天出现在 TODO 列表
  lastGeneratedFor: string; // 周期标识（如 "2026" / "2026-07" / "2026-07-25"）
  nextGenerateAt: string; // 下次生成时间 ISO 字符串
  enabled: boolean;
}

/** 各类型默认提前天数 */
export const DEFAULT_LEAD_DAYS: Record<RecurringType, number> = {
  daily: 0,
  weekly: 3,
  monthly: 7,
  yearly: 30,
  interval: 0,
};

/** 象限标签映射 */
export const QUADRANT_LABELS: Record<
  Quadrant,
  { title: string; subtitle: string }
> = {
  0: { title: "Do", subtitle: "重要且紧急" },
  1: { title: "Schedule", subtitle: "重要但不紧急" },
  2: { title: "Delegate", subtitle: "紧急但不重要" },
  3: { title: "Eliminate", subtitle: "不紧急且不重要" },
};

import type {
  RecurringTemplate,
  RecurringType,
  RecurringRule,
  WeeklyRule,
  MonthlyRule,
  YearlyRule,
  IntervalRule,
} from "@/lib/types";
import type { Quadrant } from "@/lib/types";
import { DEFAULT_LEAD_DAYS } from "@/lib/types";

/** 格式化日期为 YYYY-MM-DD */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 解析 YYYY-MM-DD 字符串 */
function parseDateStr(s: string): Date | null {
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

/** 日期减 N 天 */
function subDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  return r;
}

/**
 * 格式化周期标识。
 * daily/weekly/interval → "YYYY-MM-DD"
 * monthly → "YYYY-MM"
 * yearly → "YYYY"
 */
function formatPeriod(date: Date, type: RecurringType): string {
  switch (type) {
    case "daily":
    case "weekly":
    case "interval":
      return toDateStr(date);
    case "monthly":
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    case "yearly":
      return `${date.getFullYear()}`;
  }
}

/**
 * 计算事件日期。
 * 若 lastGeneratedFor 为空，返回从 anchorDate（或 now）开始的第一个事件日期；
 * 否则返回 lastGeneratedFor 标识的周期之后的下一个事件日期。
 * @param anchorDate 指定开始日期时作为锚点，否则使用 now
 */
function calculateEventDate(
  type: RecurringType,
  rule: RecurringRule,
  lastGeneratedFor: string,
  now: Date,
  anchorDate?: Date
): Date {
  // 首次计算时使用 anchorDate 替代 now 作为起始锚点
  const base = anchorDate ?? now;
  switch (type) {
    case "daily": {
      if (!lastGeneratedFor)
        return new Date(base.getFullYear(), base.getMonth(), base.getDate());
      const parsed = parseDateStr(lastGeneratedFor);
      if (!parsed) return new Date(now);
      parsed.setDate(parsed.getDate() + 1);
      return parsed;
    }

    case "weekly": {
      const wRule = rule as WeeklyRule;
      const targetDay = wRule.dayOfWeek;
      if (!lastGeneratedFor) {
        const d = new Date(base);
        d.setHours(0, 0, 0, 0);
        const diff = (targetDay - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
        if (toDateStr(d) < toDateStr(base)) d.setDate(d.getDate() + 7);
        return d;
      }
      const parsed = parseDateStr(lastGeneratedFor);
      if (!parsed) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        const diff = (targetDay - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + diff);
        if (toDateStr(d) < toDateStr(now)) d.setDate(d.getDate() + 7);
        return d;
      }
      parsed.setDate(parsed.getDate() + 1);
      const diff = (targetDay - parsed.getDay() + 7) % 7;
      parsed.setDate(parsed.getDate() + diff);
      return parsed;
    }

    case "monthly": {
      const mRule = rule as MonthlyRule;
      const dayNum = Math.min(mRule.day, 28);
      if (!lastGeneratedFor) {
        const d = new Date(base);
        d.setHours(0, 0, 0, 0);
        d.setDate(
          Math.min(
            dayNum,
            new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
          )
        );
        if (toDateStr(d) < toDateStr(base)) {
          d.setMonth(d.getMonth() + 1);
          d.setDate(
            Math.min(
              dayNum,
              new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
            )
          );
        }
        return d;
      }
      const [y, m] = lastGeneratedFor.split("-").map(Number);
      if (isNaN(y) || isNaN(m)) {
        const d = new Date(now);
        d.setMonth(d.getMonth() + 1);
        d.setDate(
          Math.min(
            dayNum,
            new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
          )
        );
        return d;
      }
      const d = new Date(y, m - 1, 1);
      d.setMonth(d.getMonth() + 1);
      d.setDate(
        Math.min(
          dayNum,
          new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
        )
      );
      return d;
    }

    case "yearly": {
      const yRule = rule as YearlyRule;
      if (!lastGeneratedFor) {
        const d = new Date(base);
        d.setHours(0, 0, 0, 0);
        d.setMonth(yRule.month - 1);
        d.setDate(
          Math.min(
            yRule.day,
            new Date(d.getFullYear(), yRule.month, 0).getDate()
          )
        );
        if (toDateStr(d) < toDateStr(base)) {
          d.setFullYear(d.getFullYear() + 1);
          d.setDate(
            Math.min(
              yRule.day,
              new Date(d.getFullYear(), yRule.month, 0).getDate()
            )
          );
        }
        return d;
      }
      const year = parseInt(lastGeneratedFor);
      if (isNaN(year)) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        d.setMonth(yRule.month - 1);
        d.setDate(
          Math.min(
            yRule.day,
            new Date(d.getFullYear(), yRule.month, 0).getDate()
          )
        );
        if (d <= now) d.setFullYear(d.getFullYear() + 1);
        return d;
      }
      const d = new Date(year + 1, yRule.month - 1, 1);
      d.setDate(
        Math.min(yRule.day, new Date(d.getFullYear(), yRule.month, 0).getDate())
      );
      return d;
    }

    case "interval": {
      const iRule = rule as IntervalRule;
      if (!lastGeneratedFor) {
        const d = new Date(base);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + iRule.every);
        return d;
      }
      const parsed = parseDateStr(lastGeneratedFor);
      if (!parsed) {
        const d = new Date(now);
        d.setDate(d.getDate() + iRule.every);
        return d;
      }
      parsed.setDate(parsed.getDate() + iRule.every);
      return parsed;
    }
  }
}

/**
 * 计算新建模板时的初始 nextGenerateAt。
 * nextGenerateAt = 首个事件日期 - leadDays
 * @param startDate 可选开始日期 YYYY-MM-DD，指定后首个事件从该日期起算
 */
export function computeInitialNextGenerateAt(
  type: RecurringType,
  rule: RecurringRule,
  leadDays: number,
  now = new Date(),
  startDate?: string
): string {
  const anchorDate = startDate
    ? (parseDateStr(startDate) ?? undefined)
    : undefined;
  const eventDate = calculateEventDate(type, rule, "", now, anchorDate);
  return toDateStr(subDays(eventDate, leadDays));
}

/** 生成任务数据 */
export interface GeneratedInstance {
  title: string;
  deadline: string;
  quadrant: Quadrant;
  templateId: string;
}

/** 生成结果：新增实例 + 需要持久化的模板 */
export interface GenerationResult {
  instances: GeneratedInstance[];
  updatedTemplates: RecurringTemplate[];
}

/**
 * 扫描所有启用的模板，使用 nextGenerateAt 模型生成周期任务实例。
 * 每个模板每次最多生成 1 条，已错过周期自动跳过不补。
 * 返回的 updatedTemplates 需要调用方持久化。
 */
export function generateInstances(
  templates: RecurringTemplate[],
  now = new Date()
): GenerationResult {
  const instances: GeneratedInstance[] = [];
  const updatedTemplates: RecurringTemplate[] = [];
  const todayStr = toDateStr(now);

  for (const template of templates) {
    if (!template.enabled) continue;

    let t = { ...template };
    let changed = false;

    while (new Date(t.nextGenerateAt) <= now) {
      const eventDate = calculateEventDate(
        t.type,
        t.rule,
        t.lastGeneratedFor,
        now
      );

      // 事件日期已在今天之前 → 跳过此周期，不生成 TODO
      if (toDateStr(eventDate) < todayStr) {
        t.lastGeneratedFor = formatPeriod(eventDate, t.type);
        const nextEvent = calculateEventDate(
          t.type,
          t.rule,
          t.lastGeneratedFor,
          now
        );
        t.nextGenerateAt = toDateStr(subDays(nextEvent, t.leadDays));
        changed = true;
        continue;
      }

      // 事件日期在今天或之后 → 生成 TODO
      instances.push({
        title: t.title,
        deadline: toDateStr(eventDate),
        quadrant: t.quadrant,
        templateId: t.id,
      });

      t.lastGeneratedFor = formatPeriod(eventDate, t.type);
      const nextEvent = calculateEventDate(
        t.type,
        t.rule,
        t.lastGeneratedFor,
        now
      );
      t.nextGenerateAt = toDateStr(subDays(nextEvent, t.leadDays));
      changed = true;
      break;
    }

    if (changed) {
      updatedTemplates.push(t);
    }
  }

  return { instances, updatedTemplates };
}

/**
 * 格式化规则的人类可读标签。
 */
export function formatRuleLabel(
  type: RecurringType,
  rule: RecurringRule
): string {
  switch (type) {
    case "daily":
      return "每天";
    case "weekly": {
      const w = rule as WeeklyRule;
      const DAYS = ["日", "一", "二", "三", "四", "五", "六"];
      return `每周${DAYS[w.dayOfWeek]}`;
    }
    case "monthly": {
      const m = rule as MonthlyRule;
      return `每月${m.day}号`;
    }
    case "yearly": {
      const y = rule as YearlyRule;
      return `每年${y.month}月${y.day}日`;
    }
    case "interval": {
      const i = rule as IntervalRule;
      return `每${i.every}天`;
    }
  }
}

export { DEFAULT_LEAD_DAYS };

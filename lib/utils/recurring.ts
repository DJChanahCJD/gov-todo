import type { RecurringTemplate } from "@/lib/types";

/**
 * 将 Date 格式化为本地 YYYY-MM-DD 字符串（避免 toISOString 的 UTC 偏移）。
 */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 根据 cron 简单表达式计算下一个需生成的截止时间。
 * 支持的格式：分 时 日 月 周
 * 仅处理简单预设场景（每日/每周/每月/每年），不实现完整 cron 解析。
 */
function nextDeadline(cron: string, from: Date): Date | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return null;

  const [minute, hour, day, month, weekday] = parts;

  const next = new Date(from);
  next.setSeconds(0, 0);
  next.setHours(parseInt(hour), parseInt(minute));

  // 每日 "0 0 * * *"
  if (day === "*" && month === "*" && weekday === "*") {
    if (next <= from) next.setDate(next.getDate() + 1);
    return next;
  }

  // 每月 "0 0 D * *"
  if (day !== "*" && month === "*" && weekday === "*") {
    const dayNum = parseInt(day);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return null;
    const d = new Date(from);
    d.setSeconds(0, 0);
    d.setHours(parseInt(hour), parseInt(minute));
    d.setDate(
      Math.min(dayNum, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())
    );
    if (d <= from) {
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

  // 每周 "0 0 * * W"
  if (day === "*" && month === "*" && weekday !== "*") {
    const targetDay = parseInt(weekday); // 0=Sun, 1=Mon, ...
    if (isNaN(targetDay) || targetDay < 0 || targetDay > 7) return null;
    const d = new Date(from);
    d.setSeconds(0, 0);
    d.setHours(parseInt(hour), parseInt(minute));
    const currentDay = d.getDay();
    const diff = (targetDay - currentDay + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    return d;
  }

  // 每年 "0 0 1 1 *"
  if (day !== "*" && month !== "*" && weekday === "*") {
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    if (isNaN(dayNum) || isNaN(monthNum)) return null;
    const d = new Date(from);
    d.setSeconds(0, 0);
    d.setHours(parseInt(hour), parseInt(minute));
    d.setMonth(monthNum - 1);
    d.setDate(
      Math.min(dayNum, new Date(d.getFullYear(), monthNum, 0).getDate())
    );
    if (d <= from) {
      d.setFullYear(d.getFullYear() + 1);
      d.setDate(
        Math.min(dayNum, new Date(d.getFullYear(), monthNum, 0).getDate())
      );
    }
    return d;
  }

  // 自定义 cron：尝试简单解析
  if (day !== "*" && month !== "*") {
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    if (!isNaN(dayNum) && !isNaN(monthNum)) {
      const d = new Date(from);
      d.setSeconds(0, 0);
      d.setHours(parseInt(hour), parseInt(minute));
      d.setMonth(monthNum - 1);
      d.setDate(
        Math.min(dayNum, new Date(d.getFullYear(), monthNum, 0).getDate())
      );
      if (d <= from) {
        d.setFullYear(d.getFullYear() + 1);
        d.setDate(
          Math.min(dayNum, new Date(d.getFullYear(), monthNum, 0).getDate())
        );
      }
      return d;
    }
  }

  return null;
}

/**
 * 计算模板当前应生成但尚未生成的周期。
 * 返回所有需要生成的截止时间列表。
 */
function pendingPeriods(template: RecurringTemplate, now: Date): Date[] {
  const results: Date[] = [];

  let from = template.lastGenerated
    ? new Date(
        Math.max(
          new Date(template.lastGenerated).getTime(),
          now.getTime() - 365 * 24 * 60 * 60 * 1000
        )
      )
    : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 最多回溯 90 天

  // 向前查找下一个周期，直到超过当前时间
  let safety = 0;
  let cursor = new Date(from);
  while (safety < 366) {
    const next = nextDeadline(template.cron, cursor);
    if (!next || next > now) break;
    // 避免重复
    if (
      results.length === 0 ||
      next.getTime() !== results[results.length - 1].getTime()
    ) {
      results.push(new Date(next));
    }
    cursor = new Date(next.getTime() + 60 * 1000); // 1分钟后继续
    safety++;
  }

  return results;
}

/**
 * 生成任务数据（不包含 id，由调用方生成）
 */
export interface GeneratedInstance {
  title: string;
  deadline: string;
  quadrant: import("@/lib/types").Quadrant;
  templateId: string;
}

/**
 * 扫描所有启用的模板，返回应生成的任务列表。
 */
export function generateInstances(
  templates: RecurringTemplate[],
  now = new Date()
): GeneratedInstance[] {
  const instances: GeneratedInstance[] = [];

  for (const template of templates) {
    if (!template.enabled) continue;
    const periods = pendingPeriods(template, now);
    for (const period of periods) {
      instances.push({
        title: template.title,
        deadline: toLocalDateStr(period),
        quadrant: template.quadrant,
        templateId: template.id,
      });
    }
    // 更新 lastGenerated 为最后一个周期的时间
    if (periods.length > 0) {
      const last = periods[periods.length - 1];
      template.lastGenerated = last.toISOString();
    }
  }

  return instances;
}

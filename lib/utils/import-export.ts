import type { Task, RecurringTemplate, ExportData } from "@/lib/types";
import { QUADRANT_LABELS } from "@/lib/types";
import { putTask, putTemplate, describeDbError } from "@/lib/db/db";
import { format, isValid, parseISO } from "date-fns";

/** 当前支持的导出数据版本 */
const EXPORT_VERSION = 1;

/** 导出数据为 JSON 文件下载 */
export function exportData(
  tasks: Task[],
  templates: RecurringTemplate[]
): void {
  const data: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    tasks,
    templates,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `gov-todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 导出全部任务为 CSV 文件下载 */
export function exportTasksCsv(tasks: Task[]): void {
  const headers = [
    "标题",
    "描述",
    "状态",
    "截止时间",
    "象限",
    "创建时间",
    "完成时间",
  ];
  const escapeCsv = (value: string | undefined): string =>
    `"${(value ?? "").replace(/"/g, '""')}"`;
  const formatDate = (value: string | undefined, pattern: string): string => {
    if (!value) return "";
    const date = parseISO(value);
    return isValid(date) ? format(date, pattern) : value;
  };
  const rows = tasks.map((task) => [
    task.title,
    task.description,
    task.completedAt ? "已归档" : "活跃",
    formatDate(task.deadline, "yyyy-MM-dd"),
    QUADRANT_LABELS[task.quadrant].subtitle,
    formatDate(task.createdAt, "yyyy-MM-dd HH:mm"),
    formatDate(task.completedAt, "yyyy-MM-dd HH:mm"),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gov-todo-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 导入 JSON 字符串中的数据，合并到 IndexedDB，返回各类型导入条数 */
export async function importData(
  jsonString: string
): Promise<{ tasks: number; templates: number }> {
  let data: ExportData;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error("JSON 解析失败，请检查文件格式");
  }

  if (
    !data ||
    typeof data.version !== "number" ||
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.templates)
  ) {
    throw new Error("文件格式不正确，缺少 tasks 或 templates 字段");
  }

  // 高版本数据可能含未知字段，直接导入会损坏本地库
  if (data.version > EXPORT_VERSION) {
    throw new Error(
      `备份版本（v${data.version}）高于当前程序（v${EXPORT_VERSION}），请使用最新版本页面后再导入`
    );
  }

  let taskCount = 0;
  let templateCount = 0;

  try {
    for (const task of data.tasks) {
      if (!task.id || !task.title || task.quadrant === undefined) continue;
      await putTask(task as Task);
      taskCount++;
    }

    for (const tpl of data.templates) {
      if (!tpl.id || !tpl.title || !tpl.type) continue;
      await putTemplate(tpl as RecurringTemplate);
      templateCount++;
    }
  } catch (e) {
    console.error("导入写入失败", e);
    throw new Error(describeDbError(e));
  }

  return { tasks: taskCount, templates: templateCount };
}

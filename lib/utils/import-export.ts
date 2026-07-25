import type { Task, RecurringTemplate, ExportData } from "@/lib/types";
import { putTask, putTemplate } from "@/lib/db/db";

/** 导出数据为 JSON 文件下载 */
export function exportData(
  tasks: Task[],
  templates: RecurringTemplate[]
): void {
  const data: ExportData = {
    version: 1,
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

  let taskCount = 0;
  let templateCount = 0;

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

  return { tasks: taskCount, templates: templateCount };
}

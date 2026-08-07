import { useEffect, useState, useCallback, useRef } from "react";
import { Repeat, Archive as ArchiveIcon, Plus, Download } from "lucide-react";
import { QuadrantGrid } from "@/components/QuadrantGrid";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { ArchiveDialog } from "@/components/ArchiveDialog";
import { TemplateDialog } from "@/components/TemplateDialog";
import { useTaskStore } from "@/stores/task-store";
import { useTemplateStore } from "@/stores/template-store";
import { generateInstances } from "@/lib/utils/recurring";
import {
  exportData,
  exportTasksCsv,
  importData,
} from "@/lib/utils/import-export";
import { putTemplate } from "@/lib/db/db";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { Task, Quadrant } from "@/lib/types";

/** 应用入口 */
export default function App() {
  const { tasks, loading, load: loadTasks, add: addTask } = useTaskStore();
  const { templates, load: loadTemplates } = useTemplateStore();

  const [addOpen, setAddOpen] = useState(false);
  const [addQuadrant, setAddQuadrant] = useState<Quadrant>(1);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTasks();
    loadTemplates();
  }, [loadTasks, loadTemplates]);

  /** 周期任务实例生成 */
  useEffect(() => {
    if (loading) return;
    if (templates.length === 0) return;

    const { instances, updatedTemplates } = generateInstances(templates);

    // 持久化更新后的模板（nextGenerateAt / lastGeneratedFor 变更）
    for (const tpl of updatedTemplates) {
      putTemplate(tpl).catch((e) => console.error("持久化模板失败", tpl.id, e));
    }

    for (const inst of instances) {
      const exists = tasks.some(
        (t) => t.templateId === inst.templateId && t.deadline === inst.deadline
      );
      if (!exists) {
        addTask({
          title: inst.title,
          deadline: inst.deadline,
          quadrant: inst.quadrant,
          templateId: inst.templateId,
        });
      }
    }
  }, [loading, templates]);

  /** 打开新建弹窗（指定象限） */
  const openAdd = useCallback((quadrant: number) => {
    setEditTask(null);
    setAddQuadrant(quadrant as Quadrant);
    setAddOpen(true);
  }, []);

  /** 打开编辑弹窗 */
  const openEdit = useCallback((task: Task) => {
    setEditTask(task);
    setAddOpen(true);
  }, []);

  /** 新建/编辑弹窗关闭 */
  const handleDialogClose = useCallback((open: boolean) => {
    setAddOpen(open);
    if (!open) setEditTask(null);
  }, []);

  /** 导出数据 */
  const handleExport = useCallback(() => {
    const currentTasks = useTaskStore.getState().tasks;
    const currentTemplates = useTemplateStore.getState().templates;
    exportData(currentTasks, currentTemplates);
    toast.success("数据已导出");
  }, []);

  /** 导出 CSV */
  const handleExportCsv = useCallback(() => {
    exportTasksCsv(useTaskStore.getState().tasks);
    toast.success("CSV 已导出");
  }, []);

  /** 导入数据 */
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /** 处理导入文件选择 */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const result = await importData(text);
        await loadTasks();
        await loadTemplates();
        toast.success(
          `导入完成：${result.tasks} 条任务，${result.templates} 条模板`
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "导入失败，请检查文件"
        );
      }

      // 重置 input，允许重复导入同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [loadTasks, loadTemplates]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <p className="stamp text-xs text-muted-foreground animate-pulse">
          LOADING
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* 极简顶栏 */}
      <header className="flex items-center justify-between h-12 px-3 border-b-[3px] border-border shrink-0">
        <span className="editorial-numeral text-lg font-black uppercase tracking-tight">
          工作清单
        </span>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setArchiveOpen(true)}
            title="归档"
            aria-label="归档"
            className="h-8 w-8 flex items-center justify-center border-[3px] border-border bg-background text-foreground hover:bg-secondary hover:text-secondary-foreground"
          >
            <ArchiveIcon className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setTemplateOpen(true)}
            title="周期任务"
            aria-label="周期任务"
            className="h-8 w-8 flex items-center justify-center border-[3px] border-border bg-background hover:bg-secondary hover:text-secondary-foreground"
          >
            <Repeat className="h-4 w-4" strokeWidth={2.5} />
          </button>
          {/* 导入/导出 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title="数据"
                aria-label="数据导入导出"
                className="h-8 w-8 flex items-center justify-center border-[3px] border-border bg-background hover:bg-secondary hover:text-secondary-foreground"
              >
                <Download className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-[3px] border-border"
            >
              <DropdownMenuItem onClick={handleExport}>
                导出 JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCsv}>
                导出 CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImport}>
                导入数据（仅 JSON）
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => openAdd(1)}
            title="新建任务"
            aria-label="新建任务"
            className="h-8 px-3 flex items-center space-x-1.5 border-[3px] border-border bg-foreground text-background font-black uppercase text-xs tracking-wide hover:bg-secondary hover:text-secondary-foreground"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            New
          </button>
        </div>
      </header>

      {/* 主内容：占满剩余屏幕 */}
      <main className="flex-1 min-h-0 p-2">
        <div className="h-full gazette-in">
          <QuadrantGrid
            tasks={tasks}
            onEdit={openEdit}
            onAddToQuadrant={openAdd}
          />
        </div>
      </main>

      <AddTaskDialog
        open={addOpen}
        onOpenChange={handleDialogClose}
        editTask={editTask}
        defaultQuadrant={addQuadrant}
      />

      <ArchiveDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        tasks={tasks}
      />

      <TemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} />

      {/* 隐藏文件选择器，用于导入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

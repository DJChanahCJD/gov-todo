import { useEffect, useState, useCallback, useRef } from "react";
import { Repeat, Archive as ArchiveIcon, Plus } from "lucide-react";
import { QuadrantGrid } from "@/components/QuadrantGrid";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { ArchiveSection } from "@/components/ArchiveSection";
import { TemplateDialog } from "@/components/TemplateDialog";
import { useTaskStore } from "@/stores/task-store";
import { useTemplateStore } from "@/stores/template-store";
import { generateInstances } from "@/lib/utils/recurring";
import { cn } from "@/lib/utils";
import type { Task, Quadrant } from "@/lib/types";

type View = "dashboard" | "archive";

/** 应用入口 */
export default function App() {
  const { tasks, loading, load: loadTasks, add: addTask } = useTaskStore();
  const {
    templates,
    load: loadTemplates,
    update: updateTemplate,
  } = useTemplateStore();
  const initializing = useRef(false);

  const [view, setView] = useState<View>("dashboard");
  const [addOpen, setAddOpen] = useState(false);
  const [addQuadrant, setAddQuadrant] = useState<Quadrant>(1);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);

  useEffect(() => {
    loadTasks();
    loadTemplates();
  }, [loadTasks, loadTemplates]);

  /** 周期任务实例生成 */
  useEffect(() => {
    if (initializing.current || loading) return;
    if (templates.length === 0) return;
    initializing.current = true;

    const instances = generateInstances(templates);
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

    for (const template of templates) {
      if (template.lastGenerated) {
        updateTemplate(template.id, { lastGenerated: template.lastGenerated });
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

  /** 侧栏导航分发 */
  /** 切换视图 */
  const toggleView = (v: View) =>
    setView((cur) => (cur === v ? "dashboard" : v));

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
        <button
          onClick={() => setView("dashboard")}
          className="editorial-numeral text-base font-black uppercase tracking-tight"
        >
          Eisenhower Matrix
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleView("archive")}
            aria-label="归档"
            className={cn(
              "h-8 w-8 flex items-center justify-center border-[3px] border-border neo-press",
              view === "archive"
                ? "bg-foreground text-background"
                : "bg-background text-foreground"
            )}
          >
            <ArchiveIcon className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setTemplateOpen(true)}
            aria-label="周期任务"
            className="h-8 w-8 flex items-center justify-center border-[3px] border-border bg-background neo-press"
          >
            <Repeat className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => openAdd(1)}
            aria-label="新建任务"
            className="h-8 px-3 flex items-center gap-1.5 border-[3px] border-border bg-foreground text-background font-black uppercase text-xs tracking-wide neo-press"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            New
          </button>
        </div>
      </header>

      {/* 主内容：占满剩余屏幕 */}
      <main className="flex-1 min-h-0 p-2">
        {view === "dashboard" ? (
          <div className="h-full gazette-in">
            <QuadrantGrid
              tasks={tasks}
              onEdit={openEdit}
              onAddToQuadrant={openAdd}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto neo-scroll gazette-in">
            <ArchiveSection tasks={tasks} />
          </div>
        )}
      </main>

      <AddTaskDialog
        open={addOpen}
        onOpenChange={handleDialogClose}
        editTask={editTask}
        defaultQuadrant={addQuadrant}
      />

      <TemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} />
    </div>
  );
}

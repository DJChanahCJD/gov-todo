import { useEffect, useState, useCallback, useRef } from "react";
import { RepeatIcon, Stamp } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { QuadrantGrid } from "@/components/QuadrantGrid";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { ArchiveSection } from "@/components/ArchiveSection";
import { TemplateDialog } from "@/components/TemplateDialog";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useTaskStore } from "@/stores/task-store";
import { useTemplateStore } from "@/stores/template-store";
import { generateInstances } from "@/lib/utils/recurring";
import type { Task, Quadrant } from "@/lib/types";

/** 计算自项目纪元起的期号 */
function issueNumber(): string {
  const epoch = new Date("2026-01-01").getTime();
  const now = Date.now();
  const days = Math.floor((now - epoch) / 86400000) + 1;
  return `№ ${String(days).padStart(4, "0")}`;
}

/** 应用入口 */
export default function App() {
  const { tasks, loading, load: loadTasks, add: addTask } = useTaskStore();
  const {
    templates,
    load: loadTemplates,
    update: updateTemplate,
  } = useTemplateStore();
  const initializing = useRef(false);

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
      // 避免重复生成（按 templateId + deadline 去重）
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

    // 更新模板的 lastGenerated
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="editorial-numeral text-7xl text-foreground/90">§</div>
        <p className="stamp text-xs text-muted-foreground animate-pulse">
          载入公报 · LOADING
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 公报报头 (masthead) ─────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-background border-b-2 border-foreground">
        <div className="mx-auto max-w-7xl px-6 pt-5 pb-3">
          {/* 顶部细栏：期号 / 日期 / 版本 */}
          <div className="flex items-center justify-between text-[10px] stamp text-muted-foreground mb-3">
            <span>{issueNumber()}</span>
            <span className="hidden sm:inline">PERSONAL · CONFIDENTIAL</span>
            <span>
              {format(new Date(), "yyyy年M月d日 EEEE", {
                locale: zhCN,
              }).toUpperCase()}
            </span>
          </div>

          {/* 主刊头 */}
          <div className="flex items-end justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1
                className="font-display leading-[0.85] tracking-tight"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
              >
                任务公报
              </h1>
              <p className="serif-italic text-sm text-muted-foreground mt-1.5">
                The Official Desk Gazette — 以分管之事，逐日督行
              </p>
            </div>

            {/* 右栏工具组 */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplateOpen(true)}
                  className="border-2 border-foreground shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all font-mono text-xs uppercase tracking-wider"
                >
                  <RepeatIcon className="h-3.5 w-3.5" />
                  <span className="ml-1.5">周期模板</span>
                </Button>
                <ThemeToggle />
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-[10px] stamp text-muted-foreground">
                <Stamp className="h-3 w-3 text-stamp-red" />
                <span>四象限 · 拖拽归位 · 印章存档</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── 章节导引条 ─────────────────────────────────────── */}
      <div className="border-b border-foreground/30 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-1.5 flex items-center justify-between text-[10px] stamp text-muted-foreground">
          <span>I. 重要且紧急</span>
          <span>II. 不重要紧急</span>
          <span>III. 重要不紧急</span>
          <span>IV. 不重要不紧急</span>
        </div>
      </div>

      {/* ── 主内容 ─────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-10">
        <section className="gazette-in" style={{ animationDelay: "0.05s" }}>
          <QuadrantGrid
            tasks={tasks}
            onEdit={openEdit}
            onAddToQuadrant={openAdd}
          />
        </section>

        <section className="gazette-in" style={{ animationDelay: "0.15s" }}>
          <ArchiveSection tasks={tasks} />
        </section>
      </main>

      {/* ── 页脚条 ─────────────────────────────────────────── */}
      <footer className="border-t-2 border-foreground mt-8">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between text-[10px] stamp text-muted-foreground">
          <span>END OF BULLETIN</span>
          <span className="serif-italic normal-case tracking-normal text-xs">
            — 暮鼓而息，明日再审 —
          </span>
          <span>{issueNumber()}</span>
        </div>
      </footer>

      {/* 新建/编辑弹窗 */}
      <AddTaskDialog
        open={addOpen}
        onOpenChange={handleDialogClose}
        editTask={editTask}
        defaultQuadrant={addQuadrant}
      />

      {/* 模板弹窗 */}
      <TemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} />
    </div>
  );
}

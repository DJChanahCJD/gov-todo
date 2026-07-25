import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import type { Task, Quadrant } from "@/lib/types";
import { QUADRANT_LABELS } from "@/lib/types";
import { selectActiveByQuadrant, useTaskStore } from "@/stores/task-store";
import { TaskItem } from "@/components/TaskItem";
import { cn } from "@/lib/utils";

/** 象限视觉配置 */
const QUADRANT_CONFIG: Record<
  Quadrant,
  {
    numeral: string;
    cardBg: string;
    headerBg: string;
    titleColor: string;
    bodyOpacity: string;
    itemBg: string;
    badge?: string;
  }
> = {
  0: {
    numeral: "I",
    cardBg: "bg-background",
    headerBg: "",
    titleColor: "text-foreground",
    bodyOpacity: "",
    itemBg: "bg-card",
    badge: "bg-destructive text-destructive-foreground",
  },
  1: {
    numeral: "II",
    cardBg: "bg-secondary",
    headerBg: "",
    titleColor: "text-secondary-foreground",
    bodyOpacity: "",
    itemBg: "bg-background",
  },
  2: {
    numeral: "III",
    cardBg: "bg-muted quadrant-bg-1",
    headerBg: "",
    titleColor: "text-foreground",
    bodyOpacity: "",
    itemBg: "bg-card",
  },
  3: {
    numeral: "IV",
    cardBg: "bg-muted/60",
    headerBg: "",
    titleColor: "text-muted-foreground",
    bodyOpacity: "opacity-60",
    itemBg: "bg-card",
  },
};

interface QuadrantCardProps {
  quadrant: Quadrant;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onAdd: () => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}

/** 单个象限卡片 */
export function QuadrantCard({
  quadrant,
  tasks,
  onEdit,
  onAdd,
  onDragStart,
}: QuadrantCardProps) {
  const { moveQuadrant } = useTaskStore();
  const [dragOver, setDragOver] = useState(false);
  const cfg = QUADRANT_CONFIG[quadrant];
  const { title } = QUADRANT_LABELS[quadrant];
  const activeTasks = selectActiveByQuadrant(tasks, quadrant);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const taskId = e.dataTransfer.getData("text/plain");
      if (taskId) moveQuadrant(taskId, quadrant);
    },
    [moveQuadrant, quadrant]
  );

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col h-full min-h-0 gap-2 p-3 border-[3px] border-border overflow-hidden transition-all duration-150",
        cfg.cardBg,
        dragOver && "ring-2 ring-secondary"
      )}
    >
      {/* 标题栏：罗马序号 + 英文短标题 + 加号 */}
      <header className="flex items-center justify-between border-b-[3px] border-border pb-2">
        <div className="flex items-baseline gap-2.5">
          <span className="editorial-numeral text-base text-muted-foreground">
            {cfg.numeral}
          </span>
          <h3
            className={cn(
              "font-display text-lg font-black uppercase tracking-tight leading-none",
              cfg.titleColor
            )}
          >
            {title}
          </h3>
          {cfg.badge && (
            <span
              className={cn(
                "h-6 w-6 flex items-center justify-center font-black text-sm",
                cfg.badge
              )}
            >
              !
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          aria-label="Add task"
          className="h-7 w-7 flex items-center justify-center border-[3px] border-border bg-background neo-press"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </header>

      {/* 任务列表 */}
      <div
        className={cn(
          "flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto neo-scroll pr-0.5",
          cfg.bodyOpacity
        )}
      >
        {activeTasks.length === 0
          ? null
          : activeTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDragStart={onDragStart}
                itemBg={cfg.itemBg}
              />
            ))}
      </div>
    </section>
  );
}

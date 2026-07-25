import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import type { Task, Quadrant } from "@/lib/types";
import { QUADRANT_LABELS } from "@/lib/types";
import { selectActiveByQuadrant, useTaskStore } from "@/stores/task-store";
import { TaskItem } from "@/components/TaskItem";
import { cn } from "@/lib/utils";

/** 象限 → 章号（依网格展示顺序：左上→右上→左下→右下） */
const SECTION_NUMERAL: Record<Quadrant, string> = {
  0: "I",
  2: "II",
  1: "III",
  3: "IV",
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

  const { title, subtitle } = QUADRANT_LABELS[quadrant];

  const activeTasks = selectActiveByQuadrant(tasks, quadrant);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const taskId = e.dataTransfer.getData("text/plain");
      if (taskId) {
        moveQuadrant(taskId, quadrant);
      }
    },
    [moveQuadrant, quadrant]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col border-2 border-foreground bg-card p-5 min-h-[260px]",
        "shadow-brutal transition-all duration-150 overflow-hidden",
        "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal-lg",
        dragOver &&
          "translate-x-[-2px] translate-y-[-2px] shadow-brutal-lg border-stamp-red"
      )}
    >
      {/* 巨型章号背景数字 */}
      <span
        className="editorial-numeral pointer-events-none select-none absolute -right-2 -top-4 text-[9rem] text-foreground/[0.06] dark:text-foreground/[0.05]"
        aria-hidden
      >
        {SECTION_NUMERAL[quadrant]}
      </span>

      {/* 标题栏 */}
      <div className="relative flex items-start justify-between gap-3 mb-4 pb-3 border-b border-foreground/20">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="editorial-numeral text-xs text-stamp-red">
              {SECTION_NUMERAL[quadrant]}
            </span>
            <span className="stamp text-[10px] text-muted-foreground">
              § CHAPTER
            </span>
          </div>
          <h3 className="font-display text-lg leading-none tracking-tight truncate">
            {title}
          </h3>
          <p className="serif-italic text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="editorial-numeral text-2xl text-foreground tabular-nums">
            {String(activeTasks.length).padStart(2, "0")}
          </span>
          <button
            onClick={onAdd}
            className="h-7 w-7 flex items-center justify-center border-2 border-foreground shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none bg-background hover:bg-foreground hover:text-background transition-all"
            title="添加任务"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="relative flex-1 space-y-2">
        {activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-1.5">
            <div className="editorial-numeral text-3xl text-foreground/15">
              —
            </div>
            <p className="serif-italic text-xs text-muted-foreground/60">
              尚无丁务 可审
            </p>
          </div>
        ) : (
          activeTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}

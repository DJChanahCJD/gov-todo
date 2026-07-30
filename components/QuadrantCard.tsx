import { useState, useCallback } from "react";
import { Plus, Flame, Calendar, Users, Parasol } from "lucide-react";
import type { Task, Quadrant } from "@/lib/types";
import { QUADRANT_LABELS } from "@/lib/types";
import { selectActiveByQuadrant, useTaskStore } from "@/stores/task-store";
import { TaskItem } from "@/components/TaskItem";
import { cn } from "@/lib/utils";

/** 象限视觉配置 */
const QUADRANT_CONFIG: Record<
  Quadrant,
  {
    icon: React.ComponentType<{
      className?: string;
      style?: React.CSSProperties;
      strokeWidth?: number;
    }>;
    cardBg: string;
    headerBg: string;
    titleColor: string;
    bodyOpacity: string;
    itemBg: string;
    accentColor: string;
  }
> = {
  0: {
    icon: Flame,
    cardBg: "bg-background",
    headerBg: "",
    titleColor: "text-foreground",
    bodyOpacity: "",
    itemBg: "bg-card",
    accentColor: "#ef4444",
  },
  1: {
    icon: Calendar,
    cardBg: "bg-background",
    headerBg: "",
    titleColor: "text-foreground",
    bodyOpacity: "",
    itemBg: "bg-card",
    accentColor: "#22c55e",
  },
  2: {
    icon: Users,
    cardBg: "bg-background",
    headerBg: "",
    titleColor: "text-foreground",
    bodyOpacity: "",
    itemBg: "bg-card",
    accentColor: "#3b82f6",
  },
  3: {
    icon: Parasol,
    cardBg: "bg-background",
    headerBg: "",
    titleColor: "text-muted-foreground",
    bodyOpacity: "opacity-60",
    itemBg: "bg-card",
    accentColor: "#9ca3af",
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
  const { title, subtitle } = QUADRANT_LABELS[quadrant];
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
        "relative flex flex-col h-full min-h-0 space-y-2 p-3 border-[3px] border-border overflow-hidden transition-all duration-150",
        cfg.cardBg,
        dragOver && "ring-2 ring-secondary"
      )}
      style={{ backgroundColor: `${cfg.accentColor}10` }}
    >
      {/* 标题栏：图标 + 英文短标题 + 加号 */}
      <header className="flex items-center justify-between border-b-[3px] border-border pb-2">
        <div className="flex items-center space-x-2.5">
          <cfg.icon
            className="h-5 w-5"
            style={{ color: cfg.accentColor }}
            strokeWidth={2.5}
          />
          <h3
            className={cn(
              "font-display text-lg font-black uppercase tracking-tight leading-none",
              cfg.titleColor
            )}
          >
            {title}
          </h3>
          <span className="text-xs text-muted-foreground font-normal normal-case tracking-normal">
            {subtitle}
          </span>
        </div>
        <button
          onClick={onAdd}
          title="添加任务"
          aria-label="Add task"
          className="h-7 w-7 flex items-center justify-center border-[3px] border-border bg-background hover:bg-secondary hover:text-secondary-foreground"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </header>

      {/* 任务列表 */}
      <div
        className={cn(
          "flex-1 min-h-0 flex flex-col space-y-1.5 overflow-y-auto neo-scroll pr-0.5",
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
                accentColor={cfg.accentColor}
              />
            ))}
      </div>
    </section>
  );
}

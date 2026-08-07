import { useCallback } from "react";
import { Pin, PinOff, Clock, Trash2 } from "lucide-react";
import { differenceInCalendarDays, format, isToday, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Task } from "@/lib/types";
import { useTaskStore } from "@/stores/task-store";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onView?: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  onToggleComplete?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  archived?: boolean;
  /** 任务条背景（依所在象限而定） */
  itemBg?: string;
  /** 象限强调色 */
  accentColor?: string;
}

/** 格式化截止时间显示 */
function formatDeadline(deadline: string): {
  text: string;
  state: "overdue" | "urgent" | "normal";
  label: string;
  title: string;
} {
  const date = parseISO(deadline);
  const now = new Date();
  const days = differenceInCalendarDays(date, now);
  const crossYear = date.getFullYear() !== now.getFullYear();
  const md = crossYear
    ? format(date, "yyyy年M月d日", { locale: zhCN })
    : format(date, "M月d日", { locale: zhCN });
  const title = format(date, "yyyy年M月d日", { locale: zhCN });

  if (days < 0)
    return { text: md, state: "overdue", label: "逾期 OVERDUE", title };
  if (days === 0)
    return { text: "今天", state: "urgent", label: "DUE TODAY", title };
  if (days === 1)
    return { text: "明天", state: "urgent", label: "DUE TOMORROW", title };
  if (days === 2)
    return { text: md, state: "urgent", label: "DEADLINE SOON", title };
  return { text: md, state: "normal", label: "DEADLINE", title };
}

/** 单个活跃任务条 */
export function TaskItem({
  task,
  onEdit,
  onView,
  onDragStart,
  onToggleComplete,
  onDelete,
  archived = false,
  itemBg = "bg-card",
  accentColor,
}: TaskItemProps) {
  const { togglePin, toggleComplete } = useTaskStore();
  const doneToday = !!task.completedAt && isToday(parseISO(task.completedAt));
  const isCompleted = archived ? !!task.completedAt : doneToday;
  const deadlineInfo = task.deadline ? formatDeadline(task.deadline) : null;

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", task.id);
      onDragStart?.(e, task);
    },
    [task, onDragStart]
  );

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart ? handleDragStart : undefined}
      onClick={() => {
        const onClick = onView ?? onEdit;
        onClick?.(task);
      }}
      className={cn(
        "group flex items-center justify-between w-full space-x-2 border-[3px] border-border p-2 cursor-pointer transition-colors",
        itemBg,
        "hover:text-secondary-foreground hover-accent",
        task.pinned && "ring-2 ring-secondary ring-offset-[-3px]",
        isCompleted && "opacity-60"
      )}
      style={
        accentColor
          ? ({
              "--hover-bg": `${accentColor}30`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {/* 左：勾选 + 标题 */}
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        <button
          title={isCompleted ? "取消完成" : "标记完成"}
          aria-label={isCompleted ? "取消完成" : "标记完成"}
          type="button"
          role="checkbox"
          aria-checked={isCompleted}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleComplete) onToggleComplete(task);
            else toggleComplete(task.id);
          }}
          className={cn(
            "h-5 w-5 shrink-0 flex items-center justify-center border-[3px] border-border transition-colors cursor-pointer",
            isCompleted ? "bg-primary text-primary-foreground" : "bg-card"
          )}
        >
          {isCompleted && (
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <h4
          className={cn(
            "font-bold text-sm truncate flex-1",
            isCompleted && "line-through",
            task.pinned && "font-black"
          )}
        >
          {task.title}
        </h4>
      </div>

      {/* 右：截止 + 操作 */}
      <div className="flex items-center space-x-1.5 shrink-0">
        {deadlineInfo && (
          <span
            className={cn(
              "flex items-center space-x-1 px-1.5 py-0.5 border-[3px] border-border text-[10px] font-black uppercase tracking-wide stamp",
              isCompleted && "opacity-60",
              deadlineInfo.state === "overdue" &&
                "bg-destructive text-destructive-foreground",
              deadlineInfo.state === "urgent" &&
                "bg-warning text-warning-foreground",
              deadlineInfo.state === "normal" &&
                "bg-background text-muted-foreground"
            )}
            title={deadlineInfo.title}
          >
            <Clock className="h-2.5 w-2.5" />
            {deadlineInfo.text}
          </span>
        )}

        {onDelete ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            title="删除"
            aria-label="删除"
            className="h-7 w-7 flex items-center justify-center border-[3px] border-border bg-background text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePin(task.id);
            }}
            title={task.pinned ? "取消置顶" : "置顶"}
            aria-label={task.pinned ? "取消置顶" : "置顶"}
            className={cn(
              "h-7 w-7 flex items-center justify-center border-[3px] border-border transition-colors",
              task.pinned
                ? "bg-secondary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-secondary hover:text-primary-foreground"
            )}
          >
            {task.pinned ? (
              <Pin className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <PinOff className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

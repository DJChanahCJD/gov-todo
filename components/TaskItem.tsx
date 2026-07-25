import { useCallback } from "react";
import { Pin, PinOff, Clock, Pencil } from "lucide-react";
import { differenceInCalendarDays, format, isToday, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Task } from "@/lib/types";
import { useTaskStore } from "@/stores/task-store";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  /** 任务条背景（依所在象限而定） */
  itemBg?: string;
}

/** 格式化截止时间显示 */
function formatDeadline(deadline: string): {
  text: string;
  state: "overdue" | "urgent" | "normal";
  label: string;
} {
  const date = parseISO(deadline);
  const now = new Date();
  const days = differenceInCalendarDays(date, now);
  const crossYear = date.getFullYear() !== now.getFullYear();
  const md = crossYear
    ? format(date, "yyyy年M月d日", { locale: zhCN })
    : format(date, "M月d日", { locale: zhCN });

  if (days < 0) return { text: md, state: "overdue", label: "逾期 OVERDUE" };
  if (days === 0) return { text: "今天", state: "urgent", label: "DUE TODAY" };
  if (days === 1)
    return { text: "明天", state: "urgent", label: "DUE TOMORROW" };
  if (days === 2) return { text: md, state: "urgent", label: "DEADLINE SOON" };
  return { text: md, state: "normal", label: "DEADLINE" };
}

/** 单个活跃任务条 */
export function TaskItem({
  task,
  onEdit,
  onDragStart,
  itemBg = "bg-card",
}: TaskItemProps) {
  const { togglePin, toggleComplete } = useTaskStore();
  const doneToday = !!task.completedAt && isToday(parseISO(task.completedAt));
  const deadlineInfo = task.deadline ? formatDeadline(task.deadline) : null;

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", task.id);
      onDragStart(e, task);
    },
    [task, onDragStart]
  );

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => toggleComplete(task.id)}
      className={cn(
        "group flex items-center justify-between w-full gap-2 border-[3px] border-border p-2 cursor-pointer transition-colors",
        itemBg,
        "hover:bg-secondary hover:text-secondary-foreground",
        task.pinned && "ring-2 ring-secondary ring-offset-[-3px]",
        doneToday && "opacity-60"
      )}
    >
      {/* 左：勾选 + 标题 */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          aria-hidden
          className={cn(
            "h-5 w-5 shrink-0 flex items-center justify-center border-[3px] border-border transition-colors",
            doneToday ? "bg-primary text-primary-foreground" : "bg-transparent"
          )}
        >
          {doneToday && (
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
        </span>

        <h4
          className={cn(
            "font-bold text-sm truncate flex-1",
            "group-hover:line-through",
            doneToday && "line-through",
            task.pinned && "font-black"
          )}
        >
          {task.title}
        </h4>
      </div>

      {/* 右：截止 + 操作 */}
      <div className="flex items-center gap-1.5 shrink-0">
        {deadlineInfo && (
          <span
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 border-[3px] border-border text-[10px] font-black uppercase tracking-wide stamp",
              doneToday && "opacity-60",
              deadlineInfo.state === "overdue" &&
                "bg-destructive text-destructive-foreground",
              deadlineInfo.state === "urgent" &&
                "bg-warning text-warning-foreground",
              deadlineInfo.state === "normal" &&
                "bg-background text-muted-foreground"
            )}
            title={deadlineInfo.label}
          >
            <Clock className="h-2.5 w-2.5" />
            {deadlineInfo.text}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePin(task.id);
          }}
          aria-label={task.pinned ? "取消置顶" : "置顶"}
          className={cn(
            "h-7 w-7 flex items-center justify-center border-[3px] border-border transition-colors",
            task.pinned
              ? "bg-secondary text-primary"
              : "bg-background text-muted-foreground hover:bg-secondary hover:text-primary"
          )}
        >
          {task.pinned ? (
            <Pin className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <PinOff className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          aria-label="编辑"
          className="h-7 w-7 flex items-center justify-center border-[3px] border-border bg-background text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

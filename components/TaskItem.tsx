import { useState, useCallback } from "react";
import { Pin, PinOff, Clock, Pencil, GripVertical } from "lucide-react";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Task } from "@/lib/types";
import { useTaskStore } from "@/stores/task-store";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}

/** 格式化截止时间显示 */
function formatDeadline(deadline: string): {
  text: string;
  urgent: boolean;
  label: string;
} {
  const date = parseISO(deadline);
  const urgent = isPast(date) && !isToday(date);
  if (isToday(date)) return { text: "今天", urgent: false, label: "DUE TODAY" };
  if (isTomorrow(date))
    return { text: "明天", urgent: false, label: "DUE TOMORROW" };
  return {
    text: format(date, "M月d日", { locale: zhCN }),
    urgent,
    label: urgent ? "逾期 OVERDUE" : "DEADLINE",
  };
}

/** 单个活跃任务卡片 */
export function TaskItem({ task, onEdit, onDragStart }: TaskItemProps) {
  const { togglePin, complete } = useTaskStore();
  const [confirming, setConfirming] = useState(false);

  const deadlineInfo = task.deadline ? formatDeadline(task.deadline) : null;

  const handleComplete = useCallback(() => {
    complete(task.id);
    setConfirming(false);
  }, [complete, task.id]);

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
      className={cn(
        "group flex items-center gap-2 rounded-md border bg-card px-3 py-2.5",
        "cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors",
        task.pinned && "border-amber-500/30 bg-amber-500/5"
      )}
    >
      {/* 拖拽手柄 */}
      <div className="cursor-grab text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0">
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* 完成按钮 */}
      {confirming ? (
        <div className="flex items-center gap-1 shrink-0 stamp-in">
          <button
            onClick={handleComplete}
            className="h-5 w-5 border-2 border-foreground bg-foreground text-background flex items-center justify-center hover:bg-stamp-red hover:border-stamp-red transition-colors"
            title="确认完成"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="h-5 w-5 border-2 border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
            title="取消"
          >
            <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
              <path
                d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="h-5 w-5 border-2 border-foreground shrink-0 hover:bg-stamp-red/80 hover:border-stamp-red transition-colors"
          title="完成任务"
        />
      )}

      {/* 标题 */}
      <span
        className={cn(
          "flex-1 text-sm truncate font-medium",
          task.pinned && "font-semibold"
        )}
      >
        {task.title}
      </span>

      {/* 截止时间 */}
      {deadlineInfo && (
        <span
          className={cn(
            "flex items-center gap-1 shrink-0 px-1.5 py-0.5 border text-[10px] font-mono uppercase tracking-wider stamp",
            deadlineInfo.urgent
              ? "border-stamp-red text-stamp-red bg-stamp-red/10"
              : "border-foreground/30 text-muted-foreground"
          )}
          title={deadlineInfo.label}
        >
          <Clock className="h-3 w-3" />
          {deadlineInfo.text}
        </span>
      )}

      {/* 操作按钮 - hover 显示 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => togglePin(task.id)}
          className={cn(
            "h-6 w-6 flex items-center justify-center border border-transparent hover:border-foreground hover:bg-foreground hover:text-background transition-all",
            task.pinned &&
              "text-amber-600 dark:text-amber-400 border-amber-500/40"
          )}
          title={task.pinned ? "取消置顶" : "置顶"}
        >
          {task.pinned ? (
            <Pin className="h-3.5 w-3.5" />
          ) : (
            <PinOff className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={() => onEdit(task)}
          className="h-6 w-6 flex items-center justify-center border border-transparent hover:border-foreground hover:bg-foreground hover:text-background transition-all"
          title="编辑"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

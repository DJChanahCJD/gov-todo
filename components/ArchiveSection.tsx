import { useState } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Archive, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import type { Task } from "@/lib/types";
import { useTaskStore, selectArchived } from "@/stores/task-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ArchiveSectionProps {
  tasks: Task[];
}

/** 将日期归类为分组标签 */
function dateGroupLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "今天";
  if (isYesterday(date)) return "昨天";
  return format(date, "M月d日", { locale: zhCN });
}

/** 按完成日期分组 */
function groupByDate(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.completedAt) continue;
    const label = dateGroupLabel(task.completedAt);
    const list = map.get(label);
    if (list) list.push(task);
    else map.set(label, [task]);
  }
  return map;
}

/** 归档区域 */
export function ArchiveSection({ tasks }: ArchiveSectionProps) {
  const { remove } = useTaskStore();
  const [expanded, setExpanded] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const archived = selectArchived(tasks);
  const groups = groupByDate(archived);

  if (archived.length === 0) return null;

  return (
    <>
      <div className="border-t-[3px] border-border pt-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className="group flex items-center gap-3 w-full"
        >
          <span className="h-9 w-9 flex items-center justify-center border-[3px] border-border bg-foreground text-background shadow-brutal-sm">
            <Archive className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-black uppercase tracking-tight">
            已归档卷宗
          </span>
          <span className="stamp text-[10px] text-muted-foreground hidden sm:inline">
            THE ARCHIVE
          </span>
          <span className="ml-auto stamp text-[10px] font-bold border-[3px] border-border px-2 py-1 bg-secondary text-secondary-foreground">
            {String(archived.length).padStart(2, "0")} ENTRIES
          </span>
          {expanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>

        {expanded && (
          <div className="mt-6 space-y-6">
            {Array.from(groups.entries()).map(([label, items]) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-3 pb-2 border-b-[3px] border-border">
                  <h4 className="font-black text-sm uppercase tracking-wide">
                    {label}
                  </h4>
                  <span className="stamp text-[10px] text-muted-foreground">
                    {items.length} ITEMS
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 border-[3px] border-border bg-card p-2"
                    >
                      <span className="w-5 h-5 flex items-center justify-center border-[3px] border-border bg-secondary text-primary shrink-0">
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span
                        className={cn(
                          "flex-1 min-w-0 text-sm text-muted-foreground truncate",
                          task.completedAt &&
                            isToday(parseISO(task.completedAt)) &&
                            "line-through"
                        )}
                      >
                        {task.title}
                      </span>
                      <span className="stamp text-[10px] text-muted-foreground/70 shrink-0 hidden sm:inline">
                        {task.completedAt &&
                          format(parseISO(task.completedAt), "HH:mm")}
                      </span>
                      <button
                        onClick={() => setDeleteTarget(task)}
                        aria-label="删除"
                        className="h-7 w-7 flex items-center justify-center border-[3px] border-border bg-background text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除任务「{deleteTarget?.title}」，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) remove(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

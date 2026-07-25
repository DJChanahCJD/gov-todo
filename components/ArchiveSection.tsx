import { useState } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Trash2,
  FileText,
} from "lucide-react";
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

/** 归档区域（四象限下方） */
export function ArchiveSection({ tasks }: ArchiveSectionProps) {
  const { remove } = useTaskStore();
  const [expanded, setExpanded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const archived = selectArchived(tasks);
  const groups = groupByDate(archived);

  if (archived.length === 0) return null;

  return (
    <>
      <div className="border-t-2 border-foreground pt-5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="group flex items-center gap-3 text-sm text-foreground hover:text-stamp-red transition-colors w-full"
        >
          <span className="editorial-numeral text-lg leading-none text-muted-foreground">
            §V
          </span>
          <Archive className="h-4 w-4" />
          <span className="font-display text-base tracking-tight">
            已归档卷宗
          </span>
          <span className="serif-italic text-xs text-muted-foreground">
            The Archive
          </span>
          <span className="text-xs ml-auto stamp text-muted-foreground">
            {String(archived.length).padStart(2, "0")} ENTRIES
          </span>
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {expanded && (
          <div className="mt-5 space-y-5">
            {Array.from(groups.entries()).map(([label, items]) => (
              <div key={label}>
                <div className="flex items-baseline gap-3 mb-2.5 pb-1.5 border-b border-foreground/20">
                  <h4 className="serif-italic text-sm text-foreground not-italic font-semibold">
                    {label}
                  </h4>
                  <span className="stamp text-[10px] text-muted-foreground">
                    {items.length} ITEMS
                  </span>
                  <span className="flex-1 border-t border-dashed border-foreground/15 mx-1 translate-y-[-2px]" />
                </div>
                <div className="space-y-1.5">
                  {items.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 border-l-2 border-foreground/20 hover:border-stamp-red pl-3 pr-2 py-1.5 hover:bg-secondary/40 transition-all"
                    >
                      <span className="w-4 h-4 border-2 border-foreground/30 bg-stamp-green/10 flex items-center justify-center shrink-0">
                        <svg
                          className="h-2.5 w-2.5 text-muted-foreground/50"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                        <span className="text-sm text-muted-foreground truncate font-mono">
                          {task.title}
                        </span>
                      </span>
                      <span className="stamp text-[10px] text-muted-foreground/60 shrink-0 hidden sm:inline">
                        {task.completedAt &&
                          format(parseISO(task.completedAt), "HH:mm")}
                      </span>
                      <button
                        onClick={() => setDeleteTarget(task)}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center border border-transparent hover:border-foreground hover:bg-destructive hover:text-destructive-foreground transition-all"
                        title="删除"
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

      {/* 删除确认 */}
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

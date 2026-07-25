import { useState, useMemo } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Archive, Trash2, Search } from "lucide-react";
import type { Task } from "@/lib/types";
import { useTaskStore, selectArchived } from "@/stores/task-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface ArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

/** 归档弹窗 */
export function ArchiveDialog({
  open,
  onOpenChange,
  tasks,
}: ArchiveDialogProps) {
  const { remove } = useTaskStore();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const archived = useMemo(() => selectArchived(tasks), [tasks]);

  const filtered = useMemo(() => {
    if (!search.trim()) return archived;
    const q = search.trim().toLowerCase();
    return archived.filter((t) => t.title.toLowerCase().includes(q));
  }, [archived, search]);

  const groups = groupByDate(filtered);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" strokeWidth={2.5} />
              <span>归档（{archived.length}）</span>
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索归档任务…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {archived.length === 0 ? "暂无归档任务" : "无匹配结果"}
              </p>
            ) : (
              <div className="space-y-4">
                {Array.from(groups.entries()).map(([label, items]) => (
                  <div key={label}>
                    <div className="flex items-center gap-3 mb-2 pb-1 border-b-[3px] border-border">
                      <h4 className="font-black text-sm uppercase tracking-wide">
                        {label}
                      </h4>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((task) => (
                        <div
                          key={task.id}
                          className="group flex items-center gap-2 border-[3px] border-border bg-card p-2"
                        >
                          <span className="flex-1 min-w-0 text-sm text-muted-foreground truncate">
                            {task.title}
                          </span>
                          <span className="stamp text-[10px] text-muted-foreground/70 shrink-0">
                            {task.completedAt &&
                              format(parseISO(task.completedAt), "HH:mm")}
                          </span>
                          <button
                            onClick={() => setDeleteTarget(task)}
                            title="删除"
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
          </ScrollArea>
        </DialogContent>
      </Dialog>

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

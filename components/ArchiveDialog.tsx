import { useState, useMemo } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Archive, Search } from "lucide-react";
import type { Task, Quadrant } from "@/lib/types";
import { useTaskStore, selectArchived } from "@/stores/task-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { TaskItem } from "@/components/TaskItem";
import { AddTaskDialog } from "@/components/AddTaskDialog";

/** 象限强调色（与 QuadrantCard 一致） */
const QUADRANT_CONFIG: Record<Quadrant, { accentColor: string }> = {
  0: { accentColor: "#ef4444" },
  1: { accentColor: "#22c55e" },
  2: { accentColor: "#3b82f6" },
  3: { accentColor: "#9ca3af" },
};

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
  const { remove, toggleComplete } = useTaskStore();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Task | null>(null);
  const [viewTarget, setViewTarget] = useState<Task | null>(null);

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
        <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Archive className="h-5 w-5" strokeWidth={2.5} />
              <span>归档（{archived.length}）</span>
            </DialogTitle>
          </DialogHeader>

          <div className="relative shrink-0">
            <Input
              placeholder="搜索归档任务…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto neo-scroll">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {archived.length === 0 ? "暂无归档任务" : "无匹配结果"}
              </p>
            ) : (
              <div className="space-y-4">
                {Array.from(groups.entries()).map(([label, items]) => (
                  <div key={label}>
                    <div className="flex items-center space-x-3 mb-2 pb-1 border-b-[3px] border-border">
                      <h4 className="font-black text-sm uppercase tracking-wide">
                        {label}
                      </h4>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          archived
                          onView={setViewTarget}
                          onToggleComplete={setRestoreTarget}
                          onDelete={setDeleteTarget}
                          itemBg="bg-card"
                          accentColor={
                            QUADRANT_CONFIG[task.quadrant].accentColor
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddTaskDialog
        open={!!viewTarget}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null);
        }}
        editTask={viewTarget}
        readOnly
        dialogTitle="归档任务详情"
        onRestore={(task) => setRestoreTarget(task)}
        onDelete={(task) => setDeleteTarget(task)}
      />

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

      <AlertDialog
        open={!!restoreTarget}
        onOpenChange={() => setRestoreTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认撤回？</AlertDialogTitle>
            <AlertDialogDescription>
              将任务「{restoreTarget?.title}」撤回到四象限任务列表。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restoreTarget) toggleComplete(restoreTarget.id);
                setRestoreTarget(null);
              }}
            >
              撤回
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

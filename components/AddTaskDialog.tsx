import { useState, useEffect } from "react";
import { isValid, parseISO } from "date-fns";
import { Flame, Calendar, Users, Parasol } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Task, Quadrant } from "@/lib/types";
import { QUADRANT_LABELS } from "@/lib/types";
import { useTaskStore } from "@/stores/task-store";
import { cn } from "@/lib/utils";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 编辑模式传入已有任务 */
  editTask?: Task | null;
  /** 预设象限（新建时） */
  defaultQuadrant?: Quadrant;
}

/** 象限视觉配置 */
const QUADRANT_CONFIG: Record<
  Quadrant,
  {
    icon: React.ComponentType<{
      className?: string;
      style?: React.CSSProperties;
      strokeWidth?: number;
    }>;
    accentColor: string;
  }
> = {
  0: { icon: Flame, accentColor: "#ef4444" },
  1: { icon: Calendar, accentColor: "#22c55e" },
  2: { icon: Users, accentColor: "#3b82f6" },
  3: { icon: Parasol, accentColor: "#9ca3af" },
};

/** 新建/编辑任务弹窗 */
export function AddTaskDialog({
  open,
  onOpenChange,
  editTask,
  defaultQuadrant = 1,
}: AddTaskDialogProps) {
  const { add, update } = useTaskStore();

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deadlineError, setDeadlineError] = useState("");
  const [description, setDescription] = useState("");
  const [quadrant, setQuadrant] = useState<Quadrant>(defaultQuadrant);
  const [saving, setSaving] = useState(false);

  const isEdit = !!editTask;

  /** 校验截止日期：空值合法，非空必须是有效 ISO 日期 */
  function validateDeadline(value: string): string {
    if (!value) return "";
    const d = parseISO(value);
    if (!isValid(d)) return "日期格式无效";
    const year = d.getFullYear();
    if (year < 2000 || year > 2099) return "日期超出合理范围";
    return "";
  }

  useEffect(() => {
    if (open) {
      if (editTask) {
        setTitle(editTask.title);
        setDeadline(editTask.deadline ?? "");
        setQuadrant(editTask.quadrant);
        setDescription(editTask.description ?? "");
      } else {
        setTitle("");
        setDeadline("");
        setDeadlineError("");
        setQuadrant(defaultQuadrant);
        setDescription("");
      }
    }
  }, [open, editTask, defaultQuadrant]);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const err = validateDeadline(deadline);
    if (err) {
      setDeadlineError(err);
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await update(editTask!.id, {
          title: trimmed,
          deadline: deadline || null,
          quadrant,
          description: description.trim() || null,
        });
      } else {
        await add({
          title: trimmed,
          deadline: deadline || undefined,
          quadrant,
          description: description.trim() || undefined,
        });
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑任务" : "新建任务"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="任务标题"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述（可选）</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="补充说明"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">截止时间（可选）</Label>
            <Input
              id="deadline"
              type="date"
              min="2000-01-01"
              max="2099-12-31"
              value={deadline}
              onChange={(e) => {
                const v = e.target.value;
                setDeadline(v);
                setDeadlineError(validateDeadline(v));
              }}
              aria-invalid={!!deadlineError}
            />
            {deadlineError && (
              <p className="text-xs text-destructive mt-1">{deadlineError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>象限</Label>
            <div className="grid grid-cols-2 gap-2">
              {([0, 1, 2, 3] as Quadrant[]).map((q) => {
                const cfg = QUADRANT_CONFIG[q];
                const { title, subtitle } = QUADRANT_LABELS[q];
                const Icon = cfg.icon;
                const isSelected = quadrant === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuadrant(q)}
                    className={cn(
                      "flex items-center gap-2 p-2 border-[3px] transition-all",
                      isSelected
                        ? "shadow-brutal-sm"
                        : "border-border bg-card hover:bg-muted"
                    )}
                    style={
                      isSelected
                        ? {
                            borderColor: cfg.accentColor,
                            backgroundColor: `${cfg.accentColor}15`,
                          }
                        : undefined
                    }
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: cfg.accentColor }}
                      strokeWidth={2.5}
                    />
                    <div className="flex flex-col items-start text-left">
                      <span className="font-bold text-sm uppercase leading-tight">
                        {title}
                      </span>
                      <span className="text-xs text-muted-foreground leading-tight">
                        {subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || saving}>
              {saving ? "保存中..." : isEdit ? "保存" : "创建"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

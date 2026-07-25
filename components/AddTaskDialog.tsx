import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, Quadrant } from "@/lib/types";
import { QUADRANT_LABELS } from "@/lib/types";
import { useTaskStore } from "@/stores/task-store";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 编辑模式传入已有任务 */
  editTask?: Task | null;
  /** 预设象限（新建时） */
  defaultQuadrant?: Quadrant;
}

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
  const [quadrant, setQuadrant] = useState<Quadrant>(defaultQuadrant);
  const [saving, setSaving] = useState(false);

  const isEdit = !!editTask;

  useEffect(() => {
    if (open) {
      if (editTask) {
        setTitle(editTask.title);
        setDeadline(editTask.deadline ?? "");
        setQuadrant(editTask.quadrant);
      } else {
        setTitle("");
        setDeadline("");
        setQuadrant(defaultQuadrant);
      }
    }
  }, [open, editTask, defaultQuadrant]);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      if (isEdit) {
        await update(editTask!.id, {
          title: trimmed,
          deadline: deadline || null,
        });
      } else {
        await add({
          title: trimmed,
          deadline: deadline || undefined,
          quadrant,
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
            <Label htmlFor="deadline">截止时间（可选）</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          {!isEdit && (
            <div className="space-y-2">
              <Label>象限</Label>
              <Select
                value={String(quadrant)}
                onValueChange={(v) => setQuadrant(Number(v) as Quadrant)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(QUADRANT_LABELS) as [
                      string,
                      { title: string; subtitle: string },
                    ][]
                  ).map(([key, { title }]) => (
                    <SelectItem key={key} value={key}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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

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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import type { RecurringTemplate, Quadrant, TemplatePreset } from "@/lib/types";
import { QUADRANT_LABELS, PRESET_CRON, PRESET_LABELS } from "@/lib/types";
import { useTemplateStore } from "@/stores/template-store";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESETS: TemplatePreset[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "custom",
];

/** 周期任务模板管理弹窗 */
export function TemplateDialog({ open, onOpenChange }: TemplateDialogProps) {
  const { templates, load, add, update, remove } = useTemplateStore();

  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<RecurringTemplate | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quadrant, setQuadrant] = useState<Quadrant>(1);
  const [preset, setPreset] = useState<TemplatePreset>("weekly");
  const [customCron, setCustomCron] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setQuadrant(1);
    setPreset("weekly");
    setCustomCron("");
    setEditingTemplate(null);
    setShowForm(true);
  }

  function openEdit(t: RecurringTemplate) {
    setEditingTemplate(t);
    setTitle(t.title);
    setDescription(t.description);
    setQuadrant(t.quadrant);
    // 反推预设类型
    const matched = (
      Object.entries(PRESET_CRON) as [TemplatePreset, string][]
    ).find(([, c]) => c === t.cron && c !== "");
    if (matched) {
      setPreset(matched[0]);
      setCustomCron("");
    } else {
      setPreset("custom");
      setCustomCron(t.cron);
    }
    setShowForm(true);
  }

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const cron = preset === "custom" ? customCron.trim() : PRESET_CRON[preset];
    if (!cron) return;
    setSaving(true);
    try {
      if (editingTemplate) {
        await update(editingTemplate.id, {
          title: trimmed,
          description: description.trim(),
          quadrant,
          cron,
        });
      } else {
        await add({
          title: trimmed,
          description: description.trim(),
          quadrant,
          cron,
        });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  function getPresetLabel(t: RecurringTemplate): string {
    for (const [key, cron] of Object.entries(PRESET_CRON)) {
      if (cron && cron === t.cron) return PRESET_LABELS[key as TemplatePreset];
    }
    return "自定义";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>周期任务模板</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pt-2">
            {/* 模板列表 */}
            {!showForm && (
              <>
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无模板，创建一个开始吧
                  </p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getPresetLabel(t)}
                            </span>
                            {t.description && (
                              <span className="text-xs text-muted-foreground truncate">
                                · {t.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={t.enabled}
                          onCheckedChange={(v) => update(t.id, { enabled: v })}
                        />
                        <button
                          onClick={() => openEdit(t)}
                          className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(t.id)}
                          className="h-7 w-7 rounded flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={resetForm}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  新建模板
                </Button>
              </>
            )}

            {/* 表单 */}
            {showForm && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tpl-title">标题</Label>
                  <Input
                    id="tpl-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例：每月报表报送"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tpl-desc">描述（可选）</Label>
                  <Input
                    id="tpl-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="补充说明"
                  />
                </div>
                <div className="space-y-2">
                  <Label>周期</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {PRESETS.map((p) => (
                      <Button
                        key={p}
                        variant={preset === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreset(p)}
                      >
                        {PRESET_LABELS[p]}
                      </Button>
                    ))}
                  </div>
                  {preset === "custom" && (
                    <Input
                      value={customCron}
                      onChange={(e) => setCustomCron(e.target.value)}
                      placeholder="cron 表达式，例：0 0 28 * *"
                      className="mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>默认象限</Label>
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
                      ).map(([key, { title, subtitle }]) => (
                        <SelectItem key={key} value={key}>
                          {title} - {subtitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    取消
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!title.trim() || saving}
                  >
                    {saving ? "保存中..." : editingTemplate ? "保存" : "创建"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

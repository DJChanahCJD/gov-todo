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
import { Textarea } from "@/components/ui/textarea";
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
import type {
  RecurringTemplate,
  RecurringType,
  RecurringRule,
  WeeklyRule,
  MonthlyRule,
  YearlyRule,
  IntervalRule,
  Quadrant,
} from "@/lib/types";
import { QUADRANT_LABELS, DEFAULT_LEAD_DAYS } from "@/lib/types";
import { useTemplateStore } from "@/stores/template-store";
import { formatRuleLabel } from "@/lib/utils/recurring";

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPES: { value: RecurringType; label: string }[] = [
  { value: "daily", label: "每天" },
  { value: "weekly", label: "每周" },
  { value: "monthly", label: "每月" },
  { value: "yearly", label: "每年" },
  { value: "interval", label: "每隔" },
];

const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 周期任务模板管理弹窗 */
export function TemplateDialog({ open, onOpenChange }: TemplateDialogProps) {
  const { templates, load, add, update, remove } = useTemplateStore();

  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<RecurringTemplate | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quadrant, setQuadrant] = useState<Quadrant>(1);
  const [type, setType] = useState<RecurringType>("weekly");
  const [leadDays, setLeadDays] = useState(DEFAULT_LEAD_DAYS.weekly);

  // 各类型规则参数
  const [weeklyDay, setWeeklyDay] = useState(1); // 周一
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [yearlyMonth, setYearlyMonth] = useState(1);
  const [yearlyDay, setYearlyDay] = useState(1);
  const [intervalEvery, setIntervalEvery] = useState(7);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  /** 类型切换时更新默认 leadDays */
  function handleTypeChange(t: RecurringType) {
    setType(t);
    setLeadDays(DEFAULT_LEAD_DAYS[t]);
  }

  /** 构建当前 rule 对象 */
  function buildRule(): RecurringRule {
    switch (type) {
      case "daily":
        return {};
      case "weekly":
        return { dayOfWeek: weeklyDay } as WeeklyRule;
      case "monthly":
        return { day: monthlyDay } as MonthlyRule;
      case "yearly":
        return { month: yearlyMonth, day: yearlyDay } as YearlyRule;
      case "interval":
        return { every: intervalEvery } as IntervalRule;
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setQuadrant(1);
    setType("weekly");
    setLeadDays(DEFAULT_LEAD_DAYS.weekly);
    setWeeklyDay(1);
    setMonthlyDay(1);
    setYearlyMonth(1);
    setYearlyDay(1);
    setIntervalEvery(7);
    setEditingTemplate(null);
    setShowForm(true);
  }

  /** 编辑模板时回填数据 */
  function openEdit(t: RecurringTemplate) {
    setEditingTemplate(t);
    setTitle(t.title);
    setDescription(t.description);
    setQuadrant(t.quadrant);
    setType(t.type);
    setLeadDays(t.leadDays);

    // 回填规则参数
    switch (t.type) {
      case "weekly":
        setWeeklyDay((t.rule as WeeklyRule).dayOfWeek);
        break;
      case "monthly":
        setMonthlyDay((t.rule as MonthlyRule).day);
        break;
      case "yearly": {
        const yr = t.rule as YearlyRule;
        setYearlyMonth(yr.month);
        setYearlyDay(yr.day);
        break;
      }
      case "interval":
        setIntervalEvery((t.rule as IntervalRule).every);
        break;
    }
    setShowForm(true);
  }

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const rule = buildRule();
      if (editingTemplate) {
        await update(editingTemplate.id, {
          title: trimmed,
          description: description.trim(),
          quadrant,
          type,
          rule,
          leadDays,
        });
      } else {
        await add({
          title: trimmed,
          description: description.trim(),
          quadrant,
          type,
          rule,
          leadDays,
        });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>周期任务模板</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
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
                        className="flex items-center gap-3 border-[3px] border-border bg-card p-3 hover:bg-secondary/60 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRuleLabel(t.type, t.rule)}
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
                          title="编辑"
                          onClick={() => openEdit(t)}
                          className="h-7 w-7 flex items-center justify-center border-[3px] border-border bg-background hover:bg-secondary transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="删除"
                          onClick={() => remove(t.id)}
                          className="h-7 w-7 flex items-center justify-center border-[3px] border-border bg-background text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={resetForm}
                  className="w-full neo-press"
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
                  <Textarea
                    id="tpl-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="补充说明"
                    rows={3}
                  />
                </div>

                {/* 周期类型选择 */}
                <div className="space-y-2">
                  <Label>周期</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {TYPES.map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={type === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTypeChange(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 规则参数 */}
                <div className="space-y-2">
                  <Label>规则</Label>
                  {type === "daily" && (
                    <p className="text-sm text-muted-foreground">
                      每天生成一条任务
                    </p>
                  )}
                  {type === "weekly" && (
                    <div className="flex gap-1.5">
                      {WEEK_DAYS.map((label, i) => (
                        <button
                          key={i}
                          onClick={() => setWeeklyDay(i)}
                          className={`h-9 w-9 flex items-center justify-center text-sm border-[3px] border-border transition-colors ${
                            weeklyDay === i
                              ? "bg-foreground text-background"
                              : "bg-background hover:bg-secondary"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  {type === "monthly" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        每月
                      </span>
                      <Input
                        type="number"
                        min={1}
                        max={28}
                        value={monthlyDay}
                        onChange={(e) =>
                          setMonthlyDay(
                            Math.max(
                              1,
                              Math.min(28, Number(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">号</span>
                    </div>
                  )}
                  {type === "yearly" && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={yearlyMonth}
                        onChange={(e) =>
                          setYearlyMonth(
                            Math.max(
                              1,
                              Math.min(12, Number(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">月</span>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={yearlyDay}
                        onChange={(e) =>
                          setYearlyDay(
                            Math.max(
                              1,
                              Math.min(31, Number(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">日</span>
                    </div>
                  )}
                  {type === "interval" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">每</span>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={intervalEvery}
                        onChange={(e) =>
                          setIntervalEvery(
                            Math.max(
                              1,
                              Math.min(365, Number(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">天</span>
                    </div>
                  )}
                </div>

                {/* 提前天数 */}
                <div className="space-y-2">
                  <Label htmlFor="tpl-lead">提前出现在 TODO</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="tpl-lead"
                      type="number"
                      min={0}
                      max={365}
                      value={leadDays}
                      onChange={(e) =>
                        setLeadDays(
                          Math.max(
                            0,
                            Math.min(365, Number(e.target.value) || 0)
                          )
                        )
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">天</span>
                  </div>
                </div>

                {/* 默认象限 */}
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
                      ).map(([key, { title }]) => (
                        <SelectItem key={key} value={key}>
                          {title}
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

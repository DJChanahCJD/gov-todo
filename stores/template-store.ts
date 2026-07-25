import { create } from "zustand";
import type {
  RecurringTemplate,
  RecurringType,
  RecurringRule,
  Quadrant,
} from "@/lib/types";
import { DEFAULT_LEAD_DAYS } from "@/lib/types";
import * as db from "@/lib/db/db";
import { toast } from "sonner";
import { computeInitialNextGenerateAt } from "@/lib/utils/recurring";

interface TemplateAddData {
  title: string;
  description: string;
  quadrant: Quadrant;
  type: RecurringType;
  rule: RecurringRule;
  leadDays?: number;
}

interface TemplateUpdateData {
  title?: string;
  description?: string;
  quadrant?: Quadrant;
  type?: RecurringType;
  rule?: RecurringRule;
  leadDays?: number;
  enabled?: boolean;
  lastGeneratedFor?: string;
  nextGenerateAt?: string;
}

interface TemplateState {
  templates: RecurringTemplate[];
  loading: boolean;

  load: () => Promise<void>;
  add: (data: TemplateAddData) => Promise<RecurringTemplate>;
  update: (id: string, data: TemplateUpdateData) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

function uid(): string {
  return crypto.randomUUID();
}

export const useTemplateStore = create<TemplateState>()((set, get) => ({
  templates: [],
  loading: true,

  load: async () => {
    try {
      const templates = await db.getAllTemplates();
      set({ templates, loading: false });
    } catch (e) {
      console.error("加载模板失败", e);
      set({ loading: false });
    }
  },

  add: async (data) => {
    const leadDays = data.leadDays ?? DEFAULT_LEAD_DAYS[data.type];
    const template: RecurringTemplate = {
      id: uid(),
      title: data.title,
      description: data.description,
      quadrant: data.quadrant,
      type: data.type,
      rule: data.rule,
      leadDays,
      lastGeneratedFor: "",
      nextGenerateAt: computeInitialNextGenerateAt(
        data.type,
        data.rule,
        leadDays
      ),
      enabled: true,
    };
    await db.putTemplate(template);
    set((s) => ({ templates: [...s.templates, template] }));
    toast.success("模板已创建");
    return template;
  },

  update: async (id, data) => {
    const templates = get().templates;
    const idx = templates.findIndex((t) => t.id === id);
    if (idx === -1) return;

    let updated = { ...templates[idx], ...data };

    // 若 type/rule/leadDays 变化，重新计算 nextGenerateAt
    const typeChanged =
      data.type !== undefined && data.type !== templates[idx].type;
    const ruleChanged =
      data.rule !== undefined &&
      JSON.stringify(data.rule) !== JSON.stringify(templates[idx].rule);
    const leadDaysChanged =
      data.leadDays !== undefined && data.leadDays !== templates[idx].leadDays;

    if (typeChanged || ruleChanged || leadDaysChanged) {
      const t = data.type ?? updated.type;
      const r = data.rule ?? updated.rule;
      const ld = data.leadDays ?? updated.leadDays;
      updated.lastGeneratedFor = "";
      updated.nextGenerateAt = computeInitialNextGenerateAt(t, r, ld);
    }

    await db.putTemplate(updated);
    set({ templates: templates.map((t) => (t.id === id ? updated : t)) });
  },

  remove: async (id) => {
    await db.deleteTemplate(id);
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
    toast.success("模板已删除");
  },
}));

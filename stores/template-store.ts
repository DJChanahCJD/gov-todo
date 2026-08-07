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
import { uid } from "@/lib/utils";
import { computeInitialNextGenerateAt } from "@/lib/utils/recurring";

interface TemplateAddData {
  title: string;
  description: string;
  quadrant: Quadrant;
  type: RecurringType;
  rule: RecurringRule;
  leadDays?: number;
  startDate?: string; // 开始日期 YYYY-MM-DD，为空则从今天开始
}

interface TemplateUpdateData {
  title?: string;
  description?: string;
  quadrant?: Quadrant;
  type?: RecurringType;
  rule?: RecurringRule;
  leadDays?: number;
  enabled?: boolean;
  startDate?: string;
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
    const startDate = data.startDate || undefined;
    const template: RecurringTemplate = {
      id: uid(),
      title: data.title,
      description: data.description,
      quadrant: data.quadrant,
      type: data.type,
      rule: data.rule,
      leadDays,
      startDate,
      lastGeneratedFor: "",
      nextGenerateAt: computeInitialNextGenerateAt(
        data.type,
        data.rule,
        leadDays,
        new Date(),
        startDate
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

    // 若 type/rule/leadDays/startDate 变化，重新计算 nextGenerateAt
    const typeChanged =
      data.type !== undefined && data.type !== templates[idx].type;
    const ruleChanged =
      data.rule !== undefined &&
      JSON.stringify(data.rule) !== JSON.stringify(templates[idx].rule);
    const leadDaysChanged =
      data.leadDays !== undefined && data.leadDays !== templates[idx].leadDays;
    const startDateChanged =
      data.startDate !== undefined &&
      data.startDate !== templates[idx].startDate;

    if (typeChanged || ruleChanged || leadDaysChanged || startDateChanged) {
      const t = data.type ?? updated.type;
      const r = data.rule ?? updated.rule;
      const ld = data.leadDays ?? updated.leadDays;
      const sd =
        data.startDate !== undefined
          ? data.startDate || undefined
          : updated.startDate;
      updated.lastGeneratedFor = "";
      updated.nextGenerateAt = computeInitialNextGenerateAt(
        t,
        r,
        ld,
        new Date(),
        sd
      );
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

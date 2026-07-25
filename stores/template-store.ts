import { create } from "zustand";
import type { RecurringTemplate, Quadrant } from "@/lib/types";
import { PRESET_CRON, PRESET_LABELS } from "@/lib/types";
import * as db from "@/lib/db/db";
import { toast } from "sonner";

interface TemplateState {
  templates: RecurringTemplate[];
  loading: boolean;

  load: () => Promise<void>;
  add: (data: {
    title: string;
    description: string;
    quadrant: Quadrant;
    cron: string;
  }) => Promise<RecurringTemplate>;
  update: (
    id: string,
    data: Partial<
      Pick<
        RecurringTemplate,
        | "title"
        | "description"
        | "quadrant"
        | "cron"
        | "enabled"
        | "lastGenerated"
      >
    >
  ) => Promise<void>;
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
    const template: RecurringTemplate = {
      id: uid(),
      title: data.title,
      description: data.description,
      quadrant: data.quadrant,
      cron: data.cron,
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
    const updated = { ...templates[idx], ...data };
    await db.putTemplate(updated);
    set({ templates: templates.map((t) => (t.id === id ? updated : t)) });
  },

  remove: async (id) => {
    await db.deleteTemplate(id);
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
    toast.success("模板已删除");
  },
}));

export { PRESET_CRON, PRESET_LABELS };

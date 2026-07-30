import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  parseNumbers,
  formatCNY,
  toPure,
  toRMB,
  calcDiff,
  unitConversions,
} from "@/lib/utils/doc-calc";

/** 结果卡片 */
function ResultCard({
  label,
  text,
  full,
  copied,
  onClick,
}: {
  label: string;
  text: string;
  full?: boolean;
  copied: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start text-left border-[3px] border-border p-3 transition-colors cursor-pointer w-full",
        copied
          ? "bg-secondary text-secondary-foreground border-foreground" // 复制后：黑底白字
          : "bg-card text-card-foreground hover:bg-secondary hover:text-secondary-foreground",
        full ? "col-span-2" : ""
      )}
    >
      <span
        className={cn(
          "text-xs font-medium transition-colors",
          copied ? "text-secondary-foreground/70" : "text-muted-foreground" // 复制后副标题变灰白，保证可读性
        )}
      >
        {label}
      </span>
      <span className="mt-1 text-lg font-bold leading-tight break-all">
        {text}
      </span>
    </button>
  );
}

/** 数字阅读与公文计算助手 */
export function DocCalc() {
  const [input, setInput] = useState("");
  const [decimals, setDecimals] = useState(2);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  /** 复制到剪贴板 */
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 800);
  }

  /** 解析输入 */
  const numbers = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return [];
    return parseNumbers(trimmed);
  }, [input]);

  const hasMultiple = numbers.length >= 2;
  const primary = numbers[0];

  return (
    // 增加 px-1 防止左侧边框在 focus 时溢出被隐藏
    <div className="space-y-5 px-1 py-1">
      {/* 顶部区域：输入框与精度选择同行 */}
      <div className="flex items-center gap-3">
        <Input
          className="flex-1 min-w-0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="粘贴单数或对比段落（如：本期150.5万元，去年同期120.2万元）"
          autoFocus
        />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            精度
          </span>
          <Select
            value={String(decimals)}
            onValueChange={(v) => setDecimals(Number(v))}
          >
            <SelectTrigger className="w-16 rounded-none border-[3px] border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-[3px] border-border">
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 无输入提示 */}
      {numbers.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          输入文本后将自动解析数字并展示结果
        </p>
      )}

      {/* 双数对比分析 */}
      {hasMultiple && (
        <div>
          <h4 className="font-black text-sm uppercase tracking-wide border-b-[3px] border-border pb-1 mb-3">
            双数对比分析
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const a = numbers[0];
              const b = numbers[1];
              const diff = calcDiff(a, b);
              const prefix = (v: number) => (v > 0 ? "+" : "");
              const items = [
                {
                  key: "rate",
                  label: "增长率 (同比/环比)",
                  text: `${prefix(diff.rate)}${toPure(diff.rate, decimals)}%`,
                },
                {
                  key: "amount",
                  label: "增长量 (差值)",
                  text: `${prefix(diff.amount)}${toPure(diff.amount, decimals)}`,
                },
                {
                  key: "ratio",
                  label: "占比 (A占B)",
                  text: `${toPure(diff.ratio, decimals)}%`,
                },
                {
                  key: "multiple",
                  label: "倍数 (A是B的多少倍)",
                  text: `${toPure(diff.multiple, decimals)} 倍`,
                },
              ];
              return items.map((item) => (
                <ResultCard
                  key={item.key}
                  label={item.label}
                  text={item.text}
                  copied={copiedKey === item.key}
                  onClick={() => copy(item.text, item.key)}
                />
              ));
            })()}
          </div>
        </div>
      )}

      {/* 基础格式转换 */}
      {!isNaN(primary) && (
        <div>
          <h4 className="font-black text-sm uppercase tracking-wide border-b-[3px] border-border pb-1 mb-3">
            基础格式与财务转换
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* 基础格式 */}
            <ResultCard
              label="标准千分位"
              text={formatCNY(primary, 20, 0)}
              copied={copiedKey === "locale"}
              onClick={() => copy(formatCNY(primary, 20, 0), "locale")}
            />
            <ResultCard
              label="纯数字"
              text={toPure(primary, decimals)}
              copied={copiedKey === "pure"}
              onClick={() => copy(toPure(primary, decimals), "pure")}
            />

            {/* 大写金额 — 全宽 */}
            <ResultCard
              label="公文大写金额"
              text={toRMB(primary)}
              full
              copied={copiedKey === "rmb"}
              onClick={() => copy(toRMB(primary), "rmb")}
            />

            {/* 单位换算 */}
            {unitConversions(primary, decimals)
              .filter((c) => c.show)
              .map((c) => (
                <ResultCard
                  key={c.key}
                  label={c.label}
                  text={c.text}
                  copied={copiedKey === c.key}
                  onClick={() => copy(c.text, c.key)}
                />
              ))}
          </div>
        </div>
      )}

      {/* 提示 */}
      {numbers.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          点击任意计算结果即可一键复制纯文本
        </p>
      )}
    </div>
  );
}

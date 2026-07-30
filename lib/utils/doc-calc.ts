/**
 * 公文计算工具 — 纯函数集合
 * 数字解析、人民币大写、格式转换、对比分析
 */

/** 中文数字单位映射 */
const UNITS: Record<string, number> = {
  万: 1e4,
  亿: 1e8,
  万亿: 1e12,
};

/** 从文本中提取数字，自动识别万/亿/万亿/%/‰ 单位 */
export function parseNumbers(text: string): number[] {
  const matches = text.matchAll(/(-?\d+(?:\.\d+)?)\s*(万亿|万|亿)?\s*(%|‰)?/g);
  return Array.from(matches).map((m) => {
    let v = Number(m[1]) * (UNITS[m[2] ?? ""] || 1);
    if (m[3] === "%") v /= 100;
    if (m[3] === "‰") v /= 1000;
    return v;
  });
}

/** 千分位格式化（中文 locale） */
export function formatCNY(n: number, maxDec?: number, minDec?: number): string {
  const max = maxDec ?? 2;
  const min = minDec ?? max;
  return Number(n).toLocaleString("zh-CN", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

/** 纯数字格式化 */
export function toPure(n: number, decimals = 2): string {
  return Number(n).toFixed(decimals);
}

/** 人民币大写转换（分组算法，正确处理零位） */
export function toRMB(n: number): string {
  if (isNaN(n) || Math.abs(n) >= 1e12) return "数值超限";
  if (n === 0) return "零元整";

  const cnDigits = "零壹贰叁肆伍陆柒捌玖";
  const positionUnits = ["", "拾", "佰", "仟"];
  const groupUnits = ["", "万", "亿"];
  const isNeg = n < 0;
  const abs = Math.abs(n);

  const [intStr, decStr] = abs.toFixed(2).split(".");

  // 从右往左每4位一组（个/万/亿）
  const groups: string[] = [];
  for (let i = intStr.length; i > 0; i -= 4) {
    groups.unshift(intStr.slice(Math.max(0, i - 4), i));
  }

  let result = "";
  let needZero = false;

  for (let g = 0; g < groups.length; g++) {
    const seg = groups[g];
    let segStr = "";
    let segNeedZero = false;

    for (let i = 0; i < seg.length; i++) {
      const d = +seg[i];
      const pos = seg.length - 1 - i; // 0=个, 1=拾, 2=佰, 3=仟
      if (d === 0) {
        segNeedZero = true;
      } else {
        if (segNeedZero) {
          segStr += "零";
          segNeedZero = false;
        }
        segStr += cnDigits[d] + positionUnits[pos];
      }
    }

    const groupIdx = groups.length - 1 - g;
    if (segStr) {
      if (needZero && !segStr.startsWith("零")) result += "零";
      result += segStr + groupUnits[groupIdx];
      needZero = false;
    } else if (result) {
      needZero = true;
    }
  }

  if (!result) result = "零";
  result += "元";

  const jiao = +decStr[0];
  const fen = +decStr[1];
  if (jiao === 0 && fen === 0) {
    result += "整";
  } else {
    if (jiao > 0) result += cnDigits[jiao] + "角";
    if (fen > 0) result += cnDigits[fen] + "分";
  }

  return (isNeg ? "欠" : "") + result;
}

/** 对比分析结果 */
export interface DiffResult {
  /** 增长率 (%) */
  rate: number;
  /** 增长量 */
  amount: number;
  /** 占比 (A占B, %) */
  ratio: number;
  /** 倍数 (A是B的多少倍) */
  multiple: number;
}

/** 双数对比分析 */
export function calcDiff(a: number, b: number): DiffResult {
  const amount = a - b;
  const rate = b ? (amount / b) * 100 : 0;
  const ratio = b ? (a / b) * 100 : 0;
  const multiple = b ? a / b : 0;
  return { rate, amount, ratio, multiple };
}

/** 单位换算项 */
export interface ConversionItem {
  key: string;
  label: string;
  text: string;
  full?: boolean;
  show: boolean;
}

/** 单位换算：万元/亿元/万亿元/百分比/千分比 */
export function unitConversions(n: number, decimals: number): ConversionItem[] {
  const absN = Math.abs(n);
  return [
    {
      key: "wan",
      label: "万元",
      text: `${formatCNY(n / 1e4, decimals)} 万元`,
      show: absN >= 100,
    },
    {
      key: "yi",
      label: "亿元",
      text: `${formatCNY(n / 1e8, decimals)} 亿元`,
      show: absN >= 1e6,
    },
    {
      key: "wanyi",
      label: "万亿元",
      text: `${formatCNY(n / 1e12, decimals)} 万亿元`,
      show: absN >= 1e10,
    },
    {
      key: "pct",
      label: "百分比 (%)",
      text: `${toPure(n * 100, decimals)}%`,
      show: absN <= 100,
    },
    {
      key: "permil",
      label: "千分比 (‰)",
      text: `${toPure(n * 1000, decimals)}‰`,
      show: absN <= 10,
    },
  ];
}

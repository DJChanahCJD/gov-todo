// lib/utils/index.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 className，并处理 Tailwind 类冲突。
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** 生成唯一 ID（时间戳 + 随机数） */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

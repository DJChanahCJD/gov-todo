/**
 * 构建后 CSS 兼容性检查
 * 检测 dist 目录中是否包含统信 UOS (Chromium 87) 不支持的 CSS 特性
 * 如果发现不兼容特性，构建应失败
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "..", "dist");

const INCOMPATIBLE_PATTERNS = [
  { pattern: /oklch\(/g, name: "oklch()" },
  { pattern: /color-mix\(/g, name: "color-mix()" },
  { pattern: /@property\b/g, name: "@property" },
  { pattern: /@layer\b/g, name: "@layer" },
  { pattern: /@container\b/g, name: "@container" },
  { pattern: /:has\(/g, name: ":has()" },
  { pattern: /color\(/g, name: "color()" },
  { pattern: /lab\(/g, name: "lab()" },
  { pattern: /lch\(/g, name: "lch()" },
  { pattern: /hwb\(/g, name: "hwb()" },
];

let found = [];

// Check all HTML files in dist (single-file build outputs HTML with inline CSS)
const files = ["index.html"];

for (const file of files) {
  const filePath = resolve(distDir, file);
  if (!existsSync(filePath)) continue;

  const content = readFileSync(filePath, "utf-8");

  for (const { pattern, name } of INCOMPATIBLE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      found.push({ file, feature: name, count: matches.length });
    }
  }
}

if (found.length > 0) {
  console.error("❌ CSS 兼容性检查失败！检测到以下不兼容特性：\n");
  for (const { file, feature, count } of found) {
    console.error(`  ${file}: ${feature} (${count} 处)`);
  }
  console.error(
    "\n统信 UOS 浏览器 (Chromium 87) 不支持以上特性。"
  );
  console.error(
    "请检查 vite.config.ts 的 lightningcss targets 配置，确保目标为 Chrome 87。\n"
  );
  process.exit(1);
} else {
  console.log("✅ CSS 兼容性检查通过 — 未发现不兼容特性。");
}

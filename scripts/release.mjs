/* global console */
// scripts/release.mjs — 本地一键发版：构建 → 推送 → 创建 GitHub Release 并上传单文件
import { readFileSync, copyFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";

/** 执行 shell 命令，继承输出便于观察进度 */
const run = (cmd) => execSync(cmd, { stdio: "inherit" });

const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const tag = `v${version}`;

// 1. 构建单文件产物 dist/index.html（含 typecheck 与 CSS 兼容检查）
run("npm run build");

// 2. 推送代码与版本 tag，确保 Release tag 在远端存在
run("git push");
run(`git push origin ${tag}`);

// 3. 重命名产物并创建 Release（gh 自动在远端创建 tag，附件即应用本体）
copyFileSync("dist/index.html", "gov-todo.html");
run(
  `gh release create ${tag} gov-todo.html --title "gov-todo ${tag}" --generate-notes`
);
unlinkSync("gov-todo.html");

console.log(`✅ 已发布 ${tag}`);

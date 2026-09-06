// scripts/release-github.mjs — 仅负责创建 GitHub Release 并上传单文件产物（幂等，可安全重试）
import { readFileSync, copyFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";

/** 执行 shell 命令，继承输出便于观察进度 */
const run = (cmd) => execSync(cmd, { stdio: "inherit" });

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const tag = `v${version}`;
const artifact = "gov-todo.html";

// 幂等检查：Release 已存在则跳过，避免重复创建报错
try {
  execSync(`gh release view ${tag}`, { stdio: "ignore" });
  console.log(`ℹ️ GitHub Release ${tag} 已存在，跳过发布。`);
  process.exit(0);
} catch {
  // 不存在，继续创建
}

copyFileSync("dist/index.html", artifact);

try {
  run(
    `gh release create ${tag} ${artifact} --title "gov-todo ${tag}" --generate-notes`
  );
  console.log(`✅ GitHub Release ${tag} 发布成功`);
} finally {
  unlinkSync(artifact);
}

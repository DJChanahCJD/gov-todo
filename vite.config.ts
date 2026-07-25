import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile as singleFile } from "vite-plugin-singlefile";

/**
 * Vite 配置。
 * 构建为单文件 HTML（base 相对路径 + 内联 JS/CSS），
 * 满足“点击 HTML 文件，本地直接运行”的最终预期。
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), singleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  base: "./",
  build: {
    target: "es2018",
    cssCodeSplit: false,
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});

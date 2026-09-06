import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import App from "@/src/App";
import "@/src/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      disableTransitionOnChange
    >
      <App />
      <Toaster
        position="bottom-right"
        richColors
        expand
        visibleToasts={3}
        gap={12}
        toastOptions={{
          duration: 3000,
          closeButton: true,
        }}
      />
    </ThemeProvider>
  </StrictMode>
);

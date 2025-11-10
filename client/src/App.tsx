import ReactQueryProvider from "./contexts/ReactQueryContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { AuthProvider } from "./contexts/AuthProvider";
import { useEffect } from "react";
import i18n from "./AppData/i18n/i18n";

export default function App() {
  useEffect(() => {
    const applyDir = () => {
      const lang = i18n.language || "en";
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    };
    applyDir();
    i18n.on("languageChanged", applyDir);
    return () => {
      i18n.off("languageChanged", applyDir);
    };
  }, []);
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReactQueryProvider>
          <RouterProvider router={router} />
          <Toaster />
        </ReactQueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

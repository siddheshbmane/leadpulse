"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

/**
 * Inline script that runs before paint to prevent FOUC.
 * Reads the stored theme and sets the class on <html> immediately.
 */
const THEME_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem("leadpulse-theme") || "dark";
    var d = document.documentElement;
    d.classList.remove("dark", "light");
    d.classList.add(t);
  } catch(e) {}
})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("leadpulse-theme") as Theme | null;
    if (stored && (stored === "dark" || stored === "light")) {
      setTheme(stored);
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(stored);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("leadpulse-theme", next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

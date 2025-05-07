import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

export const useDarkMode = () => {
  const { theme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(theme === "dark");
  }, [theme]);

  return isDarkMode;
};

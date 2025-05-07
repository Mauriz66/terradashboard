import { useState, useEffect } from "react";
import { useMounted } from "./use-mounted";

export function useMediaQuery(query: string): boolean {
  const mounted = useMounted();
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    
    const media = window.matchMedia(query);
    
    // Initial check
    setMatches(media.matches);
    
    // Update state on change
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    
    return () => media.removeEventListener("change", listener);
  }, [query, mounted]);

  return matches;
}

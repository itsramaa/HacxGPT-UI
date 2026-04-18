"use client";

import { useEffect, useState, useMemo } from "react";
import { suggestions } from "@/lib/constants";

export function useSuggestedActions(limit: number = 4) {
  const [randomized, setRandomized] = useState<string[]>([]);

  useEffect(() => {
    // Shuffle and pick a limited number of suggestions
    const shuffled = [...suggestions]
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);
    
    setRandomized(shuffled);
  }, [limit]);

  return {
    suggestedActions: randomized,
    refreshSuggestions: () => {
      const shuffled = [...suggestions]
        .sort(() => 0.5 - Math.random())
        .slice(0, limit);
      setRandomized(shuffled);
    }
  };
}

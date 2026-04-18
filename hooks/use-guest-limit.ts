"use client";

import { useEffect, useState } from "react";

export function useGuestLimit() {
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    const handleLimit = () => setIsLimitReached(true);
    window.addEventListener("hacxgpt:guest-limit-reached", handleLimit);
    return () =>
      window.removeEventListener("hacxgpt:guest-limit-reached", handleLimit);
  }, []);

  return {
    isLimitReached,
    setLimitReached: setIsLimitReached,
  };
}

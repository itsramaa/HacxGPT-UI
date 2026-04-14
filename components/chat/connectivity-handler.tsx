"use client";

import { useEffect, useState } from "react";
import { SiteMaintenance } from "./site-maintenance";

export function ConnectivityHandler({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Initial health check
    const checkConnection = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`, {
          method: "GET",
          cache: "no-store",
        });
        
        // If we get a 500 with "offline" error from our proxy, or a network failure
        if (!response.ok) {
          const data = await response.json();
          if (data.error === "offline") {
            setIsOffline(true);
          }
        } else {
          setIsOffline(false);
        }
      } catch (err) {
        // Network error (backend process completely down)
        setIsOffline(true);
      }
    };

    checkConnection();

    // 2. Poll every 15 seconds to auto-recover if backend comes back up
    const interval = setInterval(checkConnection, 15000);

    // 3. Listen for instant offline events
    const handleInstantOffline = () => setIsOffline(true);
    window.addEventListener("hacxgpt:offline", handleInstantOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("hacxgpt:offline", handleInstantOffline);
    };
  }, []);

  if (isOffline) {
    return <SiteMaintenance />;
  }

  return <>{children}</>;
}

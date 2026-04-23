"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SiteMaintenance } from "./site-maintenance";

export function ConnectivityHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOffline, setIsOffline] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const consecutiveSuccesses = useRef(0);
  const REQUIRED_SUCCESSES = 2; // Verify stable before showing app

  const checkConnection = useCallback(async () => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/health`,
        {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        }
      );
      clearTimeout(id);

      // If we get an error response or network failure
      if (response.ok) {
        consecutiveSuccesses.current += 1;

        // Only come back online after stable verification
        if (consecutiveSuccesses.current >= REQUIRED_SUCCESSES) {
          setIsOffline(false);
          setIsVerifying(false);
        }
      } else {
        setIsOffline(true);
        consecutiveSuccesses.current = 0;
      }
    } catch (_err) {
      // Network error (backend process completely down)
      setIsOffline(true);
      consecutiveSuccesses.current = 0;
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Poll every 5 seconds for faster reaction
    const interval = setInterval(checkConnection, 5000);

    // Global listener for instant offline trigger from other parts of the app
    const handleInstantOffline = () => {
      // Instead of forcing offline immediately, we trigger a health check
      // This ensures that transient errors in other APIs don't show maintenance
      // if the backend is actually still healthy (/health responds).
      checkConnection();
    };

    // Listen for custom events or failed fetch notifications
    window.addEventListener("hacxgpt:offline", handleInstantOffline);

    // Global interceptor for failed fetches if supported (or just wait for next poll)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        // Intercept 503 Service Unavailable
        if (response.status === 503) {
          handleInstantOffline();
        }
        return response;
      } catch (err) {
        // If it's a network error (failed to fetch), trigger health check
        if (err instanceof TypeError && err.message === "Failed to fetch") {
          handleInstantOffline();
        }
        throw err;
      }
    };

    return () => {
      clearInterval(interval);
      window.removeEventListener("hacxgpt:offline", handleInstantOffline);
      window.fetch = originalFetch;
    };
  }, [checkConnection]);

  if (isOffline) {
    return (
      <SiteMaintenance
        isVerifying={isVerifying}
        onCheck={() => {
          setIsVerifying(true);
          checkConnection();
        }}
      />
    );
  }

  return <>{children}</>;
}

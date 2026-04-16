"use client";

import { ArrowUpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  useEffect(() => {
    if (!isMobile) {
      setIsVisible(false);
      return;
    }

    const toggleVisibility = (e: Event) => {
      // Get the target element that is scrolling
      const target = e.target as any;
      if (!target) return;

      // Calculate the scroll position based on whether it's an element or window/document
      let scrollTop = 0;
      if (target === document || target === window) {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      } else {
        scrollTop = target.scrollTop;
      }

      if (scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Use capture: true to catch scroll events from ANY nested overflow-y-auto container
    window.addEventListener("scroll", toggleVisibility, { capture: true });

    return () => {
      window.removeEventListener("scroll", toggleVisibility, { capture: true });
    };
  }, [isMobile, pathname]); // Re-run on pathname change to reset state if needed

  const scrollToTop = () => {
    // Find the current scrollable container
    const containers = document.querySelectorAll(".overflow-y-auto");
    const activeContainer = Array.from(containers).find(c => c.scrollTop > 5);

    if (activeContainer) {
      activeContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      // Safety for some browsers
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!isMobile) return null;

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        "fixed bottom-8 right-6 z-[9999] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border/20 bg-background/80 backdrop-blur-xl transition-all duration-300 pointer-events-none opacity-0 scale-50 dark:bg-gray-700",
        isVisible && "opacity-100 scale-100 pointer-events-auto"
      )}
      onClick={scrollToTop}
    >
      <ArrowUpIcon className="size-5 text-primary" />
    </Button>
  );
}

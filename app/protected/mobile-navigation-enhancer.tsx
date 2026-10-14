"use client";

import {
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  usePathname,
  useRouter,
} from "next/navigation";

function findBottomNavigationGrid() {
  const candidates =
    Array.from(
      document.querySelectorAll<HTMLElement>(
        "nav, div"
      )
    );

  const navigation =
    candidates.find((element) => {
      const classes =
        element.classList;

      return (
        classes.contains("fixed") &&
        classes.contains("inset-x-0") &&
        classes.contains("bottom-0") &&
        classes.contains("z-40")
      );
    });

  if (!navigation) {
    return null;
  }

  return (
    Array.from(
      navigation.children
    ).find(
      (child) =>
        child instanceof HTMLElement &&
        child.classList.contains("grid")
    ) as HTMLElement | undefined
  ) ?? null;
}

function enhanceNavigation(
  grid: HTMLElement
) {
  const buttons =
    Array.from(
      grid.querySelectorAll<HTMLButtonElement>(
        ":scope > button"
      )
    ).filter(
      (button) =>
        button.dataset.touchbaseBack !==
        "true"
    );

  grid.style.gridTemplateColumns =
    `repeat(${buttons.length + 1}, minmax(0, 1fr))`;

  for (const button of buttons) {
    if (
      button.style.backgroundColor
    ) {
      continue;
    }

    button.style.backgroundColor =
      "rgba(255, 255, 255, 0.44)";
    button.style.border =
      "1px solid rgba(255, 255, 255, 0.62)";
    button.style.color =
      "#334155";
    button.style.boxShadow =
      "0 2px 8px rgba(15, 23, 42, 0.10)";
    button.style.backdropFilter =
      "blur(10px)";
  }
}

export default function MobileNavigationEnhancer() {
  const router = useRouter();
  const pathname = usePathname();

  const [
    portalTarget,
    setPortalTarget,
  ] =
    useState<HTMLElement | null>(
      null
    );

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const findAndEnhance = () => {
      if (cancelled) {
        return;
      }

      const grid =
        findBottomNavigationGrid();

      if (grid) {
        enhanceNavigation(grid);
        setPortalTarget(grid);
        return;
      }

      attempts += 1;

      if (attempts < 20) {
        window.setTimeout(
          findAndEnhance,
          100
        );
      } else {
        setPortalTarget(null);
      }
    };

    findAndEnhance();

    return () => {
      cancelled = true;
      setPortalTarget(null);
    };
  }, [pathname]);

  useEffect(() => {
    const phoneOnly = window.matchMedia(
      "(max-width: 767px)"
    );

    if (!phoneOnly.matches) {
      return;
    }

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const handleTouchStart = (
      event: TouchEvent
    ) => {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }

      const touch = event.touches[0];

      // Only begin a back gesture from the left edge.
      if (touch.clientX > 32) {
        tracking = false;
        return;
      }

      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    };

    const handleTouchEnd = (
      event: TouchEvent
    ) => {
      if (!tracking) {
        return;
      }

      tracking = false;

      const touch =
        event.changedTouches[0];

      if (!touch) {
        return;
      }

      const deltaX =
        touch.clientX - startX;
      const deltaY =
        Math.abs(
          touch.clientY - startY
        );

      // Require a clear horizontal right swipe so normal scrolling
      // and controls do not accidentally navigate back.
      if (
        deltaX >= 90 &&
        deltaY <= 70 &&
        deltaX > deltaY * 1.5
      ) {
        router.back();
      }
    };

    const handleTouchCancel = () => {
      tracking = false;
    };

    window.addEventListener(
      "touchstart",
      handleTouchStart,
      { passive: true }
    );
    window.addEventListener(
      "touchend",
      handleTouchEnd,
      { passive: true }
    );
    window.addEventListener(
      "touchcancel",
      handleTouchCancel,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "touchstart",
        handleTouchStart
      );
      window.removeEventListener(
        "touchend",
        handleTouchEnd
      );
      window.removeEventListener(
        "touchcancel",
        handleTouchCancel
      );
    };
  }, [pathname, router]);

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <button
      type="button"
      data-touchbase-back="true"
      onClick={() =>
        router.back()
      }
      aria-label="Go back"
      title="Back"
      className="order-first flex min-h-14 flex-col items-center justify-center rounded-2xl border border-white/70 px-2 py-2 text-slate-700 shadow-sm backdrop-blur-xl transition active:scale-95"
      style={{
        backgroundColor:
          "rgba(255, 255, 255, 0.58)",
        boxShadow:
          "0 2px 10px rgba(15, 23, 42, 0.12)",
      }}
    >
      <span
        aria-hidden="true"
        className="text-2xl font-bold leading-none"
      >
        ←
      </span>
    </button>,
    portalTarget
  );
}

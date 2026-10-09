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
        child instanceof
          HTMLElement &&
        child.classList.contains(
          "grid"
        )
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
        button.dataset
          .touchbaseBack !==
        "true"
    );

  grid.style.gridTemplateColumns =
    `repeat(${buttons.length + 1}, minmax(0, 1fr))`;

  for (const button of buttons) {
    if (
      button.style
        .backgroundColor
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
    let animationFrame = 0;

    const refresh = () => {
      cancelAnimationFrame(
        animationFrame
      );

      animationFrame =
        requestAnimationFrame(
          () => {
            const grid =
              findBottomNavigationGrid();

            if (!grid) {
              setPortalTarget(
                null
              );
              return;
            }

            enhanceNavigation(
              grid
            );

            setPortalTarget(
              grid
            );
          }
        );
    };

    refresh();

    const observer =
      new MutationObserver(
        refresh
      );

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true,
      }
    );

    window.addEventListener(
      "resize",
      refresh
    );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
      observer.disconnect();

      window.removeEventListener(
        "resize",
        refresh
      );
    };
  }, [pathname]);

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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Minimal typing for the Wake Lock API
// See: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(
    type: "release",
    listener: () => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: "release",
    listener: () => void,
    options?: boolean | EventListenerOptions,
  ): void;
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request(type: "screen"): Promise<WakeLockSentinel>;
  };
};

type UseScreenWakeLockReturn = {
  isSupported: boolean;
  isActive: boolean;
  error: Error | null;
  request: () => Promise<boolean>;
  release: () => Promise<void>;
};

/**
 * useScreenWakeLock
 * Requests a screen wake lock while `active` is true and releases it otherwise.
 * Auto re-requests on `visibilitychange` when the tab becomes visible again.
 * Falls back to waiting for a user gesture if the browser requires it.
 */
export function useScreenWakeLock(active: boolean): UseScreenWakeLockReturn {
  const isSupported = useMemo(
    () => typeof navigator !== "undefined" && "wakeLock" in navigator,
    [],
  );

  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const gestureRetryRef = useRef<((ev: Event) => void) | null>(null);

  const release = useCallback(async () => {
    try {
      if (
        sentinelRef.current &&
        typeof sentinelRef.current.release === "function"
      ) {
        await sentinelRef.current.release();
      }
    } catch {
      // ignore
    } finally {
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  const request = useCallback(async () => {
    if (!isSupported) return false;
    if (sentinelRef.current) {
      // already active
      return true;
    }
    try {
      const nav = navigator as NavigatorWithWakeLock;
      if (!nav.wakeLock) {
        throw Object.assign(new Error("Wake Lock not supported"), {
          name: "NotSupportedError",
        });
      }
      const sentinel = await nav.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      setError(null);
      setIsActive(true);

      // When the lock gets released by the UA (e.g., tab hidden), update state
      sentinel.addEventListener("release", () => {
        setIsActive(false);
        sentinelRef.current = null;
      });
      return true;
    } catch (e) {
      const err = e as Error & { name?: string };
      setError(err);
      setIsActive(false);

      // Some browsers require a user gesture to request wake lock
      if (err?.name === "NotAllowedError") {
        // Attach a one-time pointerdown listener to retry
        const onGesture = async () => {
          window.removeEventListener("pointerdown", onGesture);
          gestureRetryRef.current = null;
          await request();
        };
        gestureRetryRef.current = onGesture;
        window.addEventListener("pointerdown", onGesture, { once: true });
      }

      return false;
    }
  }, [isSupported]);

  // Manage lifecycle based on `active`
  useEffect(() => {
    if (!isSupported) return;

    const ensure = async () => {
      if (active) {
        await request();
      } else {
        await release();
      }
    };

    ensure();

    const onVisibility = async () => {
      if (document.visibilityState === "visible" && active) {
        await request();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      // Only release when effect truly disables the hook or unmounts
      if (!active) {
        // already released above
        return;
      }
      // Release on unmount
      release();
      // Clean up any gesture listener
      if (gestureRetryRef.current) {
        window.removeEventListener("pointerdown", gestureRetryRef.current);
        gestureRetryRef.current = null;
      }
    };
  }, [active, isSupported, release, request]);

  return { isSupported, isActive, error, request, release } as const;
}

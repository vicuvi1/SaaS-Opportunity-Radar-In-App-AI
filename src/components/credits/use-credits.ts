"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async (retries = 3) => {
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = (await res.json()) as { credits: number };
        setCredits(data.credits);
      } else if (res.status === 401 && retries > 0) {
        // Auth cookie not ready yet (e.g. right after OAuth redirect) — retry
        setTimeout(() => void refresh(retries - 1), 800);
        return;
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // After a purchase redirect (?credits=purchased), refresh balance once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("credits") === "purchased") {
      void refresh();
      // Clean the query param without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("credits");
      window.history.replaceState({}, "", url.toString());
    }
  }, [refresh]);

  return { credits, loading, refresh };
}

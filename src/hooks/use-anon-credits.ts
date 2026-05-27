"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Fetches the anonymous credit balance for a given fingerprint ID.
 * Only fetches when fingerprintId is non-null.
 */
export function useAnonCredits(fingerprintId: string | null) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!fingerprintId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/credits/anonymous", {
        headers: { "x-anon-fp": fingerprintId },
      });
      if (res.ok) {
        const data = (await res.json()) as { credits: number };
        setCredits(data.credits);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [fingerprintId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { credits, loading, refresh };
}

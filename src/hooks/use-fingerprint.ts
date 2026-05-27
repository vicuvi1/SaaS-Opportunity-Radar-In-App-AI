"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "founderhq_anon_fp";

/**
 * Computes a device fingerprint from hardware signals that survive storage clears.
 * Canvas rendering differs per GPU + font stack. WebGL exposes GPU model directly.
 * Combined with screen/timezone/platform these produce a stable per-device ID.
 */
async function computeDeviceFingerprint(): Promise<string> {
  const signals: string[] = [];

  // Canvas fingerprint — pixel output varies by GPU renderer and font engine
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f04e30";
      ctx.fillRect(10, 1, 100, 28);
      ctx.fillStyle = "#1a73e8";
      ctx.font = "bold 14px Arial, sans-serif";
      ctx.fillText("FounderHQ \u{1F680}", 4, 22);
      ctx.fillStyle = "rgba(80, 200, 80, 0.8)";
      ctx.font = "italic 18px Georgia, serif";
      ctx.fillText("FounderHQ \u{1F4A1}", 6, 52);
      signals.push(canvas.toDataURL("image/png"));
    }
  } catch { /* canvas blocked */ }

  // WebGL GPU info — directly exposes the physical graphics card
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        signals.push(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string);
        signals.push(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) as string);
      }
    }
  } catch { /* webgl blocked */ }

  // Stable device signals
  signals.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  signals.push(navigator.language);
  signals.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  signals.push(navigator.platform);
  signals.push(String(navigator.hardwareConcurrency ?? ""));

  const combined = signals.filter(Boolean).join("|");
  const encoded = new TextEncoder().encode(combined);
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Returns a stable device fingerprint ID.
 * Computed from hardware signals so it survives localStorage/cookie clears
 * and is consistent across browser profiles on the same machine.
 * Cached in localStorage for performance — if cleared, recomputes the same value.
 */
export function useFingerprint(): string | null {
  const [fingerprintId, setFingerprintId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  useEffect(() => {
    if (fingerprintId) return;
    computeDeviceFingerprint().then((id) => {
      try { localStorage.setItem(STORAGE_KEY, id); } catch { /* blocked */ }
      setFingerprintId(id);
    });
  }, [fingerprintId]);

  return fingerprintId;
}

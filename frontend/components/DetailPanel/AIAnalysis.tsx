"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { buildBackendUrl } from "@/lib/backendUrl";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type AnalysisStatus = "idle" | "loading" | "loaded" | "error";

type CachePayload = {
  entityId: string;
  summary: string;
  timestamp: number;
};

function cacheKey(entityId: string) {
  return `godseye:ai:${entityId}`;
}

function readCache(entityId: string): CachePayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cacheKey(entityId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CachePayload>;
    if (
      parsed.entityId !== entityId ||
      typeof parsed.summary !== "string" ||
      typeof parsed.timestamp !== "number"
    ) {
      return null;
    }

    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      return null;
    }

    return {
      entityId,
      summary: parsed.summary,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

function writeCache(entityId: string, summary: string, timestamp: number) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: CachePayload = {
    entityId,
    summary,
    timestamp,
  };

  try {
    window.localStorage.setItem(cacheKey(entityId), JSON.stringify(payload));
  } catch {
    // Ignore quota and storage errors; the UI still works without cache persistence.
  }
}

function minutesAgo(timestamp: number): number {
  return Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
}

interface AIAnalysisProps {
  entityId: string | null;
}

export default function AIAnalysis({ entityId }: AIAnalysisProps) {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [summary, setSummary] = useState("");
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    if (!entityId) {
      setStatus("idle");
      setSummary("");
      setGeneratedAt(null);
      setCached(false);
      return;
    }

    const cachedResult = readCache(entityId);
    if (cachedResult) {
      setSummary(cachedResult.summary);
      setGeneratedAt(cachedResult.timestamp);
      setCached(true);
      setStatus("loaded");
      return;
    }

    setStatus("idle");
    setSummary("");
    setGeneratedAt(null);
    setCached(false);
  }, [entityId]);

  const runAnalysis = async () => {
    if (!entityId || status === "loading") {
      return;
    }

    setStatus("loading");
    setCached(false);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const response = await fetch(buildBackendUrl(`/api/analysis/${encodeURIComponent(entityId)}`), {
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("AI analysis request failed");
      }

      const payload = (await response.json()) as { summary?: string };
      if (typeof payload.summary !== "string" || payload.summary.trim().length === 0) {
        throw new Error("AI analysis response missing summary");
      }

      const timestamp = Date.now();
      writeCache(entityId, payload.summary, timestamp);
      setSummary(payload.summary);
      setGeneratedAt(timestamp);
      setStatus("loaded");
      setCached(false);
    } catch {
      setStatus("error");
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  return (
    <section>
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
        AI Analysis
      </h3>

      {status === "idle" && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={runAnalysis}
            className="h-10 w-full rounded-md bg-[#166534] text-[13px] font-semibold text-[#22C55E] transition-colors hover:bg-[#1f7a46]"
          >
            ANALYSE WITH AI -&gt;
          </button>
          <p className="text-[11px] text-[#64748B]">Powered by Groq + Firecrawl</p>
        </div>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-2 rounded-lg border border-[#1E2130] bg-[#141824] px-3 py-3 text-sm text-[#64748B]">
          <LoaderCircle size={16} className="animate-spin text-[#22C55E]" />
          <span>Analysing with AI...</span>
        </div>
      )}

      {status === "loaded" && (
        <div className="space-y-3 rounded-lg border border-[#1E2130] bg-[#141824] p-3">
          <p className="text-[13px] leading-[1.6] text-[#F8FAFC]">{summary}</p>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#64748B]">
            {generatedAt ? <span>Generated {minutesAgo(generatedAt)} min ago</span> : <span>Generated now</span>}
            {cached && (
              <span className="rounded border border-[#22C55E]/30 px-1.5 py-0.5 text-[9px] text-[#22C55E]">
                CACHED
              </span>
            )}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2 rounded-lg border border-[#1E2130] bg-[#141824] p-3">
          <p className="text-sm text-[#64748B]">Analysis unavailable.</p>
          <button
            type="button"
            onClick={runAnalysis}
            className="inline-flex items-center gap-2 text-xs text-[#22C55E] hover:text-[#86efac]"
          >
            <RotateCcw size={12} />
            Retry
          </button>
        </div>
      )}
    </section>
  );
}

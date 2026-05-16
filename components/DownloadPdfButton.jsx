"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client.js";

// Auth-gated PDF download. Renders nothing for signed-out users.
// Once Week 2 auth UI lands, signed-in users will see this button below
// their result. Pay-gate (post-checkout only) lands in Week 4.
export default function DownloadPdfButton({ sajuResultId }) {
  const [authedUser, setAuthedUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setAuthedUser(data?.user ?? null);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setAuthedUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  if (!authReady || !authedUser || !sajuResultId) return null;

  async function handleClick() {
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/render-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sajuResultId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
      setStatus("idle");
    } catch (err) {
      console.error("[DownloadPdfButton] failed:", err);
      setErrorMsg(err.message || "Something went wrong.");
      setStatus("error");
    }
  }

  const isLoading = status === "loading";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="group inline-flex items-center gap-3 px-6 py-3 bg-ink text-paper hover:bg-vermilion transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <DownloadIcon className="w-4 h-4" />
        <span className="font-sans text-sm uppercase tracking-widest">
          {isLoading ? "PDF 생성 중…" : "Download your PDF"}
        </span>
      </button>

      {status === "error" && errorMsg ? (
        <p className="font-serif text-sm text-vermilion">{errorMsg}</p>
      ) : null}
    </div>
  );
}

function DownloadIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 4v12" strokeLinecap="round" />
      <polyline points="7,11 12,16 17,11" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="4" y1="20" x2="20" y2="20" strokeLinecap="round" />
    </svg>
  );
}

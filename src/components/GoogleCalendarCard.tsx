"use client";

import { useState } from "react";

export function GoogleCalendarCard({ connected }: { connected: boolean }) {
  const [status, setStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function sync() {
    setSyncing(true);
    setStatus(null);
    try {
      const res = await fetch("/api/google/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sync failed");
      setStatus(`Synced ${json.synced} session${json.synced === 1 ? "" : "s"} to Google Calendar.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Google Calendar</div>
          <p className="mt-1 text-sm text-slate-400">
            Connect to read what&apos;s already on your calendar and push the training plan onto it.
          </p>
        </div>
        <a
          href="/api/google/login"
          className="whitespace-nowrap rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Connect Google
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Google Calendar</div>
          <p className="mt-1 text-sm text-slate-400">
            Push the current training plan onto your calendar. Re-syncing updates existing events
            instead of duplicating them.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={sync}
            disabled={syncing}
            className="whitespace-nowrap rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync plan"}
          </button>
          <a href="/api/google/logout" className="text-xs text-slate-500 underline">
            Disconnect
          </a>
        </div>
      </div>
      {status && <p className="mt-2 text-sm text-slate-300">{status}</p>}
    </div>
  );
}

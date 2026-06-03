"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { RefreshCw, Save, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

interface GoogleSheetsSyncCardProps {
  serviceAccountEmail: string;
  initialSpreadsheetId: string;
  initialLastSyncedAt: string;
}

export function GoogleSheetsSyncCard({
  serviceAccountEmail,
  initialSpreadsheetId,
  initialLastSyncedAt,
}: GoogleSheetsSyncCardProps) {
  const [spreadsheetId, setSpreadsheetId] = useState(initialSpreadsheetId);
  const [lastSyncedAt, setLastSyncedAt] = useState(initialLastSyncedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save spreadsheet ID");

      setMessage({ type: "success", text: "Spreadsheet ID saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred while saving." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    if (!spreadsheetId.trim()) {
      setMessage({ type: "error", text: "Please enter and save a Spreadsheet ID first." });
      return;
    }

    setIsSyncing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", spreadsheetId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync with Google Sheets");

      setLastSyncedAt(data.lastSyncedAt);
      setMessage({
        type: "success",
        text: data.message || "Sync completed successfully!",
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred during sync." });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Google Sheets Synchronization
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Export all booking and performance details to a target Google Spreadsheet.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gold flex items-center gap-1 hover:underline shrink-0"
            >
              Open Sheet <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <Button
            onClick={handleSync}
            disabled={isSyncing || isSaving}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: config form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="flex gap-2 items-end">
            <div className="flex-1">
              <label htmlFor="spreadsheetId" className="block text-xs font-semibold text-gray-500 mb-1.5">
                Google Spreadsheet ID
              </label>
              <Input
                id="spreadsheetId"
                placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                required
                className="bg-white border-gray-300"
              />
            </div>
            <Button type="submit" variant="secondary" disabled={isSaving || isSyncing} className="flex items-center gap-1.5 shrink-0">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-md flex items-start gap-2.5 text-sm ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {lastSyncedAt && (
            <p className="text-gray-500 text-xs mt-3.5">
              <strong>Last successful sync:</strong>{" "}
              {format(new Date(lastSyncedAt), "MMMM d, yyyy 'at' h:mm:ss a")}
            </p>
          )}
        </div>

        {/* Right side: Instructions */}
        <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Setup Instructions
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              To allow synchronization, please ensure you share your Google Spreadsheet with the Service Account email as an <strong>Editor</strong>:
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded p-2 mt-2 font-mono text-[10px] break-all select-all text-gray-700">
              {serviceAccountEmail || "Loading service email..."}
            </div>
          </div>
          {!serviceAccountEmail && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Service account email is not configured in .env!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

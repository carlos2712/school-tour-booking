"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";

interface SettingsFormProps {
  initialEmails: string[];
}

export function SettingsForm({ initialEmails }: SettingsFormProps) {
  const [emails, setEmails] = useState<string[]>(initialEmails);
  const [newEmail, setNewEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Test email state
  const [testingEmail, setTestingEmail] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ email: string; success: boolean; message: string } | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleAddEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!clean) return;

    if (!isValidEmail(clean)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (emails.includes(clean)) {
      setErrorMessage("This email is already in the recipient list.");
      return;
    }

    setEmails([...emails, clean]);
    setNewEmail("");
    setErrorMessage(null);
    setSavedMessage(null);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
    setSavedMessage(null);
  };

  const handleSave = () => {
    setErrorMessage(null);
    setSavedMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminNotificationEmails: emails }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to save settings");
        }

        setEmails(data.adminNotificationEmails || emails);
        setSavedMessage("Notification email list saved successfully!");
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred while saving.");
      }
    });
  };

  const handleSendTestEmail = async (targetEmail: string) => {
    setTestingEmail(targetEmail);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send test email");
      }

      setTestResult({
        email: targetEmail,
        success: true,
        message: `Test notification email successfully sent to ${targetEmail}!`,
      });
    } catch (err: any) {
      setTestResult({
        email: targetEmail,
        success: false,
        message: err.message || `Failed to send test email to ${targetEmail}.`,
      });
    } finally {
      setTestingEmail(null);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Messages */}
      {savedMessage && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {testResult && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg border text-sm ${
            testResult.success
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Email Notification List Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gold" />
            Booking Notification Recipients
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Whenever a new school tour booking is completed, an instant notification email will be sent to all email addresses in this list.
          </p>
        </div>

        {/* Add Email Form */}
        <form onSubmit={handleAddEmail} className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="new-email" className="sr-only">
              Add Email Address
            </Label>
            <Input
              id="new-email"
              type="email"
              placeholder="e.g. staff@americanstage.org"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" variant="secondary" className="gap-1.5 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Add Recipient
          </Button>
        </form>

        {/* Email List */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
            Active Recipients ({emails.length})
          </Label>

          {emails.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-gray-300 text-center text-sm text-gray-500">
              No custom admin email addresses configured. The system will default to the primary admin email.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
              {emails.map((email, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-gold/10 text-gold font-medium text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendTestEmail(email)}
                      disabled={testingEmail === email}
                      className="text-xs text-gray-600 hover:text-gold gap-1"
                      title="Send test email"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {testingEmail === email ? "Sending..." : "Test"}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEmail(idx)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 h-8 w-8"
                      title="Remove recipient"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-gold hover:bg-gold/90 text-white font-medium px-6"
          >
            {isPending ? "Saving..." : "Save Notification Settings"}
          </Button>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-xs text-gray-600 space-y-2">
        <p className="font-semibold text-gray-900 text-sm">Customer Confirmation Emails</p>
        <p>
          Confirmation emails are automatically generated and sent directly to the school contact person's email address supplied during booking.
        </p>
        <p>
          You can also resend a booking confirmation to any school contact at any time from the <a href="/admin/bookings" className="text-gold hover:underline font-medium">Bookings Dashboard</a>.
        </p>
      </div>
    </div>
  );
}

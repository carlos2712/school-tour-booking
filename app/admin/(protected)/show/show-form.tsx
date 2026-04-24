"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, GripVertical } from "lucide-react";

type QuestionType = "TEXT" | "RADIO" | "CHECKBOX" | "SELECT";

interface CustomQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  isRequired: boolean;
  order: number;
}

interface Show {
  id: string;
  title: string;
  description: string;
  images: string[];
  isActive: boolean;
  fullFeeAmount: number;
  enableFree: boolean;
  enablePwyw: boolean;
  enableFullFee: boolean;
  customQuestions: CustomQuestion[];
}

interface Props {
  show: Show | null;
}

export function ShowForm({ show }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(show?.title ?? "");
  const [description, setDescription] = useState(show?.description ?? "");
  const [fullFeeAmount, setFullFeeAmount] = useState(show?.fullFeeAmount ?? 550);
  const [enableFree, setEnableFree] = useState(show?.enableFree ?? true);
  const [enablePwyw, setEnablePwyw] = useState(show?.enablePwyw ?? true);
  const [enableFullFee, setEnableFullFee] = useState(show?.enableFullFee ?? true);
  const [questions, setQuestions] = useState<Omit<CustomQuestion, "order">[]>(
    show?.customQuestions ?? []
  );
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>(show?.images ?? []);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "", type: "TEXT", options: [], isRequired: false },
    ]);
  }

  function updateQuestion(id: string, updates: Partial<Omit<CustomQuestion, "order">>) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function addImage() {
    if (imageUrl.trim()) {
      setImages((prev) => [...prev, imageUrl.trim()]);
      setImageUrl("");
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/show", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: show?.id,
            title,
            description,
            images,
            fullFeeAmount,
            enableFree,
            enablePwyw,
            enableFullFee,
            questions: questions.map((q, i) => ({ ...q, order: i })),
          }),
        });
        if (!res.ok) throw new Error("Failed to save");
        setSaved(true);
      } catch {
        setError("Failed to save show. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Basic info */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-white border-b border-navy-light pb-2">
          Basic Information
        </h2>
        <div className="space-y-1.5">
          <Label>Show Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. POLKADOTS: The Cool Kids Musical" />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the show for schools visiting your booking page…"
            className="min-h-[120px]"
          />
        </div>
      </section>

      {/* Images */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-navy-light pb-2">
          Show Images
        </h2>
        <p className="text-gray-400 text-sm">Add image URLs (from Vercel Blob or any public URL).</p>
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => e.key === "Enter" && addImage()}
          />
          <Button type="button" onClick={addImage} size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {images.length > 0 && (
          <div className="space-y-2">
            {images.map((url, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-navy-light rounded-md px-3 py-2">
                <span className="flex-1 truncate text-gray-300">{url}</span>
                {i === 0 && (
                  <span className="text-xs text-gold bg-gold/10 px-2 py-0.5 rounded-full">Hero</span>
                )}
                <button type="button" onClick={() => removeImage(i)} className="text-gray-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white border-b border-navy-light pb-2">
          Pricing Options
        </h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableFree}
              onChange={(e) => setEnableFree(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            <span className="text-white text-sm">Enable Free Performance option</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enablePwyw}
              onChange={(e) => setEnablePwyw(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            <span className="text-white text-sm">Enable Pay What You Can option</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableFullFee}
              onChange={(e) => setEnableFullFee(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            <span className="text-white text-sm">Enable Full Fee option</span>
          </label>
        </div>
        {enableFullFee && (
          <div className="space-y-1.5">
            <Label>Full Fee Amount ($)</Label>
            <Input
              type="number"
              value={fullFeeAmount}
              onChange={(e) => setFullFeeAmount(Number(e.target.value))}
              className="max-w-xs"
            />
          </div>
        )}
      </section>

      {/* Custom Questions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-navy-light pb-2">
          <h2 className="text-lg font-semibold text-white">Custom Questions</h2>
          <Button type="button" onClick={addQuestion} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" /> Add Question
          </Button>
        </div>

        {questions.length === 0 && (
          <p className="text-gray-500 text-sm">No custom questions yet.</p>
        )}

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="border border-navy-light rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-400">Question {idx + 1}</span>
                <div className="flex-1" />
                <button type="button" onClick={() => removeQuestion(q.id)} className="text-gray-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <Label>Question Text</Label>
                <Input
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                  placeholder="e.g. Do you have accessibility requirements?"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                    className="h-10 px-3 rounded-md border border-navy-light bg-navy-light text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="TEXT">Text</option>
                    <option value="RADIO">Radio (single select)</option>
                    <option value="CHECKBOX">Checkbox (multi select)</option>
                    <option value="SELECT">Dropdown</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input
                    type="checkbox"
                    checked={q.isRequired}
                    onChange={(e) => updateQuestion(q.id, { isRequired: e.target.checked })}
                    className="accent-gold w-4 h-4"
                  />
                  <span className="text-white text-sm">Required</span>
                </label>
              </div>

              {(q.type === "RADIO" || q.type === "CHECKBOX" || q.type === "SELECT") && (
                <div className="space-y-1.5">
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={q.options.join("\n")}
                    onChange={(e) =>
                      updateQuestion(q.id, {
                        options: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    className="min-h-[80px] font-mono text-xs"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {saved && (
        <p className="text-emerald-400 text-sm">Show saved successfully!</p>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button onClick={handleSave} disabled={isPending || !title} size="lg">
        {isPending ? "Saving…" : "Save Show"}
      </Button>
    </div>
  );
}

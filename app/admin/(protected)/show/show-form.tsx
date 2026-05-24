"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";

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
  enablePinellasCounty: boolean;
  enableHillsboroughCounty: boolean;
  enableIndependentPrivate: boolean;
  enablePwyw: boolean;
  amStartTime: string;
  amEndTime: string;
  pmStartTime: string;
  pmEndTime: string;
  maxStudents: number;
  doubleBookingDiscountPercent: number;
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
  const [enablePinellasCounty, setEnablePinellasCounty] = useState(show?.enablePinellasCounty ?? true);
  const [enableHillsboroughCounty, setEnableHillsboroughCounty] = useState(show?.enableHillsboroughCounty ?? true);
  const [enableIndependentPrivate, setEnableIndependentPrivate] = useState(show?.enableIndependentPrivate ?? true);
  const [enablePwyw, setEnablePwyw] = useState(show?.enablePwyw ?? true);
  const [amStartTime, setAmStartTime] = useState(show?.amStartTime ?? "08:00");
  const [amEndTime, setAmEndTime] = useState(show?.amEndTime ?? "12:00");
  const [pmStartTime, setPmStartTime] = useState(show?.pmStartTime ?? "12:00");
  const [pmEndTime, setPmEndTime] = useState(show?.pmEndTime ?? "16:00");
  const [maxStudents, setMaxStudents] = useState(show?.maxStudents ?? 200);
  const [doubleBookingDiscountPercent, setDoubleBookingDiscountPercent] = useState(show?.doubleBookingDiscountPercent ?? 0);
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
            enablePinellasCounty,
            enableHillsboroughCounty,
            enableIndependentPrivate,
            enablePwyw,
            amStartTime,
            amEndTime,
            pmStartTime,
            pmEndTime,
            maxStudents,
            doubleBookingDiscountPercent,
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
        <h2 className="text-lg font-semibold text-foreground border-b border-gray-200 pb-2">
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
        <div className="space-y-1.5">
          <Label>Max Students Per Performance *</Label>
          <Input 
            type="number"
            min={1}
            value={maxStudents}
            onChange={(e) => setMaxStudents(parseInt(e.target.value) || 200)}
            className="max-w-xs"
          />
        </div>
      </section>

      {/* Images */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b border-gray-200 pb-2">
          Show Images
        </h2>
        <p className="text-gray-500 text-sm">Add image URLs or upload files directly to Vercel Blob.</p>
        
        {/* Modern Interactive Image Uploader */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upload Show Poster</Label>
          <ImageUploader
            onUploadSuccess={(url) => {
              setImages((prev) => [...prev, url]);
            }}
          />
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-wider font-semibold">Or enter manually</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

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
              <div key={i} className="flex items-center gap-2 text-sm bg-gray-100 rounded-md px-3 py-2">
                <span className="flex-1 truncate text-gray-600">{url}</span>
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
        <h2 className="text-lg font-semibold text-foreground border-b border-gray-200 pb-2">
          Pricing Options
        </h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enablePinellasCounty}
              onChange={(e) => setEnablePinellasCounty(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            <span className="text-foreground text-sm">Enable Pinellas County (Fully funded) option</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableHillsboroughCounty}
              onChange={(e) => setEnableHillsboroughCounty(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            <span className="text-foreground text-sm">Enable Hillsborough County (Regular fee) option</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableIndependentPrivate}
              onChange={(e) => setEnableIndependentPrivate(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            <span className="text-foreground text-sm">Enable Independent & Private schools (Regular fee) option</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enablePwyw}
              onChange={(e) => setEnablePwyw(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            <span className="text-foreground text-sm">Enable Pay What You Can option</span>
          </label>
        </div>
        {(enableHillsboroughCounty || enableIndependentPrivate) && (
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
        <div className="space-y-1.5 mt-3">
          <Label>Double Booking Discount (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={doubleBookingDiscountPercent}
            onChange={(e) => setDoubleBookingDiscountPercent(Number(e.target.value))}
            className="max-w-xs"
          />
          <p className="text-xs text-gray-500">Discount applied when a school books 2 performances.</p>
        </div>
      </section>

      {/* Time Slots */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b border-gray-200 pb-2">
          Time Slots Settings
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">AM Slot</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={amStartTime}
                  onChange={(e) => setAmStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={amEndTime}
                  onChange={(e) => setAmEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">PM Slot</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={pmStartTime}
                  onChange={(e) => setPmStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={pmEndTime}
                  onChange={(e) => setPmEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Questions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h2 className="text-lg font-semibold text-foreground">Custom Questions</h2>
          <Button type="button" onClick={addQuestion} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" /> Add Question
          </Button>
        </div>

        {questions.length === 0 && (
          <p className="text-gray-500 text-sm">No custom questions yet.</p>
        )}

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">Question {idx + 1}</span>
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
                    className="h-10 px-3 rounded-md border border-gray-200 bg-gray-100 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold"
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
                  <span className="text-foreground text-sm">Required</span>
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

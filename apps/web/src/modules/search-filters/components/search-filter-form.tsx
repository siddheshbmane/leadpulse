"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  useSearchFilter,
  useCreateSearchFilter,
  useUpdateSearchFilter,
} from "../hooks/use-search-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const SOURCES = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "google_maps", label: "Google Maps" },
  { id: "reddit", label: "Reddit" },
];

const INTERVALS = [
  { value: 0, label: "Manual only" },
  { value: 60, label: "Every hour" },
  { value: 360, label: "Every 6 hours" },
  { value: 720, label: "Every 12 hours" },
  { value: 1440, label: "Daily" },
  { value: 10080, label: "Weekly" },
];

type Props = {
  editingId: string | null;
  onSuccess: () => void;
};

export function SearchFilterForm({ editingId, onSuccess }: Props) {
  const { data: existingData } = useSearchFilter(editingId);
  const createFilter = useCreateSearchFilter();
  const updateFilter = useUpdateSearchFilter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [runEveryMinutes, setRunEveryMinutes] = useState(0);
  const [keywords, setKeywords] = useState("");
  const [jobTitles, setJobTitles] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (existingData?.data) {
      const d = existingData.data as Record<string, unknown>;
      setName((d.name as string) ?? "");
      setDescription((d.description as string) ?? "");
      setSources((d.sources as string[]) ?? []);
      setIsActive((d.isActive as boolean) ?? true);
      setRunEveryMinutes((d.runEveryMinutes as number) ?? 0);
      const query = (d.query as Record<string, unknown>) ?? {};
      setKeywords(((query.keywords as string[]) ?? []).join(", "));
      setJobTitles(((query.jobTitles as string[]) ?? []).join(", "));
      setLocation((query.location as string) ?? "");
    }
  }, [existingData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (sources.length === 0) {
      toast.error("Select at least one source");
      return;
    }

    const query: Record<string, unknown> = {};
    if (keywords.trim())
      query.keywords = keywords.split(",").map((s) => s.trim());
    if (jobTitles.trim())
      query.jobTitles = jobTitles.split(",").map((s) => s.trim());
    if (location.trim()) query.location = location.trim();

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      sources,
      query,
      isActive,
      runEveryMinutes: runEveryMinutes || undefined,
    };

    if (editingId) {
      updateFilter.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast.success("Filter updated");
            onSuccess();
          },
          onError: () => toast.error("Failed to update filter"),
        }
      );
    } else {
      createFilter.mutate(payload, {
        onSuccess: () => {
          toast.success("Filter created");
          onSuccess();
        },
        onError: () => toast.error("Failed to create filter"),
      });
    }
  };

  const isPending = createFilter.isPending || updateFilter.isPending;

  const toggleSource = (source: string) => {
    setSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Series A CTOs in India"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What kind of leads are you looking for?"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Sources</Label>
        <div className="flex flex-wrap gap-3">
          {SOURCES.map((source) => (
            <label
              key={source.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={sources.includes(source.id)}
                onCheckedChange={() => toggleSource(source.id)}
              />
              <span className="text-sm">{source.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
        <Input
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Series A, CTO, Funding"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitles">Job Titles (comma-separated)</Label>
        <Input
          id="jobTitles"
          value={jobTitles}
          onChange={(e) => setJobTitles(e.target.value)}
          placeholder="CTO, VP Engineering, Head of Product"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="India, San Francisco, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="interval">Run Interval</Label>
        <select
          id="interval"
          value={runEveryMinutes}
          onChange={(e) => setRunEveryMinutes(Number(e.target.value))}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          {INTERVALS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isActive">Active</Label>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 size={16} className="mr-1.5 animate-spin" />}
        {editingId ? "Update Filter" : "Create Filter"}
      </Button>
    </form>
  );
}

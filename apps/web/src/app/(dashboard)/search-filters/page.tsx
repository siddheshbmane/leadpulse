"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useSearchFilters,
  useDeleteSearchFilter,
  useRunSearchFilter,
} from "@/modules/search-filters/hooks/use-search-filters";
import {
  Plus,
  Play,
  Trash2,
  Pencil,
  Loader2,
  Filter,
  Clock,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SearchFilterForm } from "@/modules/search-filters/components/search-filter-form";

type SearchFilterData = {
  id: string;
  name: string;
  description: string | null;
  sources: string[];
  isActive: boolean;
  runEveryMinutes: number | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  totalRuns: number;
  totalLeadsFound: number;
  createdAt: string;
};

const SOURCE_BADGES: Record<string, string> = {
  linkedin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  google_maps: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  reddit: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function SearchFiltersPage() {
  const { data, isLoading } = useSearchFilters();
  const deleteFilter = useDeleteSearchFilter();
  const runFilter = useRunSearchFilter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [runningFilterId, setRunningFilterId] = useState<string | null>(null);

  const filters = (data?.data ?? []) as unknown as SearchFilterData[];

  const handleRun = (id: string, name: string) => {
    setRunningFilterId(id);
    runFilter.mutate(id, {
      onSuccess: () => {
        toast.success(`Scraper queued for "${name}"`);
        setRunningFilterId(null);
      },
      onError: () => {
        toast.error("Failed to queue scraper");
        setRunningFilterId(null);
      },
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteFilter.mutate(id, {
      onSuccess: () => toast.success(`"${name}" deleted`),
      onError: () => toast.error("Failed to delete filter"),
    });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            Search Filters
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure your lead discovery criteria.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setDialogOpen(true);
          }}
          size="sm"
        >
          <Plus size={16} className="mr-1.5" />
          New Filter
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter
              size={40}
              className="mx-auto text-muted-foreground/30 mb-4"
            />
            <p className="text-muted-foreground mb-4">
              No search filters yet. Create one to start discovering leads.
            </p>
            <Button
              onClick={() => {
                setEditingId(null);
                setDialogOpen(true);
              }}
              size="sm"
            >
              <Plus size={16} className="mr-1.5" />
              Create Filter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filters.map((filter) => (
            <Card
              key={filter.id}
              className="group hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {filter.name}
                    </h3>
                    {filter.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {filter.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] ml-2 shrink-0",
                      filter.isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {filter.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>

                {/* Sources */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {filter.sources.map((source) => (
                    <Badge
                      key={source}
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        SOURCE_BADGES[source] ??
                          "border-border text-muted-foreground"
                      )}
                    >
                      {source.replace("_", " ")}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div>
                    <div className="text-lg font-bold font-mono text-foreground">
                      {filter.totalLeadsFound}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">
                      Leads
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-mono text-foreground">
                      {filter.totalRuns}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">
                      Runs
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-mono text-foreground">
                      {filter.runEveryMinutes
                        ? `${Math.round(filter.runEveryMinutes / 60)}h`
                        : "—"}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">
                      Interval
                    </div>
                  </div>
                </div>

                {/* Last run */}
                {filter.lastRunAt && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <Clock size={12} />
                    Last run{" "}
                    {new Date(filter.lastRunAt).toLocaleDateString()}
                    {filter.lastRunStatus && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1 py-0",
                          filter.lastRunStatus === "success"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        )}
                      >
                        {filter.lastRunStatus}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs flex-1"
                    onClick={() => handleRun(filter.id, filter.name)}
                    disabled={runningFilterId === filter.id}
                  >
                    {runningFilterId === filter.id ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : (
                      <Play size={14} className="mr-1" />
                    )}
                    Run
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingId(filter.id);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(filter.id, filter.name)}
                    disabled={deleteFilter.isPending}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Search Filter" : "New Search Filter"}
            </DialogTitle>
          </DialogHeader>
          <SearchFilterForm
            editingId={editingId}
            onSuccess={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

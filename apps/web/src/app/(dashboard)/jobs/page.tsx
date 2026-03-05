"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useJobs } from "@/modules/jobs/hooks/use-jobs";
import { useJobStream } from "@/modules/jobs/hooks/use-job-stream";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Radio,
  Activity,
  Terminal,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type Job = {
  id: string;
  searchFilterId: string;
  searchFilterName: string;
  status: string;
  source: string;
  leadsFound: number;
  leadsNew: number;
  creditsUsed: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
};

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; bg: string; label: string; pulse?: boolean }
> = {
  PENDING: {
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 text-yellow-400",
    label: "Queued",
    pulse: true,
  },
  RUNNING: {
    icon: Loader2,
    color: "text-blue-400",
    bg: "bg-blue-500/10 text-blue-400",
    label: "Running",
    pulse: true,
  },
  SUCCESS: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 text-emerald-400",
    label: "Complete",
  },
  ERROR: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 text-red-400",
    label: "Failed",
  },
  CANCELLED: {
    icon: AlertCircle,
    color: "text-muted-foreground",
    bg: "bg-muted text-muted-foreground",
    label: "Cancelled",
  },
};

const SOURCE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  google_maps: "Google Maps",
  reddit: "Reddit",
};

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return `${minutes}m ${remainingSecs}s`;
}

function LiveDot({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  );
}

export default function JobsPage() {
  const { data, isLoading, dataUpdatedAt } = useJobs();
  const jobs = (data?.data ?? []) as unknown as Job[];
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const onJobComplete = useCallback((job: { id: string; status: string; leadsNew: number; error: string | null }) => {
    if (job.status === "SUCCESS") {
      toast.success(`Job completed — ${job.leadsNew} new lead${job.leadsNew !== 1 ? "s" : ""} found`);
    } else if (job.status === "ERROR") {
      toast.error(`Job failed: ${job.error || "Unknown error"}`);
    }
  }, []);

  useJobStream({ onJobComplete });

  // Tick every second for live timestamps
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(
    (j) => j.status === "RUNNING" || j.status === "PENDING"
  ).length;
  const completedJobs = jobs.filter((j) => j.status === "SUCCESS").length;
  const failedJobs = jobs.filter((j) => j.status === "ERROR").length;
  const totalLeadsFound = jobs.reduce((acc, j) => acc + j.leadsFound, 0);
  const totalCredits = jobs.reduce((acc, j) => acc + j.creditsUsed, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <Terminal size={28} className="text-primary" />
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            <LiveDot active={activeJobs > 0} />
            {activeJobs > 0
              ? `${activeJobs} active job${activeJobs > 1 ? "s" : ""} running`
              : "All systems idle"}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs text-muted-foreground">Last synced</div>
          <div className="text-xs font-mono text-foreground">
            {dataUpdatedAt
              ? new Date(dataUpdatedAt).toLocaleTimeString()
              : "---"}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Active
                  </span>
                  <Radio size={14} className={activeJobs > 0 ? "text-emerald-500" : "text-muted-foreground"} />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {activeJobs}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  of {totalJobs} total jobs
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Completed
                  </span>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {completedJobs}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {failedJobs > 0
                    ? `${failedJobs} failed`
                    : "0 failures"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Leads Found
                  </span>
                  <Zap size={14} className="text-primary" />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {totalLeadsFound}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all jobs
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Credits Used
                  </span>
                  <Activity size={14} className="text-primary" />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {totalCredits}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total consumption
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Job Timeline */}
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Terminal
                  size={40}
                  className="mx-auto text-muted-foreground/30 mb-4"
                />
                <p className="text-muted-foreground">
                  No jobs yet. Run a search filter to start discovering leads.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} />
                Job Activity Feed
              </h2>
              <div className="space-y-2">
                {jobs.map((job) => {
                  const config =
                    STATUS_CONFIG[job.status] ?? STATUS_CONFIG.CANCELLED;
                  const StatusIcon = config.icon;
                  const isExpanded = expandedJob === job.id;
                  const isActive =
                    job.status === "RUNNING" || job.status === "PENDING";

                  return (
                    <Card
                      key={job.id}
                      className={cn(
                        "transition-all",
                        isActive && "border-primary/20"
                      )}
                    >
                      <CardContent className="p-0">
                        {/* Main Row */}
                        <button
                          onClick={() =>
                            setExpandedJob(isExpanded ? null : job.id)
                          }
                          className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors"
                        >
                          {/* Status indicator */}
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                              config.bg
                            )}
                          >
                            <StatusIcon
                              size={16}
                              className={
                                job.status === "RUNNING" ? "animate-spin" : ""
                              }
                            />
                          </div>

                          {/* Job info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">
                                {job.searchFilterName}
                              </span>
                              {isActive && <LiveDot active />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground capitalize">
                                {SOURCE_LABELS[job.source] ?? job.source}
                              </span>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatTimeAgo(job.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="hidden sm:flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-mono text-foreground">
                                {job.leadsNew}
                                <span className="text-muted-foreground">
                                  /{job.leadsFound}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase">
                                Leads
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono text-foreground">
                                {job.creditsUsed}
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase">
                                Credits
                              </div>
                            </div>
                          </div>

                          {/* Status badge */}
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] gap-1 shrink-0",
                              config.bg
                            )}
                          >
                            {config.label}
                          </Badge>

                          {/* Expand icon */}
                          {isExpanded ? (
                            <ChevronUp
                              size={14}
                              className="text-muted-foreground shrink-0"
                            />
                          ) : (
                            <ChevronDown
                              size={14}
                              className="text-muted-foreground shrink-0"
                            />
                          )}
                        </button>

                        {/* Progress bar for active jobs */}
                        {isActive && (
                          <div className="px-4 pb-0">
                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-1000",
                                  job.status === "PENDING"
                                    ? "w-[10%] bg-yellow-400"
                                    : "bg-blue-400 animate-pulse"
                                )}
                                style={
                                  job.status === "RUNNING"
                                    ? { width: "60%", animationDuration: "2s" }
                                    : undefined
                                }
                              />
                            </div>
                          </div>
                        )}

                        {/* Expanded Detail Panel */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0">
                            <Separator className="mb-4" />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">
                                  Job ID
                                </div>
                                <div className="font-mono text-foreground text-xs truncate">
                                  {job.id.slice(0, 12)}...
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">
                                  Created
                                </div>
                                <div className="text-foreground text-xs">
                                  {new Date(job.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">
                                  Started
                                </div>
                                <div className="text-foreground text-xs">
                                  {job.startedAt
                                    ? new Date(job.startedAt).toLocaleString()
                                    : "Waiting..."}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-0.5">
                                  Duration
                                </div>
                                <div className="text-foreground text-xs font-mono">
                                  {job.startedAt && job.completedAt
                                    ? formatDuration(
                                        job.startedAt,
                                        job.completedAt
                                      )
                                    : job.startedAt
                                      ? "In progress..."
                                      : "—"}
                                </div>
                              </div>
                            </div>

                            {/* Console-like log simulation */}
                            <div className="mt-4 bg-background rounded-lg border border-border p-3 font-mono text-xs space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  [{new Date(job.createdAt).toLocaleTimeString()}]
                                </span>
                                <span className="text-foreground">
                                  Job created for{" "}
                                  <span className="text-primary">
                                    {job.searchFilterName}
                                  </span>{" "}
                                  →{" "}
                                  {SOURCE_LABELS[job.source] ?? job.source}
                                </span>
                              </div>
                              {job.startedAt && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    [
                                    {new Date(
                                      job.startedAt
                                    ).toLocaleTimeString()}
                                    ]
                                  </span>
                                  <span className="text-blue-400">
                                    Scraper started. Scanning{" "}
                                    {SOURCE_LABELS[job.source] ?? job.source}
                                    ...
                                  </span>
                                </div>
                              )}
                              {job.leadsFound > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    [
                                    {new Date(
                                      job.completedAt ?? job.createdAt
                                    ).toLocaleTimeString()}
                                    ]
                                  </span>
                                  <span className="text-emerald-400">
                                    Found {job.leadsFound} leads ({job.leadsNew}{" "}
                                    new)
                                  </span>
                                </div>
                              )}
                              {job.status === "SUCCESS" && job.completedAt && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    [
                                    {new Date(
                                      job.completedAt
                                    ).toLocaleTimeString()}
                                    ]
                                  </span>
                                  <span className="text-emerald-400">
                                    Job completed successfully. Used{" "}
                                    {job.creditsUsed} credits.
                                  </span>
                                </div>
                              )}
                              {job.status === "ERROR" && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    [
                                    {new Date(
                                      job.completedAt ?? job.createdAt
                                    ).toLocaleTimeString()}
                                    ]
                                  </span>
                                  <span className="text-red-400">
                                    ERROR: {job.error || "Unknown error"}
                                  </span>
                                </div>
                              )}
                              {job.status === "PENDING" && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    [
                                    {new Date(
                                      job.createdAt
                                    ).toLocaleTimeString()}
                                    ]
                                  </span>
                                  <span className="text-yellow-400">
                                    Queued. Waiting for available worker slot...
                                  </span>
                                </div>
                              )}
                              {job.status === "RUNNING" && (
                                <div className="flex items-center gap-2">
                                  <Loader2
                                    size={10}
                                    className="animate-spin text-blue-400"
                                  />
                                  <span className="text-blue-400">
                                    Processing...
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

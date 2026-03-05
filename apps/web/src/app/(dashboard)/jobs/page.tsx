"use client";

import { cn } from "@/lib/utils";
import { useJobs } from "@/modules/jobs/hooks/use-jobs";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  { icon: typeof Clock; color: string; label: string }
> = {
  PENDING: {
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-400",
    label: "Pending",
  },
  RUNNING: {
    icon: Loader2,
    color: "bg-blue-500/10 text-blue-400",
    label: "Running",
  },
  SUCCESS: {
    icon: CheckCircle2,
    color: "bg-emerald-500/10 text-emerald-400",
    label: "Success",
  },
  ERROR: {
    icon: XCircle,
    color: "bg-red-500/10 text-red-400",
    label: "Error",
  },
  CANCELLED: {
    icon: AlertCircle,
    color: "bg-muted text-muted-foreground",
    label: "Cancelled",
  },
};

export default function JobsPage() {
  const { data, isLoading } = useJobs();
  const jobs = (data?.data ?? []) as unknown as Job[];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
          Jobs
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Monitor scraping jobs and background tasks.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase
              size={40}
              className="mx-auto text-muted-foreground/30 mb-4"
            />
            <p className="text-muted-foreground">
              No jobs yet. Run a search filter to create scraper jobs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Filter</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Leads</th>
                  <th className="px-4 py-3 font-medium">Credits</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => {
                  const config =
                    STATUS_CONFIG[job.status] ?? STATUS_CONFIG.CANCELLED;
                  const StatusIcon = config.icon;
                  const duration =
                    job.startedAt && job.completedAt
                      ? `${Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s`
                      : "—";

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-foreground">
                          {job.searchFilterName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground capitalize">
                          {job.source.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] gap-1", config.color)}
                        >
                          <StatusIcon
                            size={12}
                            className={
                              job.status === "RUNNING" ? "animate-spin" : ""
                            }
                          />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-muted-foreground">
                          {job.leadsNew}/{job.leadsFound}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-muted-foreground">
                          {job.creditsUsed}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-muted-foreground">
                          {duration}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {jobs.map((job) => {
              const config =
                STATUS_CONFIG[job.status] ?? STATUS_CONFIG.CANCELLED;
              const StatusIcon = config.icon;
              return (
                <div key={job.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {job.searchFilterName}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {job.source.replace("_", " ")}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px] gap-1", config.color)}
                    >
                      <StatusIcon
                        size={12}
                        className={
                          job.status === "RUNNING" ? "animate-spin" : ""
                        }
                      />
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      Leads: {job.leadsNew}/{job.leadsFound}
                    </span>
                    <span>Credits: {job.creditsUsed}</span>
                    <span className="font-mono">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {job.error && (
                    <p className="text-xs text-red-400 mt-1">{job.error}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

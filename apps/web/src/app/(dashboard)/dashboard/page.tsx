"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Activity,
  Users,
  Filter,
  CreditCard,
  TrendingUp,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type DashboardStats = {
  totalLeads: number;
  newLeadsToday: number;
  activeFilters: number;
  creditsRemaining: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  recentActivity: { type: string; message: string; timestamp: string }[];
};

type Lead = {
  id: string;
  personName: string | null;
  companyName: string | null;
  title: string | null;
  source: string;
  status: string;
  score: number | null;
  discoveredAt: string;
};

function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const json = await res.json();
      return json.data as DashboardStats;
    },
  });
}

function useRecentLeads() {
  return useQuery({
    queryKey: ["leads", { pageSize: 5, sortBy: "discoveredAt", sortOrder: "desc" }],
    queryFn: async () => {
      const res = await fetch(
        "/api/v1/leads?pageSize=5&sortBy=discoveredAt&sortOrder=desc"
      );
      if (!res.ok) throw new Error("Failed to fetch leads");
      const json = await res.json();
      return json.data as Lead[];
    },
  });
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-400",
  ENRICHED: "bg-cyan-500/10 text-cyan-400",
  QUALIFIED: "bg-primary/10 text-primary",
  CONTACTED: "bg-yellow-500/10 text-yellow-400",
  WON: "bg-emerald-500/10 text-emerald-400",
  LOST: "bg-red-500/10 text-red-400",
  IGNORED: "bg-muted text-muted-foreground",
};

const SOURCE_COLORS: Record<string, string> = {
  linkedin: "bg-blue-600",
  google_maps: "bg-emerald-600",
  reddit: "bg-orange-600",
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentLeads, isLoading: leadsLoading } = useRecentLeads();

  const statCards = [
    {
      label: "Total Leads",
      value: stats?.totalLeads ?? 0,
      icon: Users,
      href: "/leads",
    },
    {
      label: "New Today",
      value: stats?.newLeadsToday ?? 0,
      icon: TrendingUp,
      href: "/leads?sortBy=discoveredAt",
    },
    {
      label: "Active Filters",
      value: stats?.activeFilters ?? 0,
      icon: Filter,
      href: "/search-filters",
    },
    {
      label: "Credits",
      value: stats?.creditsRemaining?.toLocaleString() ?? "0",
      icon: CreditCard,
      href: "/settings",
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
          Command Center
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Real-time intent signals and lead tracking.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4">
                {statsLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        {card.label}
                      </span>
                      <card.icon size={14} className="text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-foreground font-mono">
                      {card.value}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Leads</CardTitle>
                <Link
                  href="/leads"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowUpRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {leadsLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !recentLeads || recentLeads.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No leads yet. Create a search filter and run a scraper.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {lead.personName || "Unknown"}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              STATUS_COLORS[lead.status] ?? STATUS_COLORS.IGNORED
                            )}
                          >
                            {lead.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {lead.companyName || "No company"}{" "}
                          {lead.title ? `· ${lead.title}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="text-xs text-muted-foreground capitalize">
                          {lead.source.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground/70 font-mono">
                          {new Date(lead.discoveredAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Leads by Source */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leads by Source</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : !stats?.leadsBySource ||
                Object.keys(stats.leadsBySource).length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.leadsBySource).map(([source, count]) => {
                    const total = stats.totalLeads || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={source}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground capitalize">
                            {source.replace("_", " ")}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            {count}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              SOURCE_COLORS[source] ?? "bg-primary"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads by Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leads by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : !stats?.leadsByStatus ||
                Object.keys(stats.leadsByStatus).length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.leadsByStatus).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            STATUS_COLORS[status] ?? STATUS_COLORS.IGNORED
                          )}
                        >
                          {status}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : !stats?.recentActivity ||
                stats.recentActivity.length === 0 ? (
                <div className="relative pl-6 border-l-2 border-border pb-2">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <p className="text-sm text-muted-foreground">
                    Scrapers connected. Create a search filter to begin.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentActivity.map((event, i) => (
                    <div
                      key={i}
                      className="relative pl-6 border-l-2 border-border pb-1"
                    >
                      <div className="absolute -left-[5px] top-1 w-2 h-2 bg-primary rounded-full" />
                      <p className="text-sm text-muted-foreground">
                        {event.message}
                      </p>
                      <span className="text-xs text-muted-foreground/50 font-mono">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

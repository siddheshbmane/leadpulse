"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Zap,
  Target,
  Globe,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  intentSignal: string | null;
  tags: string[];
  city: string | null;
  country: string | null;
  discoveredAt: string;
};

function useIntelligenceData() {
  const stats = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard/stats");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as DashboardStats;
    },
  });

  const leads = useQuery({
    queryKey: ["leads", { pageSize: 100 }],
    queryFn: async () => {
      const res = await fetch("/api/v1/leads?pageSize=100");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as Lead[];
    },
  });

  return { stats: stats.data, leads: leads.data, isLoading: stats.isLoading || leads.isLoading };
}

const SOURCE_COLORS: Record<string, string> = {
  linkedin: "bg-blue-600",
  google_maps: "bg-emerald-600",
  reddit: "bg-orange-600",
};

const SOURCE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  google_maps: "Google Maps",
  reddit: "Reddit",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-500",
  ENRICHED: "bg-cyan-500",
  QUALIFIED: "bg-primary",
  CONTACTED: "bg-yellow-500",
  WON: "bg-emerald-500",
  LOST: "bg-red-500",
  IGNORED: "bg-muted-foreground",
};

export default function IntelligencePage() {
  const { stats, leads, isLoading } = useIntelligenceData();

  // Compute intelligence metrics
  const totalLeads = stats?.totalLeads ?? 0;
  const leadsBySource = stats?.leadsBySource ?? {};
  const leadsByStatus = stats?.leadsByStatus ?? {};

  // Intent signals analysis
  const intentSignals = (leads ?? [])
    .filter((l) => l.intentSignal)
    .map((l) => l.intentSignal!);
  const uniqueSignals = [...new Set(intentSignals)];

  // Top companies
  const companyMap: Record<string, number> = {};
  for (const lead of leads ?? []) {
    if (lead.companyName) {
      companyMap[lead.companyName] = (companyMap[lead.companyName] ?? 0) + 1;
    }
  }
  const topCompanies = Object.entries(companyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top locations
  const locationMap: Record<string, number> = {};
  for (const lead of leads ?? []) {
    const loc = [lead.city, lead.country].filter(Boolean).join(", ");
    if (loc) {
      locationMap[loc] = (locationMap[loc] ?? 0) + 1;
    }
  }
  const topLocations = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top tags
  const tagMap: Record<string, number> = {};
  for (const lead of leads ?? []) {
    for (const tag of lead.tags ?? []) {
      tagMap[tag] = (tagMap[tag] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Average score
  const scores = (leads ?? [])
    .filter((l) => l.score)
    .map((l) => Number(l.score));
  const avgScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : "---";

  // Conversion rate (WON / total)
  const wonCount = leadsByStatus["WON"] ?? 0;
  const conversionRate = totalLeads > 0
    ? ((wonCount / totalLeads) * 100).toFixed(1)
    : "0";

  // Qualified rate
  const qualifiedCount = (leadsByStatus["QUALIFIED"] ?? 0) + wonCount;
  const qualifiedRate = totalLeads > 0
    ? ((qualifiedCount / totalLeads) * 100).toFixed(1)
    : "0";

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Brain size={28} className="text-primary" />
            Intelligence
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            AI-powered insights and intent signal analysis.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Avg Score
                  </span>
                  <Target size={14} className="text-primary" />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {avgScore}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {scores.length} scored leads
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Conversion
                  </span>
                  <TrendingUp size={14} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {conversionRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {wonCount} won of {totalLeads} total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Qualified
                  </span>
                  <Zap size={14} className="text-primary" />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {qualifiedRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {qualifiedCount} qualified or won
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Signals
                  </span>
                  <Brain size={14} className="text-primary" />
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {uniqueSignals.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Unique intent signals detected
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Source Distribution */}
            <div className="lg:col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart size={16} className="text-primary" />
                    Source Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(leadsBySource).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet.</p>
                  ) : (
                    Object.entries(leadsBySource).map(([source, count]) => {
                      const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                      return (
                        <div key={source}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-foreground font-medium">
                              {SOURCE_LABELS[source] ?? source}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-muted-foreground">
                                {count}
                              </span>
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                {pct}%
                              </Badge>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                SOURCE_COLORS[source] ?? "bg-primary"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pipeline Status */}
            <div className="lg:col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 size={16} className="text-primary" />
                    Pipeline Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(leadsByStatus).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet.</p>
                  ) : (
                    Object.entries(leadsByStatus).map(([status, count]) => {
                      const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              STATUS_COLORS[status] ?? "bg-muted-foreground"
                            )}
                          />
                          <span className="text-sm text-foreground flex-1">
                            {status}
                          </span>
                          <span className="text-sm font-mono text-muted-foreground">
                            {count}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground/60 w-10 text-right">
                            {pct}%
                          </span>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Intent Signals */}
            <div className="lg:col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap size={16} className="text-primary" />
                    Intent Signals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {uniqueSignals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No intent signals detected yet.
                    </p>
                  ) : (
                    uniqueSignals.map((signal) => {
                      const count = intentSignals.filter(
                        (s) => s === signal
                      ).length;
                      return (
                        <div
                          key={signal}
                          className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2"
                        >
                          <Zap size={14} className="text-primary shrink-0" />
                          <span className="text-sm text-foreground flex-1 truncate">
                            {signal}
                          </span>
                          <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                            {count}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Companies */}
            <div className="lg:col-span-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    Top Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topCompanies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {topCompanies.map(([company, count], i) => (
                        <div key={company} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-4">
                            {i + 1}
                          </span>
                          <span className="text-sm text-foreground flex-1 truncate">
                            {company}
                          </span>
                          <span className="text-sm font-mono text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Locations */}
            <div className="lg:col-span-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe size={16} className="text-primary" />
                    Top Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topLocations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {topLocations.map(([location, count], i) => (
                        <div key={location} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-4">
                            {i + 1}
                          </span>
                          <span className="text-sm text-foreground flex-1 truncate">
                            {location}
                          </span>
                          <span className="text-sm font-mono text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Tags */}
            <div className="lg:col-span-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target size={16} className="text-primary" />
                    Popular Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {topTags.map(([tag, count]) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs gap-1.5"
                        >
                          {tag}
                          <span className="font-mono text-muted-foreground">
                            {count}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

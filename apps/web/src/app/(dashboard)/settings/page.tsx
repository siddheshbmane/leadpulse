"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { User, Building2, CreditCard, Zap } from "lucide-react";

type DashboardStats = {
  totalLeads: number;
  activeFilters: number;
  creditsRemaining: number;
};

function useStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard/stats");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as DashboardStats;
    },
  });
}

export default function SettingsPage() {
  const { data: stats, isLoading } = useStats();

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Account and application preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-medium text-muted-foreground">
              A
            </div>
            <div>
              <div className="font-medium text-foreground">Admin</div>
              <div className="text-sm text-muted-foreground">
                admin@leadpulse.io
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 size={16} />
            Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm text-foreground font-medium">
              LeadPulse Internal
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              PRO
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="text-sm text-foreground">OWNER</span>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard size={16} />
            Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Credits Remaining
                </span>
                <span className="text-sm font-mono text-foreground font-bold">
                  {stats?.creditsRemaining?.toLocaleString() ?? "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Leads
                </span>
                <span className="text-sm font-mono text-foreground">
                  {stats?.totalLeads ?? "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Filters
                </span>
                <span className="text-sm font-mono text-foreground">
                  {stats?.activeFilters ?? "—"}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap size={16} />
            Application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-mono text-foreground">1.0.0</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Environment</span>
            <Badge variant="secondary">Development</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

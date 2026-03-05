"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { User, Building2, CreditCard, Zap } from "lucide-react";

type SettingsData = {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    credits: number;
  };
  role: string;
};

type DashboardStats = {
  totalLeads: number;
  activeFilters: number;
  creditsRemaining: number;
};

function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/v1/settings");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as SettingsData;
    },
  });
}

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

function getInitial(name: string | null, email: string): string {
  if (name) return name.charAt(0).toUpperCase();
  return email.charAt(0).toUpperCase();
}

const PLAN_STYLES: Record<string, string> = {
  FREE: "bg-muted text-muted-foreground",
  STARTER: "bg-blue-500/10 text-blue-400",
  PRO: "bg-primary/10 text-primary",
  ENTERPRISE: "bg-emerald-500/10 text-emerald-400",
};

export default function SettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: stats, isLoading: statsLoading } = useStats();

  const isLoading = settingsLoading || statsLoading;

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

      {isLoading ? (
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
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
                  {settings
                    ? getInitial(settings.user.fullName, settings.user.email)
                    : "?"}
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {settings?.user.fullName || "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {settings?.user.email || "—"}
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
                  {settings?.organization.name || "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Slug</span>
                <span className="text-sm font-mono text-muted-foreground">
                  {settings?.organization.slug || "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge
                  variant="secondary"
                  className={
                    PLAN_STYLES[settings?.organization.plan || "FREE"] ||
                    PLAN_STYLES.FREE
                  }
                >
                  {settings?.organization.plan || "—"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm text-foreground">
                  {settings?.role || "—"}
                </span>
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Credits Remaining
                </span>
                <span className="text-sm font-mono text-foreground font-bold">
                  {settings?.organization.credits?.toLocaleString() ?? "—"}
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
                <span className="text-sm text-muted-foreground">
                  Environment
                </span>
                <Badge variant="secondary">
                  {process.env.NODE_ENV === "production"
                    ? "Production"
                    : "Development"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

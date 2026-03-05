"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useLeads,
  useUpdateLead,
  useExportLeads,
} from "@/modules/leads/hooks/use-leads";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Users,
  MapPin,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Briefcase,
  Calendar,
  Target,
  Hash,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Lead = {
  id: string;
  personName: string | null;
  companyName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedinUrl: string | null;
  source: string;
  sourceUrl: string | null;
  status: string;
  score: number | null;
  intentSignal: string | null;
  tags: string[];
  city: string | null;
  country: string | null;
  discoveredAt: string;
};

const STATUSES = [
  "NEW",
  "ENRICHED",
  "QUALIFIED",
  "CONTACTED",
  "WON",
  "LOST",
  "IGNORED",
];
const SOURCES = ["linkedin", "google_maps", "reddit"];

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-400",
  ENRICHED: "bg-cyan-500/10 text-cyan-400",
  QUALIFIED: "bg-primary/10 text-primary",
  CONTACTED: "bg-yellow-500/10 text-yellow-400",
  WON: "bg-emerald-500/10 text-emerald-400",
  LOST: "bg-red-500/10 text-red-400",
  IGNORED: "bg-muted text-muted-foreground",
};

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data, isLoading } = useLeads({
    page,
    pageSize: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
  });
  const updateLead = useUpdateLead();
  const exportLeads = useExportLeads();

  const leads = (data?.data ?? []) as unknown as Lead[];
  const pagination = data?.pagination;

  const handleStatusChange = (leadId: string, newStatus: string) => {
    updateLead.mutate(
      {
        id: leadId,
        data: {
          status: newStatus as
            | "NEW"
            | "ENRICHED"
            | "QUALIFIED"
            | "CONTACTED"
            | "WON"
            | "LOST"
            | "IGNORED",
        },
      },
      {
        onSuccess: () => toast.success("Status updated"),
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  const handleExport = () => {
    exportLeads.mutate(
      {
        filters: {
          status: statusFilter ? [statusFilter] : undefined,
          source: sourceFilter || undefined,
        },
      },
      {
        onSuccess: () => toast.success("Export downloaded"),
        onError: () => toast.error("Export failed"),
      }
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            Leads
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {pagination
              ? `${pagination.total} leads found`
              : "Manage your prospect pipeline."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exportLeads.isPending}
        >
          {exportLeads.isPending ? (
            <Loader2 size={14} className="mr-1.5 animate-spin" />
          ) : (
            <Download size={14} className="mr-1.5" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by name, company, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sourceFilter}
          onValueChange={(v) => {
            setSourceFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users
              size={40}
              className="mx-auto text-muted-foreground/30 mb-4"
            />
            <p className="text-muted-foreground">
              {search || statusFilter || sourceFilter
                ? "No leads match your filters."
                : "No leads yet. Run a search filter to discover prospects."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Discovered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {lead.personName || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {lead.companyName || "No company"}
                          {lead.title ? ` · ${lead.title}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm capitalize text-muted-foreground">
                        {lead.source.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          STATUS_COLORS[lead.status] ?? STATUS_COLORS.IGNORED
                        )}
                      >
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-muted-foreground">
                        {lead.score ? Number(lead.score).toFixed(0) : "---"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {[lead.city, lead.country]
                          .filter(Boolean)
                          .join(", ") || "---"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(lead.discoveredAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {leads.map((lead) => (
              <Card
                key={lead.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedLead(lead)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {lead.personName || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lead.companyName || "No company"}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px]",
                        STATUS_COLORS[lead.status] ?? STATUS_COLORS.IGNORED
                      )}
                    >
                      {lead.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="capitalize">
                      {lead.source.replace("_", " ")}
                    </span>
                    <span className="font-mono">
                      {new Date(lead.discoveredAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lead Detail Drawer — Properly Aligned */}
      <Sheet
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          {selectedLead && (
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <SheetHeader className="space-y-0">
                  <SheetTitle className="text-left text-lg">
                    {selectedLead.personName || "Unknown Lead"}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex items-center gap-2 mt-1.5">
                  {selectedLead.companyName && (
                    <span className="text-sm text-muted-foreground">
                      {selectedLead.companyName}
                    </span>
                  )}
                  {selectedLead.title && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedLead.title}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      STATUS_COLORS[selectedLead.status] ??
                        STATUS_COLORS.IGNORED
                    )}
                  >
                    {selectedLead.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedLead.source.replace("_", " ")}
                  </Badge>
                  {selectedLead.score && (
                    <Badge variant="outline" className="text-xs font-mono">
                      Score: {Number(selectedLead.score).toFixed(0)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Status Selector */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Update Status
                  </label>
                  <Select
                    value={selectedLead.status}
                    onValueChange={(v) => {
                      handleStatusChange(selectedLead.id, v);
                      setSelectedLead({ ...selectedLead, status: v });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Contact Information */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Contact Information
                  </h4>
                  <div className="space-y-2.5">
                    {selectedLead.email && (
                      <div className="flex items-center gap-3">
                        <Mail
                          size={14}
                          className="text-muted-foreground shrink-0"
                        />
                        <a
                          href={`mailto:${selectedLead.email}`}
                          className="text-sm text-primary hover:underline truncate"
                        >
                          {selectedLead.email}
                        </a>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div className="flex items-center gap-3">
                        <Phone
                          size={14}
                          className="text-muted-foreground shrink-0"
                        />
                        <a
                          href={`tel:${selectedLead.phone}`}
                          className="text-sm text-foreground"
                        >
                          {selectedLead.phone}
                        </a>
                      </div>
                    )}
                    {(selectedLead.city || selectedLead.country) && (
                      <div className="flex items-center gap-3">
                        <MapPin
                          size={14}
                          className="text-muted-foreground shrink-0"
                        />
                        <span className="text-sm text-foreground">
                          {[selectedLead.city, selectedLead.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {selectedLead.website && (
                      <div className="flex items-center gap-3">
                        <Globe
                          size={14}
                          className="text-muted-foreground shrink-0"
                        />
                        <a
                          href={selectedLead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline truncate"
                        >
                          {selectedLead.website}
                        </a>
                      </div>
                    )}
                    {selectedLead.linkedinUrl && (
                      <div className="flex items-center gap-3">
                        <Linkedin
                          size={14}
                          className="text-muted-foreground shrink-0"
                        />
                        <a
                          href={selectedLead.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline truncate"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Lead Details */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                        <Briefcase size={12} />
                        Company
                      </div>
                      <div className="text-sm text-foreground">
                        {selectedLead.companyName || "---"}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                        <Hash size={12} />
                        Source
                      </div>
                      <div className="text-sm text-foreground capitalize">
                        {selectedLead.source.replace("_", " ")}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                        <Target size={12} />
                        Score
                      </div>
                      <div className="text-sm text-foreground font-mono">
                        {selectedLead.score
                          ? Number(selectedLead.score).toFixed(1)
                          : "---"}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                        <Calendar size={12} />
                        Discovered
                      </div>
                      <div className="text-sm text-foreground">
                        {new Date(
                          selectedLead.discoveredAt
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Intent Signal */}
                {selectedLead.intentSignal && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Intent Signal
                      </h4>
                      <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5">
                        <p className="text-sm text-foreground">
                          {selectedLead.intentSignal}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Tags */}
                {selectedLead.tags && selectedLead.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLead.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Source Link */}
                {selectedLead.sourceUrl && (
                  <>
                    <Separator />
                    <a
                      href={selectedLead.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink size={14} />
                      View Original Source
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LeadQuery, LeadUpdate } from "../schemas/lead.schema";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useLeads(params?: Partial<LeadQuery>) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ["leads", params],
    queryFn: () =>
      fetchJson<{
        success: boolean;
        data: Record<string, unknown>[];
        pagination: {
          page: number;
          pageSize: number;
          total: number;
          totalPages: number;
        };
      }>(`/api/v1/leads?${searchParams.toString()}`),
  });
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () =>
      fetchJson<{ success: boolean; data: Record<string, unknown> }>(
        `/api/v1/leads/${id}`
      ),
    enabled: !!id,
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeadUpdate }) =>
      fetchJson(`/api/v1/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useBulkUpdateLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      leadIds: string[];
      update: LeadUpdate;
    }) =>
      fetchJson(`/api/v1/leads/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useExportLeads() {
  return useMutation({
    mutationFn: async (data: {
      filters?: Record<string, unknown>;
      leadIds?: string[];
      columns?: string[];
    }) => {
      const res = await fetch(`/api/v1/leads/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

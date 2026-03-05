"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  SearchFilterCreate,
  SearchFilterUpdate,
} from "../schemas/search-filter.schema";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useSearchFilters(params?: { isActive?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.isActive !== undefined) {
    searchParams.set("isActive", String(params.isActive));
  }

  return useQuery({
    queryKey: ["search-filters", params],
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
      }>(`/api/v1/search-filters?${searchParams.toString()}`),
  });
}

export function useSearchFilter(id: string | null) {
  return useQuery({
    queryKey: ["search-filter", id],
    queryFn: () =>
      fetchJson<{ success: boolean; data: Record<string, unknown> }>(
        `/api/v1/search-filters/${id}`
      ),
    enabled: !!id,
  });
}

export function useCreateSearchFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SearchFilterCreate) =>
      fetchJson(`/api/v1/search-filters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-filters"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdateSearchFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SearchFilterUpdate }) =>
      fetchJson(`/api/v1/search-filters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-filters"] });
    },
  });
}

export function useDeleteSearchFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/v1/search-filters/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-filters"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useRunSearchFilter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/v1/search-filters/${id}/run`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

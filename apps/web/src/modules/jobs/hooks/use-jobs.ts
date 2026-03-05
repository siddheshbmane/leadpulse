"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useJobs(params?: { status?: string; searchFilterId?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.searchFilterId)
    searchParams.set("searchFilterId", params.searchFilterId);

  return useQuery({
    queryKey: ["jobs", params],
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
      }>(`/api/v1/jobs?${searchParams.toString()}`),
  });
}

export function useJob(id: string | null) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () =>
      fetchJson<{ success: boolean; data: Record<string, unknown> }>(
        `/api/v1/jobs/${id}`
      ),
    enabled: !!id,
  });
}

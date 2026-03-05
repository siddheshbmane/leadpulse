"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

type JobEvent = {
  id: string;
  status: string;
  leadsFound: number;
  leadsNew: number;
  creditsUsed: number;
  error: string | null;
};

type JobStreamCallbacks = {
  onJobComplete?: (job: JobEvent) => void;
};

export function useJobStream(callbacks?: JobStreamCallbacks) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/v1/jobs/stream");
    eventSourceRef.current = es;

    function handleEvent(event: MessageEvent) {
      try {
        const job: JobEvent = JSON.parse(event.data);

        // Update TanStack Query cache — invalidate jobs list
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
        queryClient.invalidateQueries({ queryKey: ["job", job.id] });

        if (
          event.type === "job_complete" &&
          callbacksRef.current?.onJobComplete
        ) {
          callbacksRef.current.onJobComplete(job);
        }
      } catch {
        // Ignore parse errors
      }
    }

    es.addEventListener("job_update", handleEvent);
    es.addEventListener("job_complete", handleEvent);

    es.addEventListener("heartbeat", () => {
      // Keep-alive received — connection is healthy
    });

    es.addEventListener("close", () => {
      es.close();
    });

    es.onerror = () => {
      es.close();
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };
  }, [queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      eventSourceRef.current?.close();
    };
  }, [connect]);
}

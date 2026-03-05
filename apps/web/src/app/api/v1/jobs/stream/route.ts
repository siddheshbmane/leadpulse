import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

type JobSnapshot = {
  id: string;
  status: string;
  leadsFound: number;
  leadsNew: number;
  creditsUsed: number;
  error: string | null;
};

export async function GET() {
  const { organizationId } = await getAuthContext();

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const lastState = new Map<string, string>();
      let heartbeatCount = 0;
      const MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutes
      const POLL_INTERVAL_MS = 2000;
      const HEARTBEAT_INTERVAL = 7; // Every ~14 seconds (7 * 2s poll)
      const startTime = Date.now();

      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      }

      async function poll() {
        if (closed || Date.now() - startTime > MAX_DURATION_MS) {
          if (!closed) {
            send("close", { reason: "timeout" });
            closed = true;
            controller.close();
          }
          return;
        }

        try {
          const jobs = await prisma.job.findMany({
            where: {
              organizationId,
              status: { in: ["PENDING", "RUNNING", "SUCCESS", "ERROR"] },
              createdAt: {
                gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 min
              },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true,
              status: true,
              leadsFound: true,
              leadsNew: true,
              creditsUsed: true,
              error: true,
            },
          });

          for (const job of jobs) {
            const prevStatus = lastState.get(job.id);
            if (prevStatus !== job.status) {
              lastState.set(job.id, job.status);
              const eventType =
                job.status === "SUCCESS" || job.status === "ERROR"
                  ? "job_complete"
                  : "job_update";
              send(eventType, job);
            }
          }

          // Heartbeat
          heartbeatCount++;
          if (heartbeatCount >= HEARTBEAT_INTERVAL) {
            heartbeatCount = 0;
            send("heartbeat", { time: Date.now() });
          }
        } catch {
          // DB error — skip this poll cycle
        }

        if (!closed) {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      }

      // Start polling
      poll();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

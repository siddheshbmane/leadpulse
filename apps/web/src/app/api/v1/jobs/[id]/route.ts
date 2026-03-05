import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";
import { type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthContext();
    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: { id, organizationId },
      include: {
        searchFilter: { select: { id: true, name: true } },
      },
    });

    if (!job) {
      return apiError("NOT_FOUND", "Job not found", 404);
    }

    return apiSuccess(job);
  } catch (error) {
    return handleApiError(error);
  }
}

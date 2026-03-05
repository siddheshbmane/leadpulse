import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";
import { leadUpdateSchema } from "@/modules/leads/schemas/lead.schema";
import { type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthContext();
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId },
      include: {
        searchFilter: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!lead) {
      return apiError("NOT_FOUND", "Lead not found", 404);
    }

    return apiSuccess(lead);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId, userId } = await getAuthContext();
    const { id } = await params;
    const body = await request.json();
    const data = leadUpdateSchema.parse(body);

    const existing = await prisma.lead.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return apiError("NOT_FOUND", "Lead not found", 404);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    // Create audit event for status changes
    if (data.status && data.status !== existing.status) {
      await prisma.leadEvent.create({
        data: {
          leadId: id,
          type: "status_change",
          data: { from: existing.status, to: data.status },
          createdBy: userId,
        },
      });
    }

    return apiSuccess(lead);
  } catch (error) {
    return handleApiError(error);
  }
}

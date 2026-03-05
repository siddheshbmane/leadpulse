import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-utils";
import { leadBulkUpdateSchema } from "@/modules/leads/schemas/lead.schema";
import { type NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const body = await request.json();
    const { leadIds, update } = leadBulkUpdateSchema.parse(body);

    const result = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        organizationId,
      },
      data: update,
    });

    return apiSuccess({ updated: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}

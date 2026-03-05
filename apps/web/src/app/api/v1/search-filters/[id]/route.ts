import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-utils";
import { searchFilterUpdateSchema } from "@/modules/search-filters/schemas/search-filter.schema";
import { type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthContext();
    const { id } = await params;

    const filter = await prisma.searchFilter.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { leads: true, jobs: true } },
      },
    });

    if (!filter) {
      return apiError("NOT_FOUND", "Search filter not found", 404);
    }

    return apiSuccess(filter);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthContext();
    const { id } = await params;
    const body = await request.json();
    const data = searchFilterUpdateSchema.parse(body);

    const existing = await prisma.searchFilter.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return apiError("NOT_FOUND", "Search filter not found", 404);
    }

    const filter = await prisma.searchFilter.update({
      where: { id },
      data,
    });

    return apiSuccess(filter);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await getAuthContext();
    const { id } = await params;

    const existing = await prisma.searchFilter.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return apiError("NOT_FOUND", "Search filter not found", 404);
    }

    await prisma.searchFilter.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

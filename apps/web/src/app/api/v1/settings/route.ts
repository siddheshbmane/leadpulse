import { getAuthContext } from "@/lib/auth-context";
import { apiSuccess, handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const ctx = await getAuthContext();

    return apiSuccess({
      user: ctx.user,
      organization: ctx.organization,
      role: ctx.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

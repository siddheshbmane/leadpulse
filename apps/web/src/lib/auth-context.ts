import { prisma } from "@/lib/prisma";
import { cache } from "react";

/**
 * Phase 1: No auth — returns the seed user and org.
 * Phase 1b: Replace with real session-based auth.
 */
export const getAuthContext = cache(async () => {
  const user = await prisma.user.findFirst({
    where: { email: "admin@leadpulse.io" },
    include: {
      memberships: {
        include: { organization: true },
        take: 1,
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    throw new Error(
      "Seed user not found. Run `npx prisma db seed` to create it."
    );
  }

  const membership = user.memberships[0];

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    },
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      plan: membership.organization.plan,
      credits: membership.organization.credits,
    },
    role: membership.role,
    organizationId: membership.organization.id,
    userId: user.id,
  };
});

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed user
  const user = await prisma.user.upsert({
    where: { email: "admin@leadpulse.io" },
    update: {},
    create: {
      email: "admin@leadpulse.io",
      fullName: "Admin",
    },
  });
  console.log(`Seeded user: ${user.email} (${user.id})`);

  // 2. Seed organization
  const org = await prisma.organization.upsert({
    where: { slug: "leadpulse-internal" },
    update: {},
    create: {
      name: "LeadPulse Internal",
      slug: "leadpulse-internal",
      plan: "PRO",
      credits: 999999,
    },
  });
  console.log(`Seeded org: ${org.name} (${org.id})`);

  // 3. Seed membership
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: user.id,
      role: "OWNER",
    },
  });
  console.log(`Seeded membership: ${user.email} -> ${org.name} (OWNER)`);

  // 4. Seed a sample search filter
  const filter = await prisma.searchFilter.upsert({
    where: { id: "seed-filter-series-a" },
    update: {},
    create: {
      id: "seed-filter-series-a",
      organizationId: org.id,
      createdById: user.id,
      name: "Series A CTOs in India",
      description: "Find CTOs and VP Engineering at recently funded startups in India",
      sources: ["linkedin"],
      query: {
        keywords: ["Series A", "CTO", "India"],
        jobTitles: ["CTO", "VP Engineering", "Co-Founder"],
        industries: ["Software Development", "Information Technology"],
        location: "India",
      },
      isActive: true,
      runEveryMinutes: 1440,
    },
  });
  console.log(`Seeded filter: ${filter.name}`);

  // 5. Seed sample leads
  const sampleLeads = [
    {
      organizationId: org.id,
      searchFilterId: filter.id,
      source: "linkedin",
      externalId: "seed-lead-1",
      personName: "Priya Sharma",
      title: "CTO",
      companyName: "CloudNine Technologies",
      email: "priya@cloudnine.io",
      linkedinUrl: "https://linkedin.com/in/priyasharma",
      city: "Bangalore",
      region: "Karnataka",
      country: "India",
      status: "NEW" as const,
      score: 85.5,
      intentSignal: "Series A funding announced",
      tags: ["series-a", "saas"],
      raw: { snippet: "CloudNine Technologies raises $12M Series A to expand AI platform" },
    },
    {
      organizationId: org.id,
      searchFilterId: filter.id,
      source: "linkedin",
      externalId: "seed-lead-2",
      personName: "Arjun Mehta",
      title: "VP Engineering",
      companyName: "DataForge Labs",
      email: "arjun@dataforge.dev",
      linkedinUrl: "https://linkedin.com/in/arjunmehta",
      city: "Mumbai",
      region: "Maharashtra",
      country: "India",
      status: "QUALIFIED" as const,
      score: 72.0,
      intentSignal: "Hiring surge - 15 new engineering roles",
      tags: ["series-a", "hiring"],
      raw: { snippet: "DataForge Labs scaling engineering team after Series A" },
    },
    {
      organizationId: org.id,
      searchFilterId: filter.id,
      source: "google_maps",
      externalId: "seed-lead-3",
      personName: "Sarah Chen",
      title: "Founder & CEO",
      companyName: "MapStack",
      website: "https://mapstack.io",
      city: "Delhi",
      country: "India",
      status: "NEW" as const,
      score: 68.0,
      intentSignal: "New office location opened",
      tags: ["expansion"],
      raw: { snippet: "MapStack opens new Delhi office, expands to 3 cities" },
    },
    {
      organizationId: org.id,
      searchFilterId: filter.id,
      source: "reddit",
      externalId: "seed-lead-4",
      personName: "Vikram Patel",
      title: "Co-Founder",
      companyName: "NeuralShift AI",
      email: "vikram@neuralshift.ai",
      linkedinUrl: "https://linkedin.com/in/vikrampatel",
      city: "Hyderabad",
      region: "Telangana",
      country: "India",
      status: "CONTACTED" as const,
      score: 91.0,
      intentSignal: "Actively seeking sales tooling on r/SaaS",
      tags: ["high-intent", "ai"],
      raw: { snippet: "Looking for lead gen tools - our current stack is failing us" },
    },
    {
      organizationId: org.id,
      searchFilterId: filter.id,
      source: "linkedin",
      externalId: "seed-lead-5",
      personName: "Neha Kapoor",
      title: "Head of Growth",
      companyName: "FinServe Pro",
      email: "neha@finservepro.com",
      city: "Pune",
      region: "Maharashtra",
      country: "India",
      status: "NEW" as const,
      score: 77.5,
      intentSignal: "Posted about scaling outbound",
      tags: ["fintech", "growth"],
      raw: { snippet: "Neha shared tips on scaling outbound from 0 to 50 meetings/month" },
    },
  ];

  for (const lead of sampleLeads) {
    await prisma.lead.upsert({
      where: {
        uq_leads_org_source_external: {
          organizationId: lead.organizationId,
          source: lead.source,
          externalId: lead.externalId!,
        },
      },
      update: {},
      create: lead,
    });
  }
  console.log(`Seeded ${sampleLeads.length} sample leads`);

  // 6. Seed a sample completed job
  await prisma.job.upsert({
    where: { id: "seed-job-1" },
    update: {},
    create: {
      id: "seed-job-1",
      organizationId: org.id,
      searchFilterId: filter.id,
      status: "SUCCESS",
      source: "linkedin",
      startedAt: new Date(Date.now() - 150000),
      completedAt: new Date(Date.now() - 60000),
      leadsFound: 5,
      leadsNew: 5,
      creditsUsed: 5,
    },
  });
  console.log("Seeded sample job");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

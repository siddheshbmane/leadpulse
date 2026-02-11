const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Seeding production database...');

  const user = await prisma.user.upsert({
    where: { email: 'mane.siddhesh31@gmail.com' },
    update: {},
    create: {
      email: 'mane.siddhesh31@gmail.com',
      fullName: 'Siddhesh Mane',
      role: 'admin',
    },
  });

  const filter = await prisma.searchFilter.create({
    data: {
      ownerId: user.id,
      name: 'High-Value Founders',
      description: 'Founders with recent funding rounds',
      query: { keywords: ['founder', 'CEO'], industries: ['SaaS', 'AI'] },
    },
  });

  const leads = [
    {
      ownerId: user.id,
      searchFilterId: filter.id,
      personName: 'Sarah Chen',
      companyName: 'Nexus AI',
      title: 'Founder',
      source: 'linkedin',
      status: 'NEW',
      score: 95.0,
      tags: ['Hot', 'Hiring'],
    },
    {
      ownerId: user.id,
      searchFilterId: filter.id,
      personName: 'Mark Wilson',
      companyName: 'CloudScale',
      title: 'CEO',
      source: 'linkedin',
      status: 'QUALIFIED',
      score: 88.5,
      tags: ['Warm', 'Expansion'],
    },
    {
      ownerId: user.id,
      searchFilterId: filter.id,
      personName: 'Elena Rodriguez',
      companyName: 'BioFlow',
      title: 'Co-Founder',
      source: 'linkedin',
      status: 'NEW',
      score: 92.0,
      tags: ['Hot', 'Funded'],
    },
  ];

  for (const leadData of leads) {
    await prisma.lead.create({ data: leadData });
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

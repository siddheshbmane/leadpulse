const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

const client = new Client({
  connectionString: connectionString,
});

async function main() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected.');

  try {
    // Insert User
    const userRes = await client.query(`
      INSERT INTO users (id, email, "fullName", role, "updatedAt")
      VALUES (gen_random_uuid(), 'mane.siddhesh31@gmail.com', 'Siddhesh Mane', 'admin', NOW())
      ON CONFLICT (email) DO UPDATE SET "fullName" = EXCLUDED."fullName"
      RETURNING id
    `);
    const userId = userRes.rows[0].id;
    console.log(`User created/updated with ID: ${userId}`);

    // Insert Search Filter
    const filterRes = await client.query(`
      INSERT INTO search_filters (id, "ownerId", name, description, query, "updatedAt")
      VALUES (gen_random_uuid(), $1, 'High-Value Founders', 'Founders with recent funding rounds', '{"keywords": ["founder", "CEO"]}', NOW())
      RETURNING id
    `, [userId]);
    const filterId = filterRes.rows[0].id;
    console.log(`Search filter created with ID: ${filterId}`);

    // Insert Leads
    const leads = [
      ['Sarah Chen', 'Nexus AI', 'Founder', 'linkedin', 'NEW', 95.0],
      ['Mark Wilson', 'CloudScale', 'CEO', 'linkedin', 'QUALIFIED', 88.5],
      ['Elena Rodriguez', 'BioFlow', 'Co-Founder', 'linkedin', 'NEW', 92.0]
    ];

    for (const lead of leads) {
      await client.query(`
        INSERT INTO leads (id, "ownerId", "searchFilterId", "personName", "companyName", title, source, status, score, "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [userId, filterId, ...lead]);
    }
    console.log('✅ Leads inserted.');

  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await client.end();
  }
}

main();

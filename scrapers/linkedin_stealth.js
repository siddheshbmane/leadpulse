const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function searchLinkedInViaGoogle(query) {
    console.log(`\n🔍 Searching: ${query}\n`);
    
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;
        await page.goto(googleUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Extract LinkedIn profile links
        const links = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('a[href*="linkedin.com/in/"]').forEach(link => {
                const url = link.href;
                if (url.includes('/in/') && !url.includes('google.com')) {
                    results.push(url);
                }
            });
            return [...new Set(results)]; // dedupe
        });
        
        console.log('--- LINKEDIN PROFILES ---');
        links.forEach((link, idx) => {
            console.log(`${idx + 1}. ${link}`);
        });
        console.log(`\nFound: ${links.length} profiles\n`);
        
        return links;
        
    } finally {
        await browser.close();
    }
}

// Europe Lead Queries
const queries = [
    'site:linkedin.com "Founder" (UK OR London) "recently funded"',
    'site:linkedin.com "Founder" (Germany OR Berlin) "Series A"',
    'site:linkedin.com "CTO" Europe startup hiring',
    'site:linkedin.com "CEO" London tech funded 2024',
];

async function runAll() {
    const allLeads = [];
    
    for (const query of queries) {
        const profiles = await searchLinkedInViaGoogle(query);
        allLeads.push(...profiles);
    }
    
    const unique = [...new Set(allLeads)];
    console.log(`\n✅ TOTAL: ${unique.length} unique LinkedIn profiles\n`);
    
    return unique;
}

runAll().catch(console.error);

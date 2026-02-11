const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function searchDDG(query) {
    console.log(`\n🦆 DuckDuckGo: ${query}\n`);
    
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        await page.goto(ddgUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Wait for results
        await page.waitForSelector('article[data-testid="result"]', { timeout: 10000 }).catch(() => {});
        
        // Extract all links
        const data = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('article a[href*="linkedin.com"]').forEach(link => {
                const url = link.href;
                const title = link.textContent.trim();
                if (url.includes('/in/') || url.includes('/company/')) {
                    results.push({ url, title });
                }
            });
            return results;
        });
        
        console.log('--- RESULTS ---');
        data.forEach((item, idx) => {
            console.log(`${idx + 1}. ${item.title}`);
            console.log(`   ${item.url}\n`);
        });
        
        return data;
        
    } finally {
        await browser.close();
    }
}

// Simpler, more natural queries (DDG prefers this)
const queries = [
    'linkedin founder UK funded startup',
    'linkedin founder Germany Berlin Series A',
    'linkedin CTO Europe hiring',
];

async function runAll() {
    const allLeads = [];
    
    for (const query of queries) {
        const results = await searchDDG(query);
        allLeads.push(...results);
    }
    
    console.log(`\n✅ TOTAL: ${allLeads.length} leads found\n`);
    return allLeads;
}

runAll().catch(console.error);

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function searchDDG(query) {
    console.log(`\n🔍 ${query}\n`);
    
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        await page.waitForSelector('article[data-testid="result"]', { timeout: 10000 }).catch(() => {});
        
        const data = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('article').forEach(art => {
                const link = art.querySelector('a[href*="linkedin.com"]');
                if (!link) return;
                
                const url = link.href;
                const text = art.innerText;
                const title = text.split('\n')[0] || 'LinkedIn Profile/Post';
                
                // Only include profiles (/in/) and posts (/posts/)
                if (url.includes('/in/') || url.includes('/posts/') || url.includes('/pulse/')) {
                    results.push({ title, url, snippet: text.substring(0, 200) });
                }
            });
            return results;
        });
        
        console.log('--- RESULTS ---');
        data.forEach((item, idx) => {
            console.log(`${idx + 1}. ${item.title}`);
            console.log(`   ${item.url}`);
            console.log(`   Preview: ${item.snippet.split('\n')[1] || ''}\n`);
        });
        
        return data;
        
    } finally {
        await browser.close();
    }
}

// HIGH-INTENT QUERIES - India Focus
const queries = [
    // Direct searches
    'site:linkedin.com "looking for software development company" India 2025',
    'site:linkedin.com "seeking software development company" Mumbai OR Bangalore',
    'site:linkedin.com "recommendations for" "software development" India',
    'site:linkedin.com "anyone know" "app developers" India',
    'site:linkedin.com "looking for" "tech partner" India',
    'site:linkedin.com "need mobile app developer" India',
    'site:linkedin.com "hiring development agency" India -job',
    'site:linkedin.com "software development partner" Mumbai OR Delhi',
    'site:linkedin.com "can anyone suggest" "app developer" India',
    'site:linkedin.com "need urgent help" ERP India',
    
    // Founder/Decision Maker Signals
    'site:linkedin.com "Founder" "recently funded" India Mumbai',
    'site:linkedin.com "CEO" "hiring" "developer" India',
    'site:linkedin.com "Building" "product" "need" "CTO" India',
    
    // RFP / Formal Procurement
    'site:linkedin.com "RFP" "software development" India',
];

async function runAll() {
    const allLeads = [];
    
    for (const query of queries) {
        const results = await searchDDG(query);
        allLeads.push(...results);
        
        // Rate limit to avoid blocks
        await new Promise(r => setTimeout(r, 3000));
    }
    
    // Deduplicate by URL
    const uniqueLeads = Array.from(new Map(allLeads.map(l => [l.url, l])).values());
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ FINAL REPORT: ${uniqueLeads.length} unique LinkedIn leads`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    // Categorize by type
    const posts = uniqueLeads.filter(l => l.url.includes('/posts/') || l.url.includes('/pulse/'));
    const profiles = uniqueLeads.filter(l => l.url.includes('/in/'));
    
    console.log(`📝 Posts/Articles: ${posts.length}`);
    console.log(`👤 Profiles: ${profiles.length}\n`);
    
    return uniqueLeads;
}

runAll().catch(console.error);

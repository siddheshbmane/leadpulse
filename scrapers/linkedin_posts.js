const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function searchLinkedInPosts(query) {
    console.log(`\n🔍 Searching DDG for LinkedIn Posts: ${query}\n`);
    
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Using DuckDuckGo to find LinkedIn Posts
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        await page.waitForSelector('article[data-testid="result"]', { timeout: 10000 }).catch(() => {});
        
        const data = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('article').forEach(art => {
                const link = art.querySelector('a[href*="linkedin.com/posts"]');
                const title = art.innerText;
                if (link) {
                    results.push({
                        title: title.split('\n')[0],
                        url: link.href,
                        snippet: title
                    });
                }
            });
            return results;
        });
        
        console.log('--- LINKEDIN POSTS FOUND ---');
        data.forEach((item, idx) => {
            console.log(`${idx + 1}. ${item.title}`);
            console.log(`   ${item.url}\n`);
        });
        
        return data;
        
    } finally {
        await browser.close();
    }
}

const queries = [
    'site:linkedin.com "looking for software development company" India 2025',
    'site:linkedin.com "recommendations for" "software development" 2025',
    'site:linkedin.com "anyone know" "app developers" India',
    'site:linkedin.com "seeking software development company" Mumbai OR Bangalore'
];

async function runAll() {
    let allPosts = [];
    for (const q of queries) {
        const posts = await searchLinkedInPosts(q);
        allPosts.push(...posts);
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log(`\n✅ TOTAL POSTS: ${allPosts.length}\n`);
}

runAll().catch(console.error);

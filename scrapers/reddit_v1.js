const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function scrapeRedditIntent(query) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        // Use a real-looking viewport and UA
        await page.setViewport({ width: 1280, height: 800 });
        
        const searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&t=week`;
        console.log(`Searching Reddit for: ${query}`);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // Scroll a bit to trigger lazy loading
        await page.mouse.wheel(0, 1000);
        await new Promise(r => setTimeout(r, 2000));

        const leads = await page.evaluate(() => {
            const results = [];
            // Target the post containers
            const posts = document.querySelectorAll('a[data-testid="post-title"]');
            
            posts.forEach(post => {
                const title = post.innerText;
                const url = post.href;
                // Grab the surrounding context if possible
                const container = post.closest('faceplate-tracker') || post.parentElement;
                const time = container?.querySelector('time')?.innerText || 'recently';
                
                results.push({ title, url, time });
            });
            return results;
        });

        console.log('--- DATA START ---');
        console.log(JSON.stringify({
            source: 'Reddit',
            query: query,
            results: leads.slice(0, 10) // Top 10 for the MVP
        }, null, 2));
        console.log('--- DATA END ---');

    } catch (error) {
        console.error(`Scrape Error: ${error.message}`);
    } finally {
        await browser.close();
    }
}

// Using one of your high-value phrases
scrapeRedditIntent('"looking for development team" OR "need MVP built"');

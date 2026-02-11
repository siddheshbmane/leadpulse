const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function scrapeDuckDuckGo(query) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&df=w&ia=web`;
        console.log(`Searching DuckDuckGo for: ${query}`);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('article', { timeout: 10000 });

        const leads = await page.evaluate(() => {
            return [...document.querySelectorAll('article')].map(el => {
                const titleEl = el.querySelector('h2 a');
                const snippetEl = el.querySelector('div[data-testid="result-snippet"]');
                return {
                    title: titleEl?.innerText,
                    url: titleEl?.href,
                    snippet: snippetEl?.innerText
                };
            }).filter(item => item.title);
        });

        console.log('--- DATA START ---');
        console.log(JSON.stringify({
            source: 'DuckDuckGo',
            query: query,
            results: leads.slice(0, 10)
        }, null, 2));
        console.log('--- DATA END ---');

    } catch (error) {
        console.error(`Scrape Error: ${error.message}`);
    } finally {
        await browser.close();
    }
}

scrapeDuckDuckGo('site:reddit.com "looking for development team" OR "need MVP built"');

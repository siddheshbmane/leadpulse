const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { URL } = require('url');

puppeteer.use(StealthPlugin());

async function runScraper(url) {
    console.log(`Starting stealth scrape for: ${url}`);
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Wait for Reddit results to load
        await page.waitForSelector('faceplate-batch', { timeout: 10000 }).catch(() => console.log('Wait for batch timed out, continuing...'));

        const data = await page.evaluate(() => {
            const results = [];
            // Target the Reddit search result structure
            document.querySelectorAll('a[data-testid="post-title"]').forEach(post => {
                results.push({
                    title: post.innerText,
                    url: post.href,
                    context: post.closest('faceplate-tracker')?.innerText || ""
                });
            });
            return results;
        });

        console.log('--- DATA START ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('--- DATA END ---');

    } catch (error) {
        console.error(`Scrape failed: ${error.message}`);
    } finally {
        await browser.close();
    }
}

const targetUrl = process.argv[2] || 'https://www.reddit.com/search/?q=%22looking+for+development+team%22+OR+%22need+MVP+built%22&t=month';
runScraper(targetUrl);

/**
 * LinkedIn Lead Finder via Google + ScrapingBee
 * Searches Google for LinkedIn profiles matching criteria
 */

const https = require('https');

const SCRAPINGBEE_KEY = process.env.SCRAPINGBEE_API_KEY || 'GZBE7O9RZA9NE9ABUMHL0MNHWOC6Y8T8WREEVXDZTGSUQV502GJNMINWPN6SIW07252W6J4AYZN8HUF2';

async function scrapePage(url) {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_KEY}&url=${encodeURIComponent(url)}&render_js=false`;
        
        https.get(apiUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`ScrapingBee returned ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

function extractLinkedInUrls(html) {
    const regex = /https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/g;
    const matches = html.match(regex) || [];
    return [...new Set(matches)]; // dedupe
}

async function searchLinkedIn(query) {
    console.log(`\n🔍 Searching Google for: ${query}\n`);
    
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;
    
    try {
        const html = await scrapePage(googleUrl);
        const urls = extractLinkedInUrls(html);
        
        console.log('--- LINKEDIN PROFILES FOUND ---');
        urls.forEach((url, idx) => {
            console.log(`${idx + 1}. ${url}`);
        });
        console.log(`\nTotal: ${urls.length} profiles\n`);
        
        return urls;
    } catch (error) {
        console.error('Error:', error.message);
        return [];
    }
}

// Europe Founder Search Queries
const queries = [
    'site:linkedin.com "Founder" "UK" OR "London" "recently funded"',
    'site:linkedin.com "Founder" "Germany" OR "Berlin" "Series A"',
    'site:linkedin.com "CTO" "Europe" "startup" "hiring"',
    'site:linkedin.com "CEO" "London" "tech" "funded"',
];

async function runAll() {
    const allLeads = [];
    
    for (const query of queries) {
        const urls = await searchLinkedIn(query);
        allLeads.push(...urls);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit
    }
    
    const uniqueLeads = [...new Set(allLeads)];
    console.log(`\n✅ FINAL REPORT: ${uniqueLeads.length} unique LinkedIn profiles found.`);
    
    return uniqueLeads;
}

// Run
runAll().catch(console.error);

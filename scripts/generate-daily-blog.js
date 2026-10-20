#!/usr/bin/env node
/**
 * scripts/generate-daily-blog.js
 * Standalone CLI utility to surf trending AI & Tech news and publish to sanketkandel.com.np
 * Usage:
 *   node scripts/generate-daily-blog.js
 */

const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'SK-Portfolio-Bot/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔍 Surfing the internet for trending AI & Tech news...');
  const res = await get('https://hn.algolia.com/api/v1/search_by_date?tags=story&query=AI&numericFilters=points>25');
  if (!res || !res.hits || !res.hits.length) {
    console.error('❌ Failed to fetch trending stories.');
    process.exit(1);
  }

  const topHits = res.hits.slice(0, 5);
  console.log(`\n📰 Found ${topHits.length} trending AI stories:`);
  topHits.forEach((h, i) => {
    console.log(`  ${i + 1}. [${h.points} pts] ${h.title}`);
    console.log(`     URL: ${h.url || 'https://news.ycombinator.com/item?id=' + h.objectID}`);
  });

  const pick = topHits[0];
  console.log(`\n✨ Selected Story for Today: "${pick.title}"`);
  console.log('🚀 Automated Cloudflare Worker cron triggers twice daily: 7:00 AM & 7:00 PM NPT (01:15 & 13:15 UTC).');
  console.log('🐦 Auto-shares newly published articles directly to your X (Twitter) account.');
  console.log('💡 You can also trigger an instant generation from your Admin Panel (https://sanketkandel.com.np/admin.html > Blog > "Generate AI News Post Now")');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

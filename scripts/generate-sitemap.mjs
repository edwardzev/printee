import fs from 'fs';
import path from 'path';
import { products } from '../src/data/products.js';

const hostname = process.env.SITE_HOSTNAME || 'https://printee.co.il';
const pages = ['/', '/catalog', '/faq', '/terms', '/privacy', '/returns'];

const urls = new Set(pages.map(p => `${hostname}${p}`));
// add product pages
for (const p of products) {
  urls.add(`${hostname}/product/${p.sku}`);
}

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const url of urls) {
  xml += `  <url>\n    <loc>${url}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
}
xml += `</urlset>`;

const out = path.join(process.cwd(), 'public', 'sitemap.xml');
fs.writeFileSync(out, xml, 'utf8');
console.log('Wrote sitemap to', out);

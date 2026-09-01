const fs = require('fs');
const t = fs.readFileSync('C:/Users/asus/.gemini/antigravity/brain/b9db98db-5370-432a-8d62-745db4b72dc1/.system_generated/steps/974/content.md', 'utf8');
const links = [...t.matchAll(/href="([^"]*)"/g)].map(m => m[1]);
console.log('Links:', links.filter(l => l.includes('download') || l.includes('api') || l.includes('.csv') || l.includes('.zip')));

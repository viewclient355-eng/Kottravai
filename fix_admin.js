const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');
content = content.replace(/\|\|\s*";/g, '|| "";');
content = content.replace(/\|\|\s*",/g, '|| "",');
fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
console.log('Fixed syntax errors');

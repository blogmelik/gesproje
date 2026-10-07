const fs = require('fs');
let content = fs.readFileSync('src/components/field-shell.tsx', 'utf8');

content = content.replace('import logo from "@/assets/ozgun-logo.asset.json";', '');
content = content.replace('src={logo.url}', 'src="/logo.jpg"');

fs.writeFileSync('src/components/field-shell.tsx', content, 'utf8');

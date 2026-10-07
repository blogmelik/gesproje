const fs = require('fs');
let content = fs.readFileSync('src/components/field-shell.tsx', 'utf8');

const importStmt = 'import ozgunLogo from "@/assets/ozgun-logo-text.png";\n';
if (!content.includes('import ozgunLogo')) {
    content = importStmt + content;
}

content = content.replace('src="/logo.jpg"', 'src={ozgunLogo}');

fs.writeFileSync('src/components/field-shell.tsx', content, 'utf8');

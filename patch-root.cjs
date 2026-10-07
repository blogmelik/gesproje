const fs = require('fs');
let content = fs.readFileSync('src/routes/__root.tsx', 'utf8');

// Ensure PinScreen is imported
if (!content.includes('PinScreen')) {
    content = content.replace(
        'import { FieldShell } from "@/components/field-shell";',
        'import { FieldShell } from "@/components/field-shell";\nimport { PinScreen } from "@/components/pin-screen";'
    );
}

// Wrap FieldShell in PinScreen
if (!content.includes('<PinScreen>')) {
    content = content.replace(
        '<FieldShell>',
        '<PinScreen>\n          <FieldShell>'
    );
    content = content.replace(
        '</FieldShell>',
        '</FieldShell>\n        </PinScreen>'
    );
}

fs.writeFileSync('src/routes/__root.tsx', content, 'utf8');

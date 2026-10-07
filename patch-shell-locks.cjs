const fs = require('fs');
let content = fs.readFileSync('src/components/field-shell.tsx', 'utf8');

// Add locked to fetch logic
content = content.replace(
  'if (data.value.progress) localStorage.setItem("ges-progress-v1", data.value.progress);',
  'if (data.value.progress) localStorage.setItem("ges-progress-v1", data.value.progress);\n        if (data.value.locked) localStorage.setItem("ges-locked-v1", data.value.locked);'
);

// Add locked to autoSync logic
content = content.replace(
  'teams: localStorage.getItem("ges-teams")',
  'teams: localStorage.getItem("ges-teams"),\n      locked: localStorage.getItem("ges-locked-v1")'
);

fs.writeFileSync('src/components/field-shell.tsx', content, 'utf8');

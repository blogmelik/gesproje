const fs = require('fs');
let content = fs.readFileSync('src/components/desktop-progress-pane.tsx', 'utf8');

// Ensure Lock, Unlock icons are imported
if (!content.includes('Lock,')) {
    content = content.replace('Table2,', 'Table2, Lock, Unlock,');
}

// Extract the destructured variables from useFieldData
content = content.replace(
  'const { draftData, stageItem } = useFieldData();',
  'const { draftData, stageItem, locks, toggleLock } = useFieldData();\n  const isElectron = window.navigator.userAgent.toLowerCase().includes(\'electron\');'
);

// Update the Table Row rendering
const searchStr = '<th scope="row" className="border px-2 py-1.5 text-left font-semibold">{tableName}</th>';
const replaceStr = `<th scope="row" className="border px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isElectron ? (
                            <button 
                              onClick={() => toggleLock(key)}
                              className={\`p-1 rounded hover:bg-muted \${locks[key] ? 'text-destructive' : 'text-muted-foreground'}\`}
                              title={locks[key] ? "Kilidi Ac" : "Kilitle"}
                            >
                              {locks[key] ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                            </button>
                          ) : (
                            locks[key] && <Lock className="size-4 text-destructive" title="Kilitli" />
                          )}
                          <span>{tableName}</span>
                        </div>
                      </th>`;

content = content.replace(searchStr, replaceStr);

// Disable the input if locked
content = content.replace(
  'className="h-8 min-w-0 flex-1 px-1.5 text-right text-sm tabular-nums md:text-sm" />',
  'disabled={locks[key]} className="h-8 min-w-0 flex-1 px-1.5 text-right text-sm tabular-nums md:text-sm disabled:opacity-50 disabled:cursor-not-allowed" />'
);

fs.writeFileSync('src/components/desktop-progress-pane.tsx', content, 'utf8');

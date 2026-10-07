const fs = require('fs');
let content = fs.readFileSync('src/routes/rapor-yaz.tsx', 'utf8');

// Ensure Lock icon is imported
if (!content.includes('Lock,')) {
    content = content.replace('Minus, Plus, ', 'Minus, Plus, Lock, ');
    if (!content.includes('Lock,')) {
        content = content.replace('Minus, ', 'Minus, Lock, ');
    }
}

// Add locks to useFieldData
content = content.replace(
  'const { draftData: data, stationPct, stageItem: setItem, pendingCount, saveChanges } = useFieldData();',
  'const { draftData: data, stationPct, stageItem: setItem, pendingCount, saveChanges, locks } = useFieldData();'
);

// Disable the - button
content = content.replace(
  '<Button variant="outline" size="icon" disabled={value === 0}',
  '<Button variant="outline" size="icon" disabled={value === 0 || locks[key]}'
);

// Disable the + button
content = content.replace(
  '<Button size="icon" disabled={value >= item.target}',
  '<Button size="icon" disabled={value >= item.target || locks[key]}'
);

// Disable the input
content = content.replace(
  'onChange={event => setItem(key, index, Number(event.target.value))} className="h-12',
  'onChange={event => setItem(key, index, Number(event.target.value))} disabled={locks[key]} className="h-12 disabled:opacity-50 disabled:cursor-not-allowed '
);

// Add lock indicator to table name
const searchTableName = '<h4 className="text-sm font-semibold text-muted-foreground">{tableName}</h4>';
const replaceTableName = `<h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                      {locks[key] && <Lock className="size-4 text-destructive" />}
                      {tableName}
                      {locks[key] && <span className="text-xs text-destructive ml-1">Kilitli</span>}
                    </h4>`;
content = content.replace(searchTableName, replaceTableName);

fs.writeFileSync('src/routes/rapor-yaz.tsx', content, 'utf8');

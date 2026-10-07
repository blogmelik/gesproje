const fs = require('fs');
let content = fs.readFileSync('src/lib/field-data.tsx', 'utf8');

// Add locks state
content = content.replace(
  'const [pending, setPending] = useState<Data>({});',
  'const [pending, setPending] = useState<Data>({});\n    const [locks, setLocks] = useState<Record<string, boolean>>({});'
);

content = content.replace(
  'const stored = parseStoredProgress(localStorage.getItem(PROGRESS_STORAGE_KEY));',
  `const stored = parseStoredProgress(localStorage.getItem(PROGRESS_STORAGE_KEY));
        try {
          const storedLocks = JSON.parse(localStorage.getItem("ges-locked-v1") || "{}");
          setLocks(storedLocks);
        } catch { /* ignore */ }`
);

content = content.replace(
  'try { localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ committed: sparse(data), pending })); }',
  `try { localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ committed: sparse(data), pending })); }`
);

// We need a separate useEffect to save locks
content = content.replace(
  'const draftData = useMemo(() => ({ ...data, ...pending }), [data, pending]);',
  `useEffect(() => {
      if (!loaded) return;
      try { localStorage.setItem("ges-locked-v1", JSON.stringify(locks)); }
      catch { /* storage full */ }
    }, [locks, loaded]);
    
    const toggleLock = (key: string) => {
      setLocks(prev => {
        const next = { ...prev };
        if (next[key]) delete next[key];
        else next[key] = true;
        return next;
      });
    };

    const draftData = useMemo(() => ({ ...data, ...pending }), [data, pending]);`
);

// Update FieldDataContextType
content = content.replace(
  'saveChanges: () => void;',
  `saveChanges: () => void;
  locks: Record<string, boolean>;
  toggleLock: (key: string) => void;`
);

// Add to context value
content = content.replace(
  'sumRange: (filter: (key: string) => boolean) => ReturnType<typeof sumRange>',
  `sumRange: (filter: (key: string) => boolean) => ReturnType<typeof sumRange>, locks, toggleLock`
);

fs.writeFileSync('src/lib/field-data.tsx', content, 'utf8');

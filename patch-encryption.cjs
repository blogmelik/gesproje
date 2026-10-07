const fs = require('fs');
let content = fs.readFileSync('src/components/field-shell.tsx', 'utf8');

// Add crypto-js import
if (!content.includes('import CryptoJS from "crypto-js";')) {
    content = content.replace(
        'import { toast } from "sonner";',
        'import { toast } from "sonner";\nimport CryptoJS from "crypto-js";'
    );
}

// AES key
const AES_KEY = '"OzgunInsaat2026SahaTakip$!"';

// In fetchCloudData, decrypt the payload
const fetchSearch = `const { data, error } = await supabase.from('sync_store').select('value').eq('key', 'device-demo').single();
      if (error) throw error;
      
      if (data && data.value) {`;

const fetchReplace = `const { data, error } = await supabase.from('sync_store').select('value').eq('key', 'device-demo').single();
      if (error) throw error;
      
      if (data && data.value) {
        // Decrypt payload
        try {
          if (typeof data.value === 'string' && data.value.startsWith('U2FsdGVk')) {
            const bytes = CryptoJS.AES.decrypt(data.value, ${AES_KEY});
            data.value = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          }
        } catch(e) { console.error("Decryption failed", e); }
`;
content = content.replace(fetchSearch, fetchReplace);


// In autoSync, encrypt the payload
const syncSearch = `const { error } = await supabase
          .from('sync_store')
          .upsert({ 
            key: 'device-demo', 
            value: JSON.parse(payloadStr),
            updated_at: new Date().toISOString()
          });`;

const syncReplace = `
        // Encrypt payload
        const encryptedPayload = CryptoJS.AES.encrypt(payloadStr, ${AES_KEY}).toString();

        const { error } = await supabase
          .from('sync_store')
          .upsert({ 
            key: 'device-demo', 
            value: encryptedPayload, // Save as encrypted string instead of JSON object
            updated_at: new Date().toISOString()
          });`;

content = content.replace(syncSearch, syncReplace);

fs.writeFileSync('src/components/field-shell.tsx', content, 'utf8');


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.resolve(__dirname, '../../iwhome.app-csv-data');
const OUT_DIR = path.resolve(__dirname, '../seed_data');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR);
}

function parseCSV(content) {
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Simple CSV parser handling quoted fields with commas
    const parseLine = (text) => {
        const result = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
                if (inQuote && text[i + 1] === '"') {
                    // Escaped quote
                    cur += '"';
                    i++;
                } else {
                    // Toggle quote
                    inQuote = !inQuote;
                }
            } else if (char === ',' && !inQuote) {
                result.push(cur);
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur);
        return result;
    };

    const headers = parseLine(lines[0]);

    return lines.slice(1).map(line => {
        const values = parseLine(line);
        const obj = {};
        headers.forEach((h, i) => {
            let val = values[i];
            if (val === undefined) return;

            // Type conversions based on field name
            if (h === 'members' || h === 'shared_with' || h === 'signed_by' || h === 'documenti_collegati' || h === 'preventivi_collegati') {
                try {
                    // Handle double-escaped quotes if present in CSV
                    val = val.replace(/""/g, '"');
                    if (val.startsWith("[") && val.endsWith("]")) {
                        obj[h] = JSON.parse(val);
                    } else {
                        obj[h] = [];
                    }
                } catch (e) {
                    console.warn(`Failed to parse array for ${h}: ${val}`);
                    obj[h] = [];
                }
            } else if (h === 'is_public' || h === 'requires_signature' || h === 'read') {
                obj[h] = val === 'true'; // Convert to boolean? Schema says optional string for is_public in documents, boolean for read in notifications
                // Check schema: 
                // documents.is_public is string (optional) in my update?
                // Actually I set it to optional string: v.optional(v.string())
                // But CSV says "false". So string "false" is correct for string type.
                // However notifications.read is v.boolean().
                if (h === 'read' || h === 'is_company') {
                    obj[h] = val === 'true';
                } else {
                    obj[h] = val; // keep as string "true"/"false" for is_public if schema expects string
                }
            } else if (h === 'file_size' || h === 'valore_contratto' || h === 'costi_effettivi' || h === 'progresso' || h === 'estimated_price') {
                obj[h] = parseFloat(val) || 0;
            } else {
                obj[h] = val;
            }
        });

        // Remove fields not in schema or that should be ignored
        delete obj.id;
        delete obj.created_by_id;
        delete obj.updated_date;
        delete obj.folder_id; // Not in schema currently
        delete obj.shared_with; // Not in schema
        delete obj.permissions; // Not in schema
        delete obj.requires_signature; // Not in schema
        delete obj.signed_by; // Not in schema
        delete obj.current_version; // Not in schema

        return obj;
    });
}

function convert(filename, targetName) {
    const csvPath = path.join(CSV_DIR, filename);
    if (!fs.existsSync(csvPath)) {
        console.log(`Skipping ${filename} (not found)`);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(content);
    if (data.length === 0) {
        console.log(`Skipping ${filename} (empty)`);
        return;
    }

    const jsonl = data.map(d => JSON.stringify(d)).join('\n');
    const outPath = path.join(OUT_DIR, targetName + '.jsonl');
    fs.writeFileSync(outPath, jsonl);
    console.log(`Converted ${filename} -> ${targetName}.jsonl (${data.length} records)`);
}

convert('Appointment_export.csv', 'appointments');
convert('Document_export.csv', 'documents');
convert('ChatChannel_export.csv', 'chat_channels');
// Add logic for ChannelMessages if needed, mapping to channel_messages
convert('ChannelMessage_export.csv', 'channel_messages');

convert('Cantiere_export.csv', 'cantieri');
convert('TaskCantiere_export.csv', 'tasks');
convert('Notification_export.csv', 'notifications');
convert('CompanyTeam_export.csv', 'company_teams');

console.log('Conversion complete. Check Backend/seed_data/');

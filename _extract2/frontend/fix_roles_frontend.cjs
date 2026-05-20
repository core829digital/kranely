const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'iwhome.app-base44sdk', 'src');

function walkDir(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
        const fullPath = path.join(currentPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Arrays in useRBAC.js
            content = content.replace(/"ceo"(,\s*)?/g, '');
            content = content.replace(/"supervisor"(,\s*)?/g, '');
            content = content.replace(/"worker"(,\s*)?/g, '');
            content = content.replace(/"operaio"(,\s*)?/g, '');
            content = content.replace(/"collaborator_internal"(,\s*)?/g, '"collaborator", ');
            content = content.replace(/"collaborator_external"(,\s*)?/g, '');
            // Clean up double commas or trailing commas in arrays
            content = content.replace(/,\s*,/g, ',');
            content = content.replace(/,\s*\]/g, ']');

            // Role checks
            content = content.replace(/!==\s*"ceo"/g, '');
            content = content.replace(/&& convexUser\.role !== ""/g, ''); // cleanup
            content = content.replace(/convexUser\.role !== "admin" && convexUser\.role !== /g, 'convexUser.role !== "admin"');
            
            content = content.replace(/role\s*===\s*"ceo"/g, 'false');
            content = content.replace(/\|\|\s*false/g, '');
            
            content = content.replace(/\["collaborator", \]\.includes\(role\)/g, 'role === "collaborator"');
            content = content.replace(/\["collaborator", "collaborator", \]\.includes/g, '["collaborator"].includes');
            content = content.replace(/\["collaborator", \]\.includes/g, '["collaborator"].includes');
            
            content = content.replace(/const isSupervisor = .*?;/g, 'const isSupervisor = false;');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${file}`);
            }
        }
    }
}

walkDir(dir);
console.log("Done.");

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'convex');

function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
        const fullPath = path.join(currentPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Replacements
            // 1. Array roles: ["admin", "ceo"] -> ["admin"]
            content = content.replace(/\[\s*"admin"\s*,\s*"ceo"\s*\]/g, '["admin"]');
            content = content.replace(/\[\s*"ceo"\s*,\s*"admin"\s*\]/g, '["admin"]');
            // with supervisor, worker
            content = content.replace(/,\s*"ceo"/g, '');
            content = content.replace(/"ceo"\s*,\s*/g, '');
            content = content.replace(/,\s*"supervisor"/g, '');
            content = content.replace(/"supervisor"\s*,\s*/g, '');
            content = content.replace(/,\s*"worker"/g, '');
            content = content.replace(/"worker"\s*,\s*/g, '');
            // 2. collaborator_internal and collaborator_external -> collaborator
            content = content.replace(/"collaborator_internal"/g, '"collaborator"');
            content = content.replace(/"collaborator_external"/g, '"collaborator"');
            content = content.replace(/caller\.role === "collaborator" \|\| caller\.role === "collaborator"/g, 'caller.role === "collaborator"');
            
            // 3. ceo explicit checks
            content = content.replace(/caller\.role === "admin" \|\| caller\.role === "ceo"/g, 'caller.role === "admin"');
            content = content.replace(/user\.role !== "admin" && user\.role !== "ceo"/g, 'user.role !== "admin"');
            content = content.replace(/user\?\.role !== "admin" && user\?\.role !== "ceo"/g, 'user?.role !== "admin"');
            content = content.replace(/user\?\.role === 'admin' \|\| user\?\.role === 'ceo'/g, "user?.role === 'admin'");
            content = content.replace(/targetUser\.role === "admin" \|\| targetUser\.role === "ceo"/g, 'targetUser.role === "admin"');
            
            // 4. Role documentation
            content = content.replace(/admin, ceo, client, worker, supervisor/g, 'admin, client');
            content = content.replace(/ceo, admin, supervisor, worker/g, 'admin');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${file}`);
            }
        }
    }
}

walkDir(dir);
console.log("Done.");

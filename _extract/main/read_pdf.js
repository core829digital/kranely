const fs = require('fs');
const path = require('path');

// Simple PDF text extractor - reads raw text from PDF streams
const pdfPath = path.join(__dirname, 'IWHome Debug Feature Prompt.pdf');
const buffer = fs.readFileSync(pdfPath);
const content = buffer.toString('latin1');

// Extract text between stream markers
const streams = [];
let idx = 0;
while (true) {
    const streamStart = content.indexOf('stream\r\n', idx);
    if (streamStart === -1) break;
    const streamEnd = content.indexOf('\r\nendstream', streamStart);
    if (streamEnd === -1) break;
    const streamContent = content.substring(streamStart + 8, streamEnd);
    streams.push(streamContent);
    idx = streamEnd + 11;
}

// Try to extract readable text
let text = '';
for (const stream of streams) {
    // Look for text operators in PDF content streams
    const tjMatches = stream.match(/\(([^)]*)\)/g);
    if (tjMatches) {
        for (const match of tjMatches) {
            const cleaned = match.slice(1, -1)
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '')
                .replace(/\\t/g, ' ')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')')
                .replace(/\\\\/g, '\\');
            if (cleaned.length > 1 && /[a-zA-Z0-9àèìòùáéíóú]/.test(cleaned)) {
                text += cleaned;
            }
        }
        text += '\n';
    }
}

if (text.trim().length > 100) {
    fs.writeFileSync(path.join(__dirname, 'pdf_content.txt'), text, 'utf8');
    console.log('Extracted text successfully');
    console.log(text.substring(0, 2000));
} else {
    console.log('Simple extraction failed, trying alternative...');
    // Try UTF-16 text extraction
    const hexMatches = content.match(/<([0-9A-Fa-f\s]+)>/g);
    let hexText = '';
    if (hexMatches) {
        for (const match of hexMatches) {
            const hex = match.slice(1, -1).replace(/\s/g, '');
            if (hex.length > 4) {
                let decoded = '';
                for (let i = 0; i < hex.length; i += 4) {
                    const code = parseInt(hex.substr(i, 4), 16);
                    if (code >= 32 && code < 65536) {
                        decoded += String.fromCharCode(code);
                    }
                }
                if (/[a-zA-Z]/.test(decoded)) {
                    hexText += decoded + ' ';
                }
            }
        }
    }
    if (hexText.trim().length > 50) {
        fs.writeFileSync(path.join(__dirname, 'pdf_content.txt'), hexText, 'utf8');
        console.log('Hex extraction result:');
        console.log(hexText.substring(0, 2000));
    } else {
        console.log('Could not extract meaningful text from PDF');
        console.log('First 500 bytes (raw):', content.substring(0, 500));
    }
}

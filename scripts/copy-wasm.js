import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../node_modules/swisseph-wasm/wsam');
const destDir = path.resolve(__dirname, '../public');

const files = ['swisseph.wasm', 'swisseph.data'];

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

files.forEach(file => {
    const src = path.join(srcDir, file);
    const dest = path.join(destDir, file);

    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file} to public/`);
    } else {
        console.error(`Source file not found: ${src}`);
        process.exit(1);
    }
});

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to copy
const filesToCopy = ['wizard.html', 'vote.html', 'result.html'];

// Copy each file
filesToCopy.forEach(file => {
  const sourcePath = path.join(__dirname, 'src', file);
  const destPath = path.join(__dirname, 'dist', file);
  
  try {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${file} to dist/`);
  } catch (error) {
    console.error(`❌ Error copying ${file}:`, error.message);
    process.exit(1);
  }
});

console.log('🎉 All HTML files copied successfully!'); 
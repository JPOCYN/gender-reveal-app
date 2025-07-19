import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directories if they don't exist
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Copy directory recursively
const copyDir = (src, dest) => {
  createDirIfNotExists(dest);
  const items = fs.readdirSync(src);
  
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${item} to ${dest}/`);
    }
  });
};

// Copy HTML files
const htmlFiles = ['wizard.html', 'vote.html', 'result.html', 'debug.html'];
htmlFiles.forEach(file => {
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

// Copy js and config directories
const dirsToCopy = ['js', 'config'];
dirsToCopy.forEach(dir => {
  const srcDir = path.join(__dirname, 'src', dir);
  const destDir = path.join(__dirname, 'dist', dir);
  
  if (fs.existsSync(srcDir)) {
    copyDir(srcDir, destDir);
  } else {
    console.log(`⚠️  Directory ${dir} not found, skipping...`);
  }
});

console.log('🎉 All files copied successfully!'); 
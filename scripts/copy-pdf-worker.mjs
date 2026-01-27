import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");
const outFile = path.join(publicDir, "pdf.worker.min.mjs");

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

fs.mkdirSync(publicDir, { recursive: true });

const candidates = [
  path.join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
  path.join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs"),
  path.join(root, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.mjs"),
  path.join(root, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")
];

const src = candidates.find(exists);
if (!src) {
  console.error("[postinstall] pdfjs worker not found in pdfjs-dist. Please reinstall pdfjs-dist.");
  process.exit(0);
}

fs.copyFileSync(src, outFile);
console.log(`[postinstall] Copied PDF.js worker -> ${path.relative(root, outFile)}`);

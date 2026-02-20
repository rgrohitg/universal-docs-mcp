import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Set the storage directory before any crawlee module is actually loaded.
process.env.CRAWLEE_STORAGE_DIR = path.join(projectRoot, 'storage');

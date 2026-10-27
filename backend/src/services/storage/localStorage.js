import fs from 'fs/promises';
import path from 'path';
import { storageRoot } from '../../config/env.js';

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export const localStorage = {
  async saveUpload(file, subdir = 'uploads') {
    const destDir = path.join(storageRoot, subdir);
    await ensureDir(destDir);
    const dest = path.join(destDir, file.filename);
    if (file.path !== dest) {
      await fs.rename(file.path, dest);
    }
    return {
      absolutePath: dest,
      relativePath: path.join(subdir, file.filename).replace(/\\/g, '/'),
      key: path.join(subdir, file.filename).replace(/\\/g, '/'),
    };
  },

  async saveBuffer(buffer, relativePath) {
    const absolute = path.join(storageRoot, relativePath);
    await ensureDir(path.dirname(absolute));
    await fs.writeFile(absolute, buffer);
    return {
      absolutePath: absolute,
      relativePath: relativePath.replace(/\\/g, '/'),
      key: relativePath.replace(/\\/g, '/'),
    };
  },

  resolve(relativePath) {
    const safe = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(storageRoot, safe);
  },

  async exists(relativePath) {
    try {
      await fs.access(this.resolve(relativePath));
      return true;
    } catch {
      return false;
    }
  },

  async remove(relativePath) {
    try {
      await fs.unlink(this.resolve(relativePath));
    } catch {
      /* ignore */
    }
  },
};

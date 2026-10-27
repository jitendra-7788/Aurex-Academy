import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env, storageRoot } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import fs from 'fs';

const uploadsDir = path.join(storageRoot, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const videoMimeTypes = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]);

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

function fileFilter(allowed) {
  return (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      return cb(new AppError(`Unsupported file type: ${file.mimetype}`, 400));
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.exe', '.bat', '.cmd', '.sh', '.ps1', '.js', '.msi'].includes(ext)) {
      return cb(new AppError('Executable uploads are not allowed', 400));
    }
    cb(null, true);
  };
}

export const uploadVideo = multer({
  storage: diskStorage,
  limits: { fileSize: env.uploadMaxMb * 1024 * 1024 },
  fileFilter: fileFilter(videoMimeTypes),
}).single('video');

export const uploadThumbnail = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(imageMimeTypes),
}).single('thumbnail');

export const uploadResource = multer({
  storage: diskStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
}).single('resource');

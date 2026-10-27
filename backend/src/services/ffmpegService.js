import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { env, storageRoot } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

function resolveBinary(preferred, fallbackName) {
  if (preferred && fs.existsSync(preferred)) return preferred;
  return fallbackName;
}

export function getFfmpegPath() {
  return resolveBinary(env.ffmpegPath, 'ffmpeg');
}

export function getFfprobePath() {
  return resolveBinary(env.ffprobePath, 'ffprobe');
}

export async function checkFfmpegAvailable() {
  return new Promise((resolve) => {
    const proc = spawn(getFfmpegPath(), ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

function runCommand(bin, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout || stderr);
      else reject(new Error(stderr || stdout || `${bin} exited with ${code}`));
    });
  });
}

export async function probeDurationSeconds(inputPath) {
  try {
    const out = await runCommand(getFfprobePath(), [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      inputPath,
    ]);
    const duration = Number(out.trim().split('\n').pop());
    return Number.isFinite(duration) ? Math.round(duration) : 0;
  } catch {
    return 0;
  }
}

export async function processToHls({ inputPath, courseId, lessonId }) {
  const available = await checkFfmpegAvailable();
  if (!available) {
    throw new AppError('FFmpeg is not installed or not available on PATH', 500);
  }

  const outDir = path.join(storageRoot, 'hls', String(courseId), String(lessonId));
  fs.mkdirSync(outDir, { recursive: true });
  const playlist = path.join(outDir, 'index.m3u8');
  const segmentPattern = path.join(outDir, 'segment_%03d.ts');

  await runCommand(getFfmpegPath(), [
    '-y',
    '-i',
    inputPath,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-c:a',
    'aac',
    '-start_number',
    '0',
    '-hls_time',
    '6',
    '-hls_list_size',
    '0',
    '-f',
    'hls',
    '-hls_segment_filename',
    segmentPattern,
    playlist,
  ]);


  const durationSeconds = await probeDurationSeconds(inputPath);
  const relativeHls = path
    .join('hls', String(courseId), String(lessonId), 'index.m3u8')
    .replace(/\\/g, '/');

  return {
    hlsPath: playlist,
    hlsKey: relativeHls,
    durationSeconds,
  };
}

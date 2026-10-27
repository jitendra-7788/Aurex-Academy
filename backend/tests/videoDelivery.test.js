import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { processToHls, checkFfmpegAvailable, probeDurationSeconds } from '../src/services/ffmpegService.js';
import { getVideoDeliveryUrl, getDeliveryMode } from '../src/services/videoDelivery.js';
import { storageRoot, env } from '../src/config/env.js';

describe('Video processing & Delivery', () => {
  const tmpVideo = path.join(storageRoot, 'test_sample.mp4');

  beforeAll(async () => {
    // Generate a quick synthetic 2-second test video with FFmpeg
    await new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', [
        '-y',
        '-f',
        'lavfi',
        '-i',
        'testsrc=duration=2:size=320x240:rate=30',
        '-c:v',
        'libx264',
        tmpVideo,
      ]);
      proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))));
    });
  });

  afterAll(async () => {
    if (fs.existsSync(tmpVideo)) fs.unlinkSync(tmpVideo);
    const testDir = path.join(storageRoot, 'hls', 'c_test');
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('detects ffmpeg is installed and available', async () => {
    const ok = await checkFfmpegAvailable();
    expect(ok).toBe(true);
  });

  it('probes video duration accurately', async () => {
    const duration = await probeDurationSeconds(tmpVideo);
    expect(duration).toBeGreaterThanOrEqual(2);
  });

  it('converts an MP4 video into an HLS playlist with segments', async () => {
    const result = await processToHls({
      inputPath: tmpVideo,
      courseId: 'c_test',
      lessonId: 'l_test',
    });

    expect(fs.existsSync(result.hlsPath)).toBe(true);
    const content = fs.readFileSync(result.hlsPath, 'utf8');
    expect(content).toContain('#EXTM3U');
    expect(content).toContain('.ts');
    expect(result.durationSeconds).toBeGreaterThanOrEqual(2);
  });

  it('generates local delivery URL by default', () => {
    const url = getVideoDeliveryUrl({ hlsKey: 'hls/c_test/l_test/index.m3u8' });
    expect(url).toContain('/media/hls/c_test/l_test/index.m3u8');
    expect(getDeliveryMode()).toBe('local');
  });
});
